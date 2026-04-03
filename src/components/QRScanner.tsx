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
  attendedAt?: string
}

export default function QRScanner() {
  const [pin, setPin] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [manualToken, setManualToken] = useState('')

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const isProcessingRef = useRef(false)
  const pinRef = useRef('') // ← Ref para mantener el PIN actualizado

  // Mantener pinRef sincronizado
  useEffect(() => {
    pinRef.current = pin
  }, [pin])

  // ── Validar token contra la API ──
  const validateToken = async (token: string) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    setLoading(true)
    setScanning(false)

    const currentPin = pinRef.current // ← Usar la ref, no el estado

    setDebugInfo(`Token: "${token.substring(0, 12)}..."\nPIN: ${currentPin ? '****' : '❌ VACÍO'}`)

    console.log('📡 Validando:', {
      token: token.substring(0, 20),
      pinLength: currentPin.length,
    })

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: token.trim(),
          pin: currentPin, // ← Usar la ref
        }),
      })

      const data = await res.json()
      console.log('📡 Respuesta:', data)

      setDebugInfo(
        `Token: "${token.substring(0, 12)}..."\nHTTP: ${res.status}\n${JSON.stringify(data, null, 2)}`,
      )
      setResult(data)
    } catch (err: any) {
      console.error('❌ Error:', err)
      setDebugInfo(`Error: ${err.message}`)
      setResult({
        valid: false,
        status: 'error',
        message: `❌ Error de conexión: ${err.message}`,
      })
    } finally {
      setLoading(false)
      isProcessingRef.current = false
    }
  }

  // ── Iniciar escáner ──
  const startScanner = () => {
    setResult(null)
    setDebugInfo('')
    setScanning(true)
    isProcessingRef.current = false

    // Limpiar scanner anterior
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (e) {
        // Ignorar
      }
      scannerRef.current = null
    }

    setTimeout(() => {
      const container = document.getElementById('qr-reader')
      if (!container) return

      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            rememberLastUsedCamera: true,
          },
          false,
        )

        scanner.render(
          async (decodedText) => {
            if (isProcessingRef.current) return

            console.log('🔍 QR leído:', decodedText)

            // Limpiar scanner
            try {
              scanner.clear()
            } catch (e) {
              // Ignorar
            }
            scannerRef.current = null

            // Validar
            await validateToken(decodedText)
          },
          () => {
            // Errores normales de escaneo — ignorar
          },
        )

        scannerRef.current = scanner
      } catch (err) {
        console.error('Error cámara:', err)
        setDebugInfo(`Error cámara: ${err}`)
        setScanning(false)
      }
    }, 300)
  }

  // ── Validación manual ──
  const handleManualValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualToken.trim()) return

    // Limpiar scanner si existe
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (e) {
        // Ignorar
      }
      scannerRef.current = null
    }

    setScanning(false)
    await validateToken(manualToken.trim())
    setManualToken('')
  }

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch (e) {
          // Ignorar
        }
      }
    }
  }, [])

  // ═══════════════════════════════════
  // PANTALLA DE PIN
  // ═══════════════════════════════════
  if (!authenticated) {
    return (
      <div className="scanner-container">
        <h2>🔐 Acceso Validador</h2>
        <p style={{ color: '#a0aec0', marginBottom: '20px' }}>
          Introduce el PIN de administrador
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pin.length >= 4) {
              pinRef.current = pin // ← Asegurar que la ref está actualizada
              setAuthenticated(true)
            }
          }}
        >
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              pinRef.current = e.target.value // ← Actualizar ref también
            }}
            placeholder="PIN"
            maxLength={8}
            className="pin-input"
            autoFocus
            style={{
              width: '120px',
              padding: '16px',
              textAlign: 'center',
              fontSize: '1.5rem',
              letterSpacing: '8px',
              borderRadius: '10px',
              border: '2px solid #4a5568',
              background: '#2d3748',
              color: 'white',
            }}
          />
          <br />
          <button
            type="submit"
            className="btn-primary"
            disabled={pin.length < 4}
            style={{ marginTop: '16px', maxWidth: '200px' }}
          >
            Entrar
          </button>
        </form>
      </div>
    )
  }

  // ═══════════════════════════════════
  // PANTALLA PRINCIPAL
  // ═══════════════════════════════════
  return (
    <div className="scanner-container">
      <h2>📷 Validador de Entradas</h2>

      {/* ── RESULTADO ── */}
      {result && (
        <div
          className={`scan-result ${
            result.valid
              ? 'valid'
              : result.status === 'already_attended'
                ? 'warning'
                : 'invalid'
          }`}
        >
          <div className="result-icon" style={{ fontSize: '48px', marginBottom: '12px' }}>
            {result.valid
              ? '✅'
              : result.status === 'already_attended'
                ? '⚠️'
                : '❌'}
          </div>
          <h3 style={{ margin: '0 0 16px' }}>{result.message}</h3>

          {(result.email || result.ticketCode) && (
            <div
              className="result-details"
              style={{
                background: 'rgba(0,0,0,0.1)',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'left',
              }}
            >
              {result.ticketCode && (
                <p style={{ margin: '4px 0' }}>
                  <strong>Código:</strong> {result.ticketCode}
                </p>
              )}
              {result.email && (
                <p style={{ margin: '4px 0' }}>
                  <strong>Email:</strong> {result.email}
                </p>
              )}
              {result.name && (
                <p style={{ margin: '4px 0' }}>
                  <strong>Nombre:</strong> {result.name}
                </p>
              )}
              {result.drinkIncluded && (
                <p
                  style={{
                    margin: '12px 0 0',
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                >
                  🍹 Consumición incluida
                </p>
              )}
              {result.attendedAt && (
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888' }}>
                  Usado: {new Date(result.attendedAt).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          )}

          <button
            onClick={startScanner}
            className="btn-primary"
            style={{ marginTop: '20px' }}
          >
            📷 Escanear siguiente
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <p>Validando entrada...</p>
        </div>
      )}

      {/* ── ESCÁNER ── */}
      {!result && !loading && (
        <>
          {scanning ? (
            <div id="qr-reader" style={{ width: '100%', maxWidth: '400px' }} />
          ) : (
            <button
              onClick={startScanner}
              className="btn-primary"
              style={{ marginTop: '20px', maxWidth: '300px' }}
            >
              📷 Abrir cámara
            </button>
          )}
        </>
      )}

      {/* ── VALIDACIÓN MANUAL ── */}
      {!result && !loading && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            borderTop: '1px solid #4a5568',
          }}
        >
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '8px' }}>
            ¿Problemas con la cámara? Escribe el código:
          </p>
          <form
            onSubmit={handleManualValidation}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value.toUpperCase())}
              placeholder="SWAP-XXXX"
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #4a5568',
                background: '#2d3748',
                color: 'white',
                fontSize: '18px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!manualToken.trim()}
              style={{ width: 'auto', padding: '12px 24px' }}
            >
              ✓
            </button>
          </form>
        </div>
      )}

      {/* ── DEBUG ── */}
      {debugInfo && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: '#1a202c',
            borderRadius: '8px',
            border: '1px solid #4a5568',
          }}
        >
          <pre
            style={{
              color: '#68d391',
              fontSize: '11px',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  )
}