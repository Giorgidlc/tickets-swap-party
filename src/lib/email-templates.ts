import { EVENT } from './constants'

// ═══════════════════════════════════════════════
// COLORES REUTILIZABLES
// ═══════════════════════════════════════════════
const COLORS = {
  primary: '#667eea',
  primaryDark: '#5a67d8',
  purple: '#764ba2',
  success: '#48bb78',
  warning: '#ecc94b',
  danger: '#f56565',
  text: '#2d3748',
  textLight: '#718096',
  bgLight: '#f7fafc',
  border: '#e2e8f0',
  white: '#ffffff',
}

// ═══════════════════════════════════════════════
// WRAPPER COMÚN para todos los emails
// ═══════════════════════════════════════════════
function emailWrapper(content: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, address=no, email=no, date=no" />
  <title>${EVENT.name}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin:0; padding:0; background-color:${COLORS.bgLight}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  
  <!-- Preheader text (se ve en la preview del email) -->
  <div style="display:none; font-size:1px; color:${COLORS.bgLight}; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
    Tu entrada para ${EVENT.name} - ${EVENT.date}
  </div>

  <!-- CONTENEDOR PRINCIPAL -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bgLight};">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        
        <!-- CARD -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px; background-color:${COLORS.white}; border-radius:16px; overflow:hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          ${content}
        </table>
        
        <!-- FOOTER LEGAL -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding: 24px 16px; font-size: 12px; color: ${COLORS.textLight}; line-height: 1.5;">
              Este email fue enviado por ${EVENT.name}.<br/>
              ${EVENT.location} &mdash; ${EVENT.address}<br/>
              &copy; ${new Date().getFullYear()} Swap Party
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`
}

// ═══════════════════════════════════════════════
// 1. EMAIL DE CONFIRMACIÓN DE TICKET
// ═══════════════════════════════════════════════
interface TicketTemplateParams {
  name?: string
  ticketCode: string
  qrDataURL: string
  confirmationUrl: string
  cancelUrl: string
}

export function buildTicketEmailHTML(params: TicketTemplateParams): string {
  const { name, ticketCode, qrDataURL, confirmationUrl, cancelUrl } = params
  const greeting = name ? `Hola ${name},` : 'Hola,'

  const content = `
    <!-- HEADER -->
    <tr>
      <td align="center" style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purple} 100%); padding: 32px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <h1 style="margin:0; color:${COLORS.white}; font-size:28px; font-weight:700;">
                Swap Party
              </h1>
              <p style="margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:16px;">
                Intercambio de Ropa
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr>
      <td style="padding: 32px 28px;">
        
        <!-- Saludo -->
        <p style="margin:0 0 8px; font-size:16px; color:${COLORS.text};">
          ${greeting}
        </p>
        <p style="margin:0 0 24px; font-size:16px; color:${COLORS.text}; line-height:1.6;">
          Tu entrada para la <strong>Swap Party</strong> est&aacute; confirmada. &iexcl;Te esperamos!
        </p>

        <!-- CÓDIGO DE TICKET -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="background:${COLORS.bgLight}; border:2px dashed ${COLORS.primary}; border-radius:12px; padding:20px;">
              <span style="font-size:12px; color:${COLORS.textLight}; text-transform:uppercase; letter-spacing:1px;">
                Tu c&oacute;digo de entrada
              </span>
              <br/>
              <span style="font-size:32px; font-weight:800; color:${COLORS.primary}; letter-spacing:4px; line-height:1.5;">
                ${ticketCode}
              </span>
            </td>
          </tr>
        </table>

        <!-- QR CODE -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <p style="margin:0 0 12px; font-size:14px; font-weight:600; color:${COLORS.text};">
                Tu QR de acceso:
              </p>
              <img 
                src="${qrDataURL}" 
                alt="C&oacute;digo QR de entrada" 
                width="200" 
                height="200" 
                style="display:block; border:1px solid ${COLORS.border}; border-radius:8px;"
              />
              <p style="margin:8px 0 0; font-size:12px; color:${COLORS.textLight};">
                Muestra este QR en la entrada del evento
              </p>
            </td>
          </tr>
        </table>

        <!-- CONSUMICIÓN -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius:10px; padding:14px 20px;">
              <span style="color:${COLORS.white}; font-weight:700; font-size:16px;">
                &#127865; 1 consumici&oacute;n incluida con tu entrada
              </span>
            </td>
          </tr>
        </table>

        <!-- DETALLES DEL EVENTO -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <!-- Fecha -->
          <tr>
            <td style="background:${COLORS.bgLight}; border-radius:8px 8px 0 0; padding:14px 16px; border-bottom:1px solid ${COLORS.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="30" valign="top" style="font-size:18px;">&#128197;</td>
                  <td style="padding-left:8px;">
                    <span style="font-size:13px; color:${COLORS.textLight};">Cu&aacute;ndo</span><br/>
                    <strong style="font-size:15px; color:${COLORS.text};">${EVENT.date}</strong><br/>
                    <span style="font-size:14px; color:${COLORS.text};">${EVENT.time}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Lugar -->
          <tr>
            <td style="background:${COLORS.bgLight}; border-radius:0 0 8px 8px; padding:14px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="30" valign="top" style="font-size:18px;">&#128205;</td>
                  <td style="padding-left:8px;">
                    <span style="font-size:13px; color:${COLORS.textLight};">D&oacute;nde</span><br/>
                    <strong style="font-size:15px; color:${COLORS.text};">${EVENT.location}</strong><br/>
                    <span style="font-size:14px; color:${COLORS.text};">${EVENT.address}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- NORMAS -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:#fffbeb; border-radius:8px; padding:16px 20px;">
              <p style="margin:0 0 10px; font-size:14px; font-weight:700; color:${COLORS.text};">
                &#128203; Normas del evento
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                ${EVENT.rules
                  .map(
                    (rule) => `
                <tr>
                  <td width="20" valign="top" style="font-size:14px; color:${COLORS.primary}; padding:3px 0;">&#8226;</td>
                  <td style="font-size:13px; color:#555; line-height:1.5; padding:3px 0;">${rule}</td>
                </tr>`,
                  )
                  .join('')}
              </table>
              <p style="margin:12px 0 0; font-size:12px; font-style:italic; color:${COLORS.textLight};">
                ${EVENT.disclaimer}
              </p>
            </td>
          </tr>
        </table>

        <!-- BOTÓN VER ENTRADA -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="21%" fill="true">
                <v:fill type="gradient" color="${COLORS.primary}" color2="${COLORS.purple}" angle="135" />
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Ver mi entrada</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${confirmationUrl}" target="_blank" style="display:inline-block; background:linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.purple} 100%); color:${COLORS.white}; text-decoration:none; padding:14px 40px; border-radius:10px; font-size:16px; font-weight:600; font-family:Arial,sans-serif;">
                Ver mi entrada
              </a>
              <!--<![endif]-->
            </td>
          </tr>
        </table>

      </td>
    </tr>

    <!-- FOOTER CANCELACIÓN -->
    <tr>
      <td align="center" style="padding:20px 28px; border-top:2px dashed ${COLORS.border};">
        <p style="margin:0; font-size:13px; color:${COLORS.textLight}; line-height:1.5;">
          &iquest;No puedes asistir?
          <a href="${cancelUrl}" style="color:${COLORS.danger}; text-decoration:underline;">
            Cancela tu entrada
          </a>
          y dejar&aacute;s tu plaza a otra persona.
        </p>
      </td>
    </tr>`

  return emailWrapper(content)
}

export function buildTicketEmailText(params: {
  name?: string
  ticketCode: string
  confirmationUrl: string
  cancelUrl: string
}): string {
  const greeting = params.name ? `Hola ${params.name},` : 'Hola,'
  return `${greeting}

