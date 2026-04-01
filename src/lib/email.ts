import { Resend } from 'resend'
import { generateQRDataURL } from './qr'
import { EVENT } from './constants'
import {
  buildTicketEmailHTML,
  buildTicketEmailText,
  buildWaitlistEmailHTML,
  buildWaitlistEmailText,
  buildOrganizerEmailHTML,
  buildOrganizerEmailText,
  buildPromotedEmailHTML,
  buildPromotedEmailText,
} from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const emailFrom = process.env.EMAIL_FROM || 'Swap Party <onboarding@resend.dev>'
const organizerEmails = (process.env.ORGANIZER_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface TicketEmailParams {
  to: string
  ticketCode: string
  qrToken: string
  cancelToken: string
  name?: string
}

interface WaitlistEmailParams {
  to: string
  position: number
  name?: string
}

interface OrganizerNotifyParams {
  attendeeEmail: string
  attendeeName?: string
  ticketCode: string
  ticketNumber: number
  totalTickets: number
}

// ─────────────────────────────────────────────
// ENVIAR: Email de confirmación con QR al asistente
// ─────────────────────────────────────────────
export async function sendTicketEmail({
  to,
  ticketCode,
  qrToken,
  cancelToken,
  name,
}: TicketEmailParams) {
  // Generar QR como base64 Data URL (más fiable que CID en emails)
  const qrDataURL = await generateQRDataURL(qrToken)

  const confirmationUrl = `${appUrl}/confirmacion/${ticketCode}`
  const cancelUrl = `${appUrl}/cancelar/${cancelToken}`

  const html = buildTicketEmailHTML({
    name,
    ticketCode,
    qrDataURL,
    confirmationUrl,
    cancelUrl,
  })

  const text = buildTicketEmailText({
    name,
    ticketCode,
    confirmationUrl,
    cancelUrl,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Tu entrada para ${EVENT.name} - ${ticketCode}`,
      html,
      text, // ← Versión texto plano (anti-spam)
      headers: {
        'X-Entity-Ref-ID': ticketCode, // Evita que Gmail agrupe como hilo
      },
    })

    if (error) {
      console.error(`❌ Error enviando ticket email a ${to}:`, JSON.stringify(error))
      throw new Error(error.message)
    }

    console.log(`✅ Ticket email enviado a ${to} (${ticketCode}):`, data?.id)
    return data
  } catch (err: any) {
    console.error(`❌ Exception enviando ticket email a ${to}:`, err.message)
    throw err
  }
}

// ─────────────────────────────────────────────
// ENVIAR: Email de lista de espera
// ─────────────────────────────────────────────
export async function sendWaitlistEmail({ to, position, name }: WaitlistEmailParams) {
  const html = buildWaitlistEmailHTML({ name, position })
  const text = buildWaitlistEmailText({ name, position })

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Lista de espera - ${EVENT.name}`,
      html,
      text,
    })

    if (error) {
      console.error(`❌ Error enviando waitlist email a ${to}:`, JSON.stringify(error))
      throw new Error(error.message)
    }

    console.log(`✅ Waitlist email enviado a ${to} (posición #${position}):`, data?.id)
    return data
  } catch (err: any) {
    console.error(`❌ Exception enviando waitlist email:`, err.message)
    throw err
  }
}

// ─────────────────────────────────────────────
// ENVIAR: Email promovido de waitlist → ticket
// ─────────────────────────────────────────────
export async function sendPromotedEmail({
  to,
  ticketCode,
  qrToken,
  cancelToken,
  name,
}: TicketEmailParams) {
  const qrDataURL = await generateQRDataURL(qrToken)
  const confirmationUrl = `${appUrl}/confirmacion/${ticketCode}`
  const cancelUrl = `${appUrl}/cancelar/${cancelToken}`

  const html = buildPromotedEmailHTML({
    name,
    ticketCode,
    qrDataURL,
    confirmationUrl,
    cancelUrl,
  })

  const text = buildPromotedEmailText({
    name,
    ticketCode,
    confirmationUrl,
    cancelUrl,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Plaza disponible - Tu entrada para ${EVENT.name}`,
      html,
      text,
      headers: {
        'X-Entity-Ref-ID': ticketCode,
      },
    })

    if (error) {
      console.error(`❌ Error enviando promoted email a ${to}:`, JSON.stringify(error))
      throw new Error(error.message)
    }

    console.log(`✅ Promoted email enviado a ${to}:`, data?.id)
    return data
  } catch (err: any) {
    console.error(`❌ Exception enviando promoted email:`, err.message)
    throw err
  }
}

// ─────────────────────────────────────────────
// ENVIAR: Notificación al organizador
// ─────────────────────────────────────────────
export async function sendOrganizerNotification({
  attendeeEmail,
  attendeeName,
  ticketCode,
  ticketNumber,
  totalTickets,
}: OrganizerNotifyParams) {
  if (organizerEmails.length === 0) {
    console.warn('⚠️ No hay ORGANIZER_EMAILS configurados')
    return
  }

  const html = buildOrganizerEmailHTML({
    attendeeEmail,
    attendeeName,
    ticketCode,
    ticketNumber,
    totalTickets,
  })

  const text = buildOrganizerEmailText({
    attendeeEmail,
    attendeeName,
    ticketCode,
    ticketNumber,
    totalTickets,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: organizerEmails,
      subject: `Nuevo registro #${ticketNumber}/${totalTickets} - ${EVENT.name}`,
      html,
      text,
    })

    if (error) {
      console.error('❌ Error enviando notificación al organizador:', JSON.stringify(error))
      // No lanzamos error — no queremos bloquear el registro del usuario
      return
    }

    console.log('✅ Notificación organizador enviada:', data?.id)
    return data
  } catch (err: any) {
    console.error('❌ Exception notificación organizador:', err.message)
    // Silencioso — la notificación al organizador no es crítica
  }
}
