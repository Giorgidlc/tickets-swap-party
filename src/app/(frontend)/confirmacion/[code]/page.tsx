import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { generateQRDataURL } from '@/lib/qr'
import { EVENT } from '@/lib/constants'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ code: string }>
}

export default async function ConfirmacionPage({ params }: Props) {
  const { code } = await params
  const payload = await getPayload({ config: configPromise })

  const tickets = await payload.find({
    collection: 'tickets',
    where: {
      ticketCode: { equals: code.toUpperCase() },
      status: { not_equals: 'cancelled' },
    },
  })

  if (tickets.totalDocs === 0) {
    notFound()
  }

  const ticket = tickets.docs[0]
  const qrDataURL = await generateQRDataURL(ticket.qrToken as string)

  return (
    <main className="page-container">
      <div className="ticket-card">
        <div className="ticket-header">
          <h1>{EVENT.name}</h1>
          <span className="status-badge confirmed">✅ Confirmada</span>
        </div>

        <div className="ticket-body">
          {/* Código */}
          <div className="ticket-code-display">
            <small>Tu código</small>
            <span className="code">{ticket.ticketCode}</span>
          </div>

          {/* QR */}
          <div className="qr-display">
            <img src={qrDataURL} alt="QR de entrada" width={250} height={250} />
            <p>Muestra este QR en la entrada</p>
          </div>

          {/* Consumición */}
          <div className="drink-included">🍹 1 consumición incluida</div>

          {/* Detalles */}
          <div className="ticket-details">
            <div className="detail">
              <span className="label">📅 Fecha</span>
              <p>{EVENT.date}</p>
            </div>
            <div className="detail">
              <span className="label">🕐 Hora</span>
              <p>{EVENT.time}</p>
            </div>
            <div className="detail">
              <span className="label">📍 Lugar</span>
              <p>
                {EVENT.location} — {EVENT.address}
              </p>
            </div>
            <div className="detail">
              <span className="label">📧 Email</span>
              <p>{ticket.email}</p>
            </div>
          </div>
        </div>

        <div className="ticket-footer">
          <p>📧 También te hemos enviado este ticket por email.</p>
          <a href={`/cancelar/${ticket.cancelToken}`} className="cancel-link">
            ¿No puedes asistir? Cancela tu ticket
          </a>
        </div>
      </div>
    </main>
  )
}
