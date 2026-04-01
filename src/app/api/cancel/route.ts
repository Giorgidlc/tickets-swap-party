import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { generateTokens } from '@/lib/tickets'
import { sendPromotedEmail, sendOrganizerNotification } from '@/lib/email'
import { EVENT } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cancelToken } = body

    if (!cancelToken) {
      return NextResponse.json({ error: 'Token de cancelación requerido' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const tickets = await payload.find({
      collection: 'tickets',
      where: { cancelToken: { equals: cancelToken } },
    })

    if (tickets.totalDocs === 0) {
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
    }

    const ticket = tickets.docs[0]

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ error: 'Ya cancelada' }, { status: 400 })
    }

    if (ticket.status === 'attended') {
      return NextResponse.json(
        { error: 'No se puede cancelar una entrada ya utilizada' },
        { status: 400 },
      )
    }

    // ── Cancelar ──
    await payload.update({
      collection: 'tickets',
      id: ticket.id,
      data: {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      },
    })

    // ── Promover primera persona de waitlist ──
    const waitlist = await payload.find({
      collection: 'waitlist',
      where: { status: { equals: 'waiting' } },
      sort: 'position',
      limit: 1,
    })

    if (waitlist.totalDocs > 0) {
      const next = waitlist.docs[0]
      const tokens = generateTokens()

      // Contar tickets activos para saber el número
      const activeCount = await payload.find({
        collection: 'tickets',
        where: { status: { not_equals: 'cancelled' } },
        limit: 0,
      })

      try {
        await payload.create({
          collection: 'tickets',
          data: {
            email: next.email,
            name: next.name || undefined,
            authProvider: 'email',
            ticketCode: tokens.ticketCode,
            qrToken: tokens.qrToken,
            cancelToken: tokens.cancelToken,
            status: 'confirmed',
            drinkRedeemed: false,
          },
        })

        await payload.update({
          collection: 'waitlist',
          id: next.id,
          data: { status: 'promoted' },
        })

        // Emails: al promovido + al organizador
        Promise.allSettled([
          sendPromotedEmail({
            to: next.email,
            ticketCode: tokens.ticketCode,
            qrToken: tokens.qrToken,
            cancelToken: tokens.cancelToken,
            name: next.name || undefined,
          }),
          sendOrganizerNotification({
            attendeeEmail: next.email,
            attendeeName: next.name || undefined,
            ticketCode: tokens.ticketCode,
            ticketNumber: activeCount.totalDocs + 1,
            totalTickets: EVENT.maxTickets,
          }),
        ]).catch(console.error)
      } catch (err) {
        console.error('Error promoviendo de waitlist:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Tu entrada ha sido cancelada. ¡Gracias por liberar tu plaza!',
    })
  } catch (error) {
    console.error('Error cancelando:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
