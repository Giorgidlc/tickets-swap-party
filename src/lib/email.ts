import { Resend } from 'resend'
import { generateQRBuffer } from './qr'
import { EVENT } from './constants'

const resend = new Resend(process.env.RESEND_API_KEY)
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface SendTicketEmailParams {
  to: string
  ticketCode: string
  qrToken: string
  cancelToken: string
  name?: string
}

export async function sendTicketEmail({
  to,
  ticketCode,
  qrToken,
  cancelToken,
  name,
}: SendTicketEmailParams) {
  // Generar QR como imagen
  const qrBuffer = await generateQRBuffer(qrToken)

  const greeting = name ? `¡Hola ${name}!` : '¡Hola!'
  const confirmationUrl = `${appUrl}/confirmacion/${ticketCode}`
  const cancelUrl = `${appUrl}/cancelar/${cancelToken}`

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
      .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
      .header h1 { margin: 0; font-size: 28px; }
      .header p { margin: 8px 0 0; opacity: 0.9; font-size: 16px; }
      .body { padding: 30px; }
      .ticket-code { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
      .ticket-code .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px; }
      .qr-container { text-align: center; margin: 20px 0; }
      .qr-container img { border-radius: 8px; }
      .info-box { background: #f0f4ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .info-box h3 { margin: 0 0 8px; color: #333; font-size: 14px; }
      .info-box p { margin: 4px 0; color: #555; font-size: 14px; }
      .drink-badge { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 8px; padding: 12px; text-align: center; font-weight: bold; margin: 16px 0; }
      .rules { background: #fff8e1; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .rules ul { padding-left: 20px; margin: 8px 0; }
      .rules li { color: #555; font-size: 13px; margin: 6px 0; }
      .disclaimer { font-style: italic; color: #888; font-size: 12px; text-align: center; margin: 16px 0; }
      .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; }
      .btn { display: inline-block; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; }
      .btn-primary { background: #667eea; color: white !important; }
      .btn-cancel { color: #999 !important; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🔄 ${EVENT.name}</h1>
        <p>${EVENT.tagline}</p>
      </div>
      
      <div class="body">
        <p>${greeting}</p>
        <p>Tu entrada para la <strong>${EVENT.name}</strong> está confirmada. ¡Te esperamos!</p>
        
        <div class="ticket-code">
          <small>Tu código de entrada</small>
          <div class="code">${ticketCode}</div>
        </div>

        <div class="qr-container">
          <p><strong>Tu QR de acceso:</strong></p>
          <img src="cid:qrcode" alt="QR Code" width="200" height="200" />
          <p style="font-size: 12px; color: #888;">Muestra este QR en la entrada</p>
        </div>

        <div class="drink-badge">
          ${EVENT.includes}
        </div>

        <div class="info-box">
          <h3>📅 Cuándo</h3>
          <p>${EVENT.date}</p>
          <p>${EVENT.time}</p>
        </div>

        <div class="info-box">
          <h3>📍 Dónde</h3>
          <p><strong>${EVENT.location}</strong></p>
          <p>${EVENT.address}</p>
        </div>

        <div class="rules">
          <h3>📋 Normas</h3>
          <ul>
            ${EVENT.rules.map((r) => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <p class="disclaimer">${EVENT.disclaimer}</p>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${confirmationUrl}" class="btn btn-primary">Ver mi entrada</a>
        </div>
      </div>

      <div class="footer">
        <p style="font-size: 12px; color: #888;">
          ¿No puedes asistir? 
          <a href="${cancelUrl}" class="btn-cancel">Cancelar mi entrada</a>
          y dejarás tu plaza a otra persona.
        </p>
      </div>
    </div>
  </body>
  </html>`

  const { data, error } = await resend.emails.send({
    from: 'Swap Party <onboarding@resend.dev>', // Cambiar cuando tengas dominio propio
    to,
    subject: `🎟️ Tu entrada para ${EVENT.name} — ${ticketCode}`,
    html,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrBuffer,
        contentType: 'image/png',
        // @ts-ignore - Resend soporta content_id para CID
        content_id: 'qrcode',
      },
    ],
  })

  if (error) {
    console.error('Error enviando email:', error)
    throw new Error(`Error enviando email: ${error.message}`)
  }

  return data
}

// Email para la lista de espera
export async function sendWaitlistEmail({
  to,
  position,
  name,
}: {
  to: string
  position: number
  name?: string
}) {
  const greeting = name ? `Hola ${name}` : 'Hola'

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">⏳ Lista de Espera</h1>
        <p style="color: white; opacity: 0.9;">${EVENT.name}</p>
      </div>
      <div style="padding: 30px;">
        <p>${greeting},</p>
        <p>Las 20 entradas para la <strong>${EVENT.name}</strong> se han agotado, 
           pero estás en la <strong>lista de espera</strong>.</p>
        
        <div style="background: #fff3cd; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <small>Tu posición</small>
          <div style="font-size: 48px; font-weight: bold; color: #856404;">#${position}</div>
        </div>
        
        <p>Si alguien cancela su entrada, recibirás automáticamente un email 
           con tu ticket y QR de acceso.</p>
        <p style="color: #888; font-size: 13px;">¡Cruza los dedos! 🤞</p>
      </div>
    </div>
  </body>
  </html>`

  await resend.emails.send({
    from: 'Swap Party <onboarding@resend.dev>',
    to,
    subject: `⏳ Lista de espera — ${EVENT.name}`,
    html,
  })
}

// Email cuando alguien de la waitlist es promovido
export async function sendPromotionEmail(params: SendTicketEmailParams) {
  // Reutilizamos el email de ticket pero con un mensaje extra
  return sendTicketEmail(params)
}