Tu entrada para ${EVENT.name} está confirmada.

CÓDIGO DE ENTRADA: ${params.ticketCode}

INCLUYE: 1 consumición gratuita

CUÁNDO: ${EVENT.date} — ${EVENT.time}
DÓNDE: ${EVENT.location}, ${EVENT.address}

NORMAS:
${EVENT.rules.map((r) => `• ${r}`).join('\n')}
${EVENT.disclaimer}

Ver tu entrada online: ${params.confirmationUrl}

¿No puedes asistir? Cancela aquí: ${params.cancelUrl}

---
${EVENT.name} — ${EVENT.location}
`
}

// ═══════════════════════════════════════════════
// 2. EMAIL DE LISTA DE ESPERA
// ═══════════════════════════════════════════════
interface WaitlistTemplateParams {
  name?: string
  position: number
}

export function buildWaitlistEmailHTML(params: WaitlistTemplateParams): string {
  const { name, position } = params
  const greeting = name ? `Hola ${name},` : 'Hola,'

  const content = `
    <!-- HEADER -->
    <tr>
      <td align="center" style="background: linear-gradient(135deg, #ffa751 0%, #ffe259 100%); padding: 32px 24px;">
        <h1 style="margin:0; color:${COLORS.white}; font-size:26px; font-weight:700;">
          Lista de Espera
        </h1>
        <p style="margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:15px;">
          ${EVENT.name}
        </p>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="margin:0 0 16px; font-size:16px; color:${COLORS.text};">
          ${greeting}
        </p>
        <p style="margin:0 0 24px; font-size:16px; color:${COLORS.text}; line-height:1.6;">
          Las 20 entradas para la <strong>${EVENT.name}</strong> se han agotado, 
          pero est&aacute;s en la <strong>lista de espera</strong>.
        </p>

        <!-- POSICIÓN -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="background:#fffbeb; border-radius:12px; padding:24px;">
              <span style="font-size:12px; color:${COLORS.textLight}; text-transform:uppercase; letter-spacing:1px;">
                Tu posici&oacute;n
              </span>
              <br/>
              <span style="font-size:56px; font-weight:800; color:#b7791f; line-height:1.3;">
                #${position}
              </span>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px; font-size:15px; color:${COLORS.text}; line-height:1.6;">
          Si alguien cancela su entrada, recibir&aacute;s autom&aacute;ticamente 
          un email con tu ticket y c&oacute;digo QR de acceso.
        </p>

        <p style="margin:0; font-size:14px; color:${COLORS.textLight}; text-align:center;">
          &#129310; &iexcl;Cruza los dedos!
        </p>
      </td>
    </tr>`

  return emailWrapper(content)
}

export function buildWaitlistEmailText(params: WaitlistTemplateParams): string {
  const greeting = params.name ? `Hola ${params.name},` : 'Hola,'
  return `${greeting}

