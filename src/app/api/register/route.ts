import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { generateTokens } from '@/lib/tickets'
import { sendTicketEmail, sendWaitlistEmail, sendOrganizerNotification } from '@/lib/email'
import { EVENT } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name, provider = 'email' } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email válido requerido' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const payload = await getPayload({ config: configPromise })

    // ── Ya registrado? ──
    const existing = await payload.find({
      collection: 'tickets',
      where: {
        email: { equals: normalizedEmail },
        status: { not_equals: 'cancelled' },
      },
    })

    if (existing.totalDocs > 0) {
      return NextResponse.json(
        {
          error: 'already_registered',
          message: 'Este email ya tiene una entrada registrada',
          ticketCode: existing.docs[0].ticketCode,
        },
        { status: 409 },
      )
    }

    // ── Ya en waitlist? ──
    const existingWL = await payload.find({
      collection: 'waitlist',
      where: {
        email: { equals: normalizedEmail },
        status: { equals: 'waiting' },
      },
    })

    if (existingWL.totalDocs > 0) {
      return NextResponse.json(
        {
          error: 'already_waitlisted',
          message: 'Ya estás en la lista de espera',
          position: existingWL.docs[0].position,
        },
        { status: 409 },
      )
    }

    // ── Contar tickets activos ──
    const activeTickets = await payload.find({
      collection: 'tickets',
      where: { status: { not_equals: 'cancelled' } },
      limit: 0,
    })

    const currentCount = activeTickets.totalDocs

    // ── SOLD OUT → WAITLIST ──
    if (currentCount >= EVENT.maxTickets) {
      const waitlistCount = await payload.find({
        collection: 'waitlist',
        where: { status: { in: ['waiting', 'notified'] } },
        limit: 0,
      })

      const position = waitlistCount.totalDocs + 1

      await payload.create({
        collection: 'waitlist',
        data: {
          email: normalizedEmail,
          name: name || undefined,
          position,
          status: 'waiting',
        },
      })

      // Email asíncrono — no bloquear la respuesta
      sendWaitlistEmail({ to: normalizedEmail, position, name }).catch((err) =>
        console.error('Error email waitlist:', err),
      )

      return NextResponse.json({
        success: true,
        type: 'waitlist',
        position,
        message: `Entradas agotadas. Estás en la posición #${position} de la lista de espera.`,
      })
    }

    // ── CREAR TICKET ──
    const tokens = generateTokens()
    const ticketNumber = currentCount + 1

    const ticket = await payload.create({
      collection: 'tickets',
      data: {
        email: normalizedEmail,
        name: name || undefined,
        authProvider: provider,
        ticketCode: tokens.ticketCode,
        qrToken: tokens.qrToken,
        cancelToken: tokens.cancelToken,
        status: 'confirmed',
        drinkRedeemed: false,
      },
    })

    // ── Enviar emails (no bloquear respuesta) ──
    const emailPromises = [
      // 1) Email al asistente
      sendTicketEmail({
        to: normalizedEmail,
        ticketCode: tokens.ticketCode,
        qrToken: tokens.qrToken,
        cancelToken: tokens.cancelToken,
        name,
      }),
      // 2) Email al organizador
      sendOrganizerNotification({
        attendeeEmail: normalizedEmail,
        attendeeName: name,
        ticketCode: tokens.ticketCode,
        ticketNumber,
        totalTickets: EVENT.maxTickets,
      }),
    ]

    // Ejecutar en paralelo sin bloquear
    Promise.allSettled(emailPromises).then((results) => {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`❌ Error en email ${i}:`, result.reason)
        }
      })
    })

    return NextResponse.json({
      success: true,
      type: 'ticket',
      ticketCode: tokens.ticketCode,
      message: '¡Entrada registrada! Revisa tu email.',
      remaining: EVENT.maxTickets - ticketNumber,
    })
  } catch (error: any) {
    console.error('Error en registro:', error)

    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Este email ya tiene una entrada registrada' },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
