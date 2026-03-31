import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { EVENT } from '@/lib/constants'

export async function GET() {
  try {
    const payload = await getPayload({ config: configPromise })

    const activeTickets = await payload.find({
      collection: 'tickets',
      where: {
        status: { not_equals: 'cancelled' },
      },
      limit: 0, // Solo queremos el totalDocs
    })

    const total = EVENT.maxTickets
    const sold = activeTickets.totalDocs
    const available = Math.max(0, total - sold)

    return NextResponse.json({
      total,
      sold,
      available,
      soldOut: available === 0,
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
