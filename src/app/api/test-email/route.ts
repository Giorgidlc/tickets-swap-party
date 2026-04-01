import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)

  // ⚠️ IMPORTANTE: En modo gratuito de Resend,
  // solo puedes enviar al email con el que te registraste
  // hasta que verifiques un dominio propio.

  try {
    const { data, error } = await resend.emails.send({
      from: 'Swap Party <onboarding@resend.dev>',
      to: 'jorestuard@gmail.com', // ← CAMBIA ESTO
      subject: 'Test - Swap Party',
      html: '<p>Si lees esto, Resend funciona ✅</p>',
    })

    if (error) {
      console.error('❌ RESEND ERROR:', JSON.stringify(error, null, 2))
      return NextResponse.json({ success: false, error }, { status: 500 })
    }

    console.log('✅ EMAIL ENVIADO:', data)
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error('❌ EXCEPTION:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
