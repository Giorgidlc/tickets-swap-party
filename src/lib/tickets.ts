import { v4 as uuidv4 } from 'uuid'

/**
 * Genera un código de ticket legible: SWAP-XXXX
 */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sin O/0/I/1 para evitar confusión
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `SWAP-${code}`
}

/**
 * Genera tokens únicos para QR y cancelación
 */
export function generateTokens() {
  return {
    qrToken: uuidv4(),
    cancelToken: uuidv4(),
    ticketCode: generateTicketCode(),
  }
}
