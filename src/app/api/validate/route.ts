import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { qrToken, pin } = body

    console.log('🔍 Validate request:', {
      qrToken: qrToken ? `${String(qrToken).substring(0, 20)}...` : 'VACÍO',
      qrTokenLength: String(qrToken || '').length,
      pinProvided: !!pin,
    })

    // ── Verificar PIN ──
    if (pin !== process.env.ADMIN_PIN) {
      console.log('❌ PIN inválido')
      return NextResponse.json({ error: 'PIN inválido', valid: false }, { status: 401 })
    }

    if (!qrToken || String(qrToken).trim() === '') {
      return NextResponse.json({ error: 'Token QR requerido', valid: false }, { status: 400 })
    }

    const cleanToken = String(qrToken).trim()
    const payload = await getPayload({ config: configPromise })

    // ═══════════════════════════════════════════
    // Buscar ticket — intentamos por AMBOS campos:
    //   1. qrToken (UUID del QR)
    //   2. ticketCode (SWAP-XXXX para validación manual)
    // ═══════════════════════════════════════════

    let tickets = await payload.find({
      collection: 'tickets',
      where: {
        qrToken: { equals: cleanToken },
      },
    })

    console.log(`🔍 Búsqueda por qrToken: ${tickets.totalDocs} resultados`)

    // Si no encontró por qrToken, intentar por ticketCode
    if (tickets.totalDocs === 0) {
      tickets = await payload.find({
        collection: 'tickets',
        where: {
          ticketCode: { equals: cleanToken.toUpperCase() },
        },
      })
      console.log(`🔍 Búsqueda por ticketCode: ${tickets.totalDocs} resultados`)
    }

    // Si tampoco encontró, intentar búsqueda parcial
    // (por si el QR tiene caracteres extra)
    if (tickets.totalDocs === 0) {
      tickets = await payload.find({
        collection: 'tickets',
        where: {
          qrToken: { contains: cleanToken },
        },
      })
      console.log(`🔍 Búsqueda parcial qrToken: ${tickets.totalDocs} resultados`)
    }

    if (tickets.totalDocs === 0) {
      console.log('❌ Ticket no encontrado para token:', cleanToken)

      // Log de diagnóstico: mostrar tokens existentes (primeros 8 chars)
      const allTickets = await payload.find({
        collection: 'tickets',
        limit: 5,
      })
      const existingTokens = allTickets.docs.map((t) => ({
        code: t.ticketCode,
        qrToken: String(t.qrToken).substring(0, 12) + '...',
        status: t.status,
      }))
      console.log('📋 Tickets existentes:', JSON.stringify(existingTokens))

      return NextResponse.json({
        valid: false,
        status: 'not_found',
        message: '❌ Entrada no encontrada',
      })
    }

    const ticket = tickets.docs[0]
    console.log('✅ Ticket encontrado:', {
      id: ticket.id,
      code: ticket.ticketCode,
      status: ticket.status,
      email: ticket.email,
    })

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
        name: ticket.name,
        ticketCode: ticket.ticketCode,
        attendedAt: ticket.attendedAt,
      })
    }

    // ── Marcar como asistido ──
    const now = new Date().toISOString()

    await payload.update({
      collection: 'tickets',
      id: ticket.id,
      data: {
        status: 'attended',
        attendedAt: now,
      },
    })

    console.log(`✅ Ticket ${ticket.ticketCode} marcado como attended`)

    return NextResponse.json({
      valid: true,
      status: 'success',
      message: '✅ ¡Entrada válida! Bienvenid@',
      email: ticket.email,
      name: ticket.name,
      ticketCode: ticket.ticketCode,
      drinkIncluded: true,
    })
  } catch (error: any) {
    console.error('❌ Error en validate:', error)
    return NextResponse.json(
      {
        error: `Error interno: ${error.message}`,
        valid: false,
        status: 'error',
        message: '❌ Error del servidor',
      },
      { status: 500 },
    )
  }
}
