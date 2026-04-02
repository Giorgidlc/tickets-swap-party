'use client'

import { useState, useEffect } from 'react'

export default function RegistrationForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [availability, setAvailability] = useState<any>(null)

  // Cargar disponibilidad
  useEffect(() => {
    fetch('/api/availability')
      .then((r) => r.json())
      .then(setAvailability)
      .catch(console.error)
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          provider: 'email', // Definimos estáticamente que el registro es por email
        }),
      })

      const data = await res.json()
      setResult(data)

      // Si se creó ticket, redirigir a confirmación
      if (data.success && data.type === 'ticket') {
        setTimeout(() => {
          window.location.href = `/confirmacion/${data.ticketCode}`
        }, 2000)
      }
    } catch (err) {
      setResult({ error: 'Error de conexión. Inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  // ── Ya registrado ──
  if (result?.error === 'already_registered') {
    return (
      <div className="result-card info">
        <h3>🎟️ ¡Ya tienes entrada!</h3>
        <p>
          Tu código: <strong>{result.ticketCode}</strong>
        </p>
        <a href={`/confirmacion/${result.ticketCode}`} className="btn-primary">
          Ver mi entrada
        </a>
      </div>
    )
  }

  // ── Registro exitoso ──
  if (result?.success && result.type === 'ticket') {
    return (
      <div className="result-card success">
        <h3>🎉 ¡Entrada confirmada!</h3>
        <p>
          Tu código: <strong>{result.ticketCode}</strong>
        </p>
        <p>Revisa tu email para ver tu QR de acceso.</p>
        <p className="text-sm">Redirigiendo a tu entrada...</p>
      </div>
    )
  }

  // ── Waitlist ──
  if (result?.success && result.type === 'waitlist') {
    return (
      <div className="result-card waitlist">
        <h3>⏳ Lista de espera</h3>
        <p>
          Posición: <strong>#{result.position}</strong>
        </p>
        <p>Te notificaremos por email si se libera una plaza.</p>
      </div>
    )
  }

  // ── Error genérico ──
  if (result?.error && result.error !== 'already_registered') {
    return (
      <div className="result-card error">
        <h3>😕 {result.message || result.error}</h3>
        <button onClick={() => setResult(null)} className="btn-secondary">
          Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
    <div className="registration-form">
      {/* Contador de plazas */}
      {availability && (
        <div className={`availability ${availability.soldOut ? 'sold-out' : ''}`}>
          {availability.soldOut ? (
            <span>🔴 Entradas agotadas — Puedes apuntarte a la lista de espera</span>
          ) : (
            <span>
              🟢 <strong>{availability.available}</strong> de {availability.total} entradas
              disponibles
            </span>
          )}
        </div>
      )}

      <div className="divider">
        <span>Regístrate con tu correo electrónico</span>
      </div>

      {/* Formulario manual */}
      <form onSubmit={handleRegister}>
        <div className="input-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading || !email}>
          {loading ? (
            <span className="spinner">Registrando...</span>
          ) : availability?.soldOut ? (
            'Apuntarme a la lista de espera'
          ) : (
            'Obtener mi entrada gratis'
          )}
        </button>
      </form>
    </div>
  )
}
