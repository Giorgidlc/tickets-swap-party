import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(req: NextRequest) {
  const pin = req.nextUrl.searchParams.get('pin')

  if (pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: 'PIN requerido' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    const tickets = await payload.find({
      collection: 'tickets',
      limit: 25,
      sort: '-createdAt',
    })

    const summary = tickets.docs.map((t) => ({
      id: t.id,
      ticketCode: t.ticketCode,
      email: t.email,
      status: t.status,
      qrToken: t.qrToken,
      qrTokenPreview: String(t.qrToken).substring(0, 12) + '...',
      qrTokenLength: String(t.qrToken).length,
      createdAt: t.createdAt,
    }))

    return NextResponse.json({
      total: tickets.totalDocs,
      tickets: summary,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