Las 20 entradas para ${EVENT.name} se han agotado.

Estás en la LISTA DE ESPERA en la posición #${params.position}.

Si alguien cancela, recibirás automáticamente tu entrada con el QR.

¡Cruza los dedos!

---
${EVENT.name} — ${EVENT.date}
${EVENT.location}, ${EVENT.address}
`
}

// ═══════════════════════════════════════════════
// 3. EMAIL DE PROMOCIÓN (waitlist → ticket)
// ═══════════════════════════════════════════════
export function buildPromotedEmailHTML(params: TicketTemplateParams): string {
  const { name, ticketCode, qrDataURL, confirmationUrl, cancelUrl } = params
  const greeting = name ? `Hola ${name},` : 'Hola,'

  const content = `
    <!-- HEADER -->
    <tr>
      <td align="center" style="background: linear-gradient(135deg, ${COLORS.success} 0%, #38a169 100%); padding: 32px 24px;">
        <h1 style="margin:0; color:${COLORS.white}; font-size:26px; font-weight:700;">
          &#127881; &iexcl;Plaza disponible!
        </h1>
        <p style="margin:8px 0 0; color:rgba(255,255,255,0.9); font-size:15px;">
          ${EVENT.name}
        </p>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr>
      <td style="padding: 32px 28px;">
        <p style="margin:0 0 8px; font-size:16px; color:${COLORS.text};">
          ${greeting}
        </p>
        <p style="margin:0 0 24px; font-size:16px; color:${COLORS.text}; line-height:1.6;">
          &iexcl;Buenas noticias! Se ha liberado una plaza y 
          <strong>tu entrada est&aacute; confirmada</strong>.
        </p>

        <!-- CÓDIGO -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="background:${COLORS.bgLight}; border:2px dashed ${COLORS.success}; border-radius:12px; padding:20px;">
              <span style="font-size:12px; color:${COLORS.textLight}; text-transform:uppercase; letter-spacing:1px;">
                Tu c&oacute;digo de entrada
              </span>
              <br/>
              <span style="font-size:32px; font-weight:800; color:${COLORS.success}; letter-spacing:4px; line-height:1.5;">
                ${ticketCode}
              </span>
            </td>
          </tr>
        </table>

        <!-- QR -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <p style="margin:0 0 12px; font-size:14px; font-weight:600; color:${COLORS.text};">
                Tu QR de acceso:
              </p>
              <img 
                src="${qrDataURL}" 
                alt="QR" 
                width="200" 
                height="200" 
                style="display:block; border:1px solid ${COLORS.border}; border-radius:8px;"
              />
              <p style="margin:8px 0 0; font-size:12px; color:${COLORS.textLight};">
                Muestra este QR en la entrada
              </p>
            </td>
          </tr>
        </table>

        <!-- CONSUMICIÓN -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius:10px; padding:14px;">
              <span style="color:white; font-weight:700; font-size:16px;">
                &#127865; 1 consumici&oacute;n incluida
              </span>
            </td>
          </tr>
        </table>

        <!-- DETALLES -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:${COLORS.bgLight}; border-radius:8px; padding:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:6px 0; font-size:14px;">
                    &#128197; <strong>${EVENT.date}</strong> &mdash; ${EVENT.time}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0; font-size:14px;">
                    &#128205; <strong>${EVENT.location}</strong> &mdash; ${EVENT.address}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- BOTÓN -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <a href="${confirmationUrl}" target="_blank" style="display:inline-block; background:linear-gradient(135deg, ${COLORS.success} 0%, #38a169 100%); color:white; text-decoration:none; padding:14px 40px; border-radius:10px; font-size:16px; font-weight:600;">
                Ver mi entrada
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td align="center" style="padding:20px 28px; border-top:2px dashed ${COLORS.border};">
        <p style="margin:0; font-size:13px; color:${COLORS.textLight};">
          &iquest;No puedes asistir?
          <a href="${cancelUrl}" style="color:${COLORS.danger};">Cancela tu entrada</a>
        </p>
      </td>
    </tr>`

  return emailWrapper(content)
}

export function buildPromotedEmailText(params: {
  name?: string
  ticketCode: string
  confirmationUrl: string
  cancelUrl: string
}): string {
  const greeting = params.name ? `Hola ${params.name},` : 'Hola,'
  return `${greeting}

