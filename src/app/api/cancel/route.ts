import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { generateTokens } from '@/lib/tickets'
import { sendTicketEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cancelToken } = body

    if (!cancelToken) {
      return NextResponse.json({ error: 'Token de cancelación requerido' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // ── Buscar ticket ──
    const tickets = await payload.find({
      collection: 'tickets',
      where: {
        cancelToken: { equals: cancelToken },
      },
    })

    if (tickets.totalDocs === 0) {
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 })
    }

    const ticket = tickets.docs[0]

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ error: 'Esta entrada ya fue cancelada' }, { status: 400 })
    }

    if (ticket.status === 'attended') {
      return NextResponse.json(
        { error: 'No se puede cancelar una entrada ya utilizada' },
        { status: 400 },
      )
    }

    // ── Cancelar ticket ──
    await payload.update({
      collection: 'tickets',
      id: ticket.id,
      data: {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      },
    })

    // ── Promover primera persona de la waitlist ──
    const waitlist = await payload.find({
      collection: 'waitlist',
      where: {
        status: { equals: 'waiting' },
      },
      sort: 'position',
      limit: 1,
    })

    if (waitlist.totalDocs > 0) {
      const nextInLine = waitlist.docs[0]
      const tokens = generateTokens()

      // Crear ticket para la persona promovida
      try {
        await payload.create({
          collection: 'tickets',
          data: {
            email: nextInLine.email,
            name: nextInLine.name || undefined,
            authProvider: 'email',
            ticketCode: tokens.ticketCode,
            qrToken: tokens.qrToken,
            cancelToken: tokens.cancelToken,
            status: 'confirmed',
            drinkRedeemed: false,
          },
        })

        // Actualizar waitlist
        await payload.update({
          collection: 'waitlist',
          id: nextInLine.id,
          data: { status: 'promoted' },
        })

        // Enviar email al promovido
        await sendTicketEmail({
          to: nextInLine.email,
          ticketCode: tokens.ticketCode,
          qrToken: tokens.qrToken,
          cancelToken: tokens.cancelToken,
          name: nextInLine.name || undefined,
        })
      } catch (promoteError) {
        console.error('Error promoviendo de waitlist:', promoteError)
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
