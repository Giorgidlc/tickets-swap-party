'use client'

import { useState, use } from 'react'

interface Props {
  params: Promise<{ token: string }>
}

export default function CancelarPage({ params }: Props) {
  const { token } = use(params)
  const [status, setStatus] = useState<'confirm' | 'loading' | 'done' | 'error'>('confirm')
  const [message, setMessage] = useState('')

  const handleCancel = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelToken: token }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('done')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error)
      }
    } catch {
      setStatus('error')
      setMessage('Error de conexión')
    }
  }

  return (
    <main className="page-container">
      <div className="cancel-card">
        {status === 'confirm' && (
          <>
            <h1>¿Cancelar tu entrada? 😢 </h1>
            <p>Si cancelas, tu plaza quedará libre para otra persona de la lista de espera.</p>
            <div className="cancel-actions">
              <button onClick={handleCancel} className="btn-danger">
                Sí, cancelar mi entrada
              </button>
              <a href="/" className="btn-secondary">
                No, quiero mantenerla
              </a>
            </div>
          </>
        )}

        {status === 'loading' && (
          <div className="loading">
            <p>Cancelando...</p>
          </div>
        )}

        {status === 'done' && (
          <>
            <h1>✅ Entrada cancelada</h1>
            <p>{message}</p>
            <p>Si alguien estaba en lista de espera, ya habrá recibido su entrada. 💚</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>❌ Error</h1>
            <p>{message}</p>
            <a href="/" className="btn-primary">
              Volver al inicio
            </a>
          </>
        )}
      </div>
    </main>
  )
}