¡Buenas noticias! Se ha liberado una plaza y tu entrada para ${EVENT.name} está CONFIRMADA.

CÓDIGO: ${params.ticketCode}

INCLUYE: 1 consumición

CUÁNDO: ${EVENT.date} — ${EVENT.time}
DÓNDE: ${EVENT.location}, ${EVENT.address}

Ver tu entrada: ${params.confirmationUrl}
Cancelar: ${params.cancelUrl}

---
${EVENT.name}
`
}

// ═══════════════════════════════════════════════
// 4. NOTIFICACIÓN AL ORGANIZADOR
// ═══════════════════════════════════════════════
interface OrganizerTemplateParams {
  attendeeEmail: string
  attendeeName?: string
  ticketCode: string
  ticketNumber: number
  totalTickets: number
}

export function buildOrganizerEmailHTML(params: OrganizerTemplateParams): string {
  const { attendeeEmail, attendeeName, ticketCode, ticketNumber, totalTickets } = params
  const remaining = totalTickets - ticketNumber
  const percentage = Math.round((ticketNumber / totalTickets) * 100)

  // Barra de progreso
  const progressColor =
    percentage >= 90 ? COLORS.danger : percentage >= 70 ? COLORS.warning : COLORS.success

  const content = `
    <!-- HEADER -->
    <tr>
      <td style="background:${COLORS.text}; padding:24px; text-align:center;">
        <h1 style="margin:0; color:white; font-size:20px;">
          &#128276; Nuevo registro
        </h1>
      </td>
    </tr>

    <!-- CUERPO -->
    <tr>
      <td style="padding:28px;">
        
        <!-- PROGRESO -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr>
            <td align="center" style="padding-bottom:12px;">
              <span style="font-size:36px; font-weight:800; color:${COLORS.text};">
                ${ticketNumber}/${totalTickets}
              </span>
              <br/>
              <span style="font-size:13px; color:${COLORS.textLight};">
                entradas asignadas${remaining === 0 ? ' — AGOTADAS' : ` — quedan ${remaining}`}
              </span>
            </td>
          </tr>
          <tr>
            <td>
              <!-- Barra de progreso -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#edf2f7; border-radius:10px; height:12px; overflow:hidden;">
                    <div style="background:${progressColor}; width:${percentage}%; height:12px; border-radius:10px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- DATOS DEL ASISTENTE -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.bgLight}; border-radius:8px;">
          <tr>
            <td style="padding:16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding:6px 0; font-size:14px; color:${COLORS.textLight}; width:80px;">Email:</td>
                  <td style="padding:6px 0; font-size:14px; color:${COLORS.text}; font-weight:600;">
                    ${attendeeEmail}
                  </td>
                </tr>
                ${
                  attendeeName
                    ? `
                <tr>
                  <td style="padding:6px 0; font-size:14px; color:${COLORS.textLight};">Nombre:</td>
                  <td style="padding:6px 0; font-size:14px; color:${COLORS.text}; font-weight:600;">
                    ${attendeeName}
                  </td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding:6px 0; font-size:14px; color:${COLORS.textLight};">Ticket:</td>
                  <td style="padding:6px 0; font-size:14px; color:${COLORS.primary}; font-weight:700; letter-spacing:2px;">
                    ${ticketCode}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${
          remaining === 0
            ? `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
          <tr>
            <td align="center" style="background:#fff5f5; border-radius:8px; padding:12px;">
              <span style="color:${COLORS.danger}; font-weight:700; font-size:14px;">
                &#128308; ENTRADAS AGOTADAS &mdash; Los siguientes ir&aacute;n a lista de espera
              </span>
            </td>
          </tr>
        </table>`
            : ''
        }
      </td>
    </tr>`

  return emailWrapper(content)
}

export function buildOrganizerEmailText(params: OrganizerTemplateParams): string {
  const remaining = params.totalTickets - params.ticketNumber
  return `NUEVO REGISTRO - ${EVENT.name}

Ticket ${params.ticketNumber}/${params.totalTickets} (quedan ${remaining})

Email: ${params.attendeeEmail}
${params.attendeeName ? `Nombre: ${params.attendeeName}` : ''}
Código: ${params.ticketCode}

${remaining === 0 ? '⚠️ ENTRADAS AGOTADAS' : ''}
`
}
