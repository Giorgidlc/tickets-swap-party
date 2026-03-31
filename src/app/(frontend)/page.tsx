import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import RegistrationForm from '@/components/RegistrationForm'
import { EVENT } from '@/lib/constants'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <main className="page-container">
      <div className="event-card">
        {/* Header */}
        <div className="event-header">
          {/* Aquí va tu logo */}
          {/* <img src="/logo.png" alt="Swap Party" className="logo" /> */}
          <h1>🔄 {EVENT.name}</h1>
          <p className="tagline">{EVENT.tagline}</p>
        </div>

        {/* Info del evento */}
        <div className="event-info">
          <div className="info-item">
            <span className="icon">📅</span>
            <div>
              <strong>{EVENT.date}</strong>
              <span>{EVENT.time}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="icon">📍</span>
            <div>
              <strong>{EVENT.location}</strong>
              <span>{EVENT.address}</span>
            </div>
          </div>
          <div className="info-item drink">
            <span className="icon">🍹</span>
            <span>1 consumición incluida</span>
          </div>
        </div>

        {/* Normas */}
        <div className="rules-section">
          <h3>📋 ¿Cómo funciona?</h3>
          <ul>
            {EVENT.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
          <p className="disclaimer">{EVENT.disclaimer}</p>
        </div>

        {/* Formulario */}
        <div className="form-section">
          <h2>🎟️ Consigue tu entrada gratuita</h2>
          <RegistrationForm />
        </div>
      </div>
    </main>
  )
}
