import QRCode from 'qrcode'

/**
 * Genera un QR code como buffer PNG
 */
export async function generateQRBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    type: 'png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H', // Alta corrección de errores
  })
}

/**
 * Genera un QR code como Data URL (base64) para mostrar en web
 */
export async function generateQRDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  })
}
