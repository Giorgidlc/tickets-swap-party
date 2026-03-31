import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { qrToken, pin } = body

    // ── Verificar PIN de admin ──
    if (pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: 'PIN inválido', valid: false }, { status: 401 })
    }

    if (!qrToken) {
      return NextResponse.json({ error: 'Token QR requerido', valid: false }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    // ── Buscar ticket por qrToken ──
    const tickets = await payload.find({
      collection: 'tickets',
      where: {
        qrToken: { equals: qrToken },
      },
    })

    if (tickets.totalDocs === 0) {
      return NextResponse.json({
        valid: false,
        status: 'not_found',
        message: '❌ Entrada no encontrada',
      })
    }

    const ticket = tickets.docs[0]

    // ── Verificar estado ──
    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        valid: false,
        status: 'cancelled',
        message: '❌ Esta entrada fue cancelada',
        email: ticket.email,
        ticketCode: ticket.ticketCode,
      })
    }

    if (ticket.status === 'attended') {
      return NextResponse.json({
        valid: false,
        status: 'already_attended',
        message: '⚠️ Esta entrada ya fue utilizada',
        email: ticket.email,
        ticketCode: ticket.ticketCode,
        attendedAt: ticket.attendedAt,
      })
    }

    // ── Marcar como asistido ──
    await payload.update({
      collection: 'tickets',
      id: ticket.id,
      data: {
        status: 'attended',
        attendedAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      valid: true,
      status: 'success',
      message: '✅ ¡Entrada válida! Bienvenid@',
      email: ticket.email,
      name: ticket.name,
      ticketCode: ticket.ticketCode,
      drinkIncluded: true,
    })
  } catch (error) {
    console.error('Error validando ticket:', error)
    return NextResponse.json({ error: 'Error interno', valid: false }, { status: 500 })
  }
}
