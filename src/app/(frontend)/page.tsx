import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import RegistrationForm from '@/components/RegistrationForm'
import { EVENT } from '@/lib/constants'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <main className="page-container">
      <div className="event-card">
        {/* Header */}
        <div className="event-header">
          <div className="logo-container">
            <img src="/assets/logo.webp" alt="Swap Party" width="100" height="26" />
          </div>
          <h1>{EVENT.name}</h1>
          <p className="tagline">{EVENT.tagline}</p>
        </div>

        {/* Info del evento */}
        <div className="event-info">
          <div className="info-container">
            <div className="info-item">
              <span className="icon">📅</span>
              <div>
                <p>
                  <strong>{EVENT.date}</strong>
                </p>
                <p>{EVENT.time}</p>
              </div>
            </div>
            <div className="info-item">
              <span className="icon">📍</span>
              <div>
                <p>
                  <strong>{EVENT.location}</strong>
                </p>
                <p>{EVENT.address}</p>
              </div>
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
          <h2>🎟️ Consigue tu entrada gratuita 🎟️</h2>
          <RegistrationForm />
        </div>
      </div>

      <div className="image-section">
        <img src="/assets/image-swap.webp" alt="Swap Party" width="300" height="300" />
      </div>
    </main>
  )
}
