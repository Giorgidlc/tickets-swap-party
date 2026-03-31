'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface ScanResult {
  valid: boolean
  status: string
  message: string
  email?: string
  name?: string
  ticketCode?: string
  drinkIncluded?: boolean
}

export default function QRScanner() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(true)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const startScanner = () => {
    setResult(null)
    setScanning(true)

    // Limpiar scanner anterior si existe
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
    }

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        false,
      )

      scanner.render(
        async (decodedText) => {
          // QR escaneado exitosamente
          scanner.pause()
          setScanning(false)

          try {
            const res = await fetch('/api/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ qrToken: decodedText, pin }),
            })
            const data = await res.json()
            setResult(data)
          } catch (err) {
            setResult({
              valid: false,
              status: 'error',
              message: '❌ Error de conexión',
            })
          }
        },
        (errorMessage) => {
          // Ignorar errores de escaneo (son normales mientras busca QR)
        },
      )

      scannerRef.current = scanner
    }, 100)
  }

  // Limpiar scanner al desmontar
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [])

  // ── Pantalla de PIN ──
  if (!authenticated) {
    return (
      <div className="scanner-container">
        <h2>🔐 Acceso Validador</h2>
        <p>Introduce el PIN de administrador</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pin.length >= 4) {
              setAuthenticated(true)
              setTimeout(startScanner, 100)
            }
          }}
        >
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            maxLength={8}
            className="pin-input"
            autoFocus
          />
          <button type="submit" className="btn-primary">
            Entrar
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="scanner-container">
      <h2>📷 Escáner de Entradas</h2>

      {/* Resultado del escaneo */}
      {result && (
        <div
          className={`scan-result ${
            result.valid ? 'valid' : result.status === 'already_attended' ? 'warning' : 'invalid'
          }`}
        >
          <div className="result-icon">
            {result.valid ? '✅' : result.status === 'already_attended' ? '⚠️' : '❌'}
          </div>
          <h3>{result.message}</h3>
          {result.email && (
            <div className="result-details">
              <p>
                <strong>Email:</strong> {result.email}
              </p>
              {result.name && (
                <p>
                  <strong>Nombre:</strong> {result.name}
                </p>
              )}
              <p>
                <strong>Código:</strong> {result.ticketCode}
              </p>
              {result.drinkIncluded && <p className="drink-badge">🍹 Consumición incluida</p>}
            </div>
          )}
          <button onClick={startScanner} className="btn-primary" style={{ marginTop: 16 }}>
            📷 Escanear siguiente
          </button>
        </div>
      )}

      {/* Escáner QR */}
      {scanning && <div id="qr-reader" style={{ width: '100%', maxWidth: 400 }} />}
    </div>
  )
}
