import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { generateTokens } from '@/lib/tickets'
import { sendTicketEmail, sendWaitlistEmail } from '@/lib/email'
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

    // ── Verificar si ya está registrado ──
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

    // ── Verificar si ya está en waitlist ──
    const existingWaitlist = await payload.find({
      collection: 'waitlist',
      where: {
        email: { equals: normalizedEmail },
        status: { equals: 'waiting' },
      },
    })

    if (existingWaitlist.totalDocs > 0) {
      return NextResponse.json(
        {
          error: 'already_waitlisted',
          message: 'Ya estás en la lista de espera',
          position: existingWaitlist.docs[0].position,
        },
        { status: 409 },
      )
    }

    // ── Contar tickets activos ──
    const activeTickets = await payload.find({
      collection: 'tickets',
      where: {
        status: { not_equals: 'cancelled' },
      },
      limit: 0,
    })

    // ── ¿Hay plazas disponibles? ──
    if (activeTickets.totalDocs >= EVENT.maxTickets) {
      // LISTA DE ESPERA
      const waitlistCount = await payload.find({
        collection: 'waitlist',
        where: {
          status: { in: ['waiting', 'notified'] },
        },
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

      // Enviar email de waitlist
      await sendWaitlistEmail({
        to: normalizedEmail,
        position,
        name,
      })

      return NextResponse.json({
        success: true,
        type: 'waitlist',
        position,
        message: `Entradas agotadas. Estás en la posición #${position} de la lista de espera.`,
      })
    }

    // ── CREAR TICKET ──
    const tokens = generateTokens()

    // Verificar que el ticketCode no exista (colisión muy improbable)
    let finalTicketCode = tokens.ticketCode
    const codeExists = await payload.find({
      collection: 'tickets',
      where: { ticketCode: { equals: finalTicketCode } },
    })
    if (codeExists.totalDocs > 0) {
      finalTicketCode = generateTokens().ticketCode // Regenerar
    }

    const ticket = await payload.create({
      collection: 'tickets',
      data: {
        email: normalizedEmail,
        name: name || undefined,
        authProvider: provider,
        ticketCode: finalTicketCode,
        qrToken: tokens.qrToken,
        cancelToken: tokens.cancelToken,
        status: 'confirmed',
        drinkRedeemed: false,
      },
    })

    // ── Enviar email con QR ──
    try {
      await sendTicketEmail({
        to: normalizedEmail,
        ticketCode: finalTicketCode,
        qrToken: tokens.qrToken,
        cancelToken: tokens.cancelToken,
        name,
      })
    } catch (emailError) {
      console.error('Error enviando email (ticket creado):', emailError)
      // El ticket se creó, el email se puede reenviar después
    }

    return NextResponse.json({
      success: true,
      type: 'ticket',
      ticketCode: finalTicketCode,
      message: '¡Entrada registrada! Revisa tu email.',
      remaining: EVENT.maxTickets - (activeTickets.totalDocs + 1),
    })
  } catch (error: any) {
    console.error('Error en registro:', error)

    // Error de unique constraint (doble registro concurrente)
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: 'Este email ya tiene una entrada registrada' },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
