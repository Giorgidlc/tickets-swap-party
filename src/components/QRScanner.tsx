'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

  // ── Validar token contra la API ──
  const validateToken = useCallback(
    async (token: string) => {
      // Evitar llamadas dobles
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      setLoading(true)
      setDebugInfo(`Token leído: "${token}" (${token.length} chars)`)

      try {
        console.log('📡 Enviando a /api/validate:', { qrToken: token, pin: '****' })

        const res = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            qrToken: token.trim(),
            pin,
          }),
        })

        const data = await res.json()
        console.log('📡 Respuesta /api/validate:', data)

        setDebugInfo(
          `Token: "${token.substring(0, 8)}..."\nStatus HTTP: ${res.status}\nRespuesta: ${JSON.stringify(data, null, 2)}`,
        )
        setResult(data)
      } catch (err: any) {
        console.error('❌ Error fetch:', err)
        setDebugInfo(`Token: "${token}"\nError: ${err.message}`)
        setResult({
          valid: false,
          status: 'error',
          message: `❌ Error de conexión: ${err.message}`,
        })
      } finally {
        setLoading(false)
        isProcessingRef.current = false
      }
    },
    [pin],
  )

  // ── Iniciar escáner ──
  const startScanner = useCallback(() => {
    setResult(null)
    setDebugInfo('')
    setScanning(true)
    isProcessingRef.current = false

    // Limpiar scanner anterior
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
      } catch (e) {
        console.warn('Error limpiando scanner:', e)
      }
      scannerRef.current = null
    }

    setTimeout(() => {
      const container = document.getElementById('qr-reader')
      if (!container) {
        console.error('Container qr-reader no encontrado')
        return
      }

      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            rememberLastUsedCamera: true,
          },
          false, // verbose = false
        )

        scanner.render(
          async (decodedText) => {
            // Evitar procesamiento doble
            if (isProcessingRef.current) return

            console.log('🔍 QR decodificado:', decodedText)

            // Parar el scanner de forma segura
            try {
              if (scannerRef.current) {
                await scannerRef.current.clear()
                scannerRef.current = null
              }
            } catch (e) {
              console.warn('Error parando scanner:', e)
            }

            setScanning(false)

            // Validar el token
            await validateToken(decodedText)
          },
          (_errorMessage) => {
            // Normal mientras busca QR — ignorar
          },
        )

        scannerRef.current = scanner
      } catch (err) {
        console.error('Error iniciando scanner:', err)
        setDebugInfo(`Error iniciando cámara: ${err}`)
      }
    }, 300)
  }, [validateToken])

  // ── Validación manual (fallback) ──
  const handleManualValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualToken.trim()) return
    setScanning(false)

    // Limpiar scanner si está activo
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear()
        scannerRef.current = null
      } catch (e) {
        console.warn('Error limpiando scanner:', e)
      }
    }

    await validateToken(manualToken.trim())
  }

  // ── Limpiar al desmontar ──
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
              setAuthenticated(true)
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
          <button
            type="submit"
            className="btn-primary"
            disabled={pin.length < 4}
            style={{ marginTop: '12px', maxWidth: '200px' }}
          >
            Entrar
          </button>
        </form>
      </div>
    )
  }

  // ═══════════════════════════════════
  // PANTALLA PRINCIPAL DEL VALIDADOR
  // ═══════════════════════════════════
  return (
    <div className="scanner-container">
      <h2>📷 Validador de Entradas</h2>

      {/* ── RESULTADO DEL ESCANEO ── */}
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
          <div className="result-icon">
            {result.valid
              ? '✅'
              : result.status === 'already_attended'
                ? '⚠️'
                : '❌'}
          </div>
          <h3>{result.message}</h3>

          {/* Detalles del ticket */}
          {(result.email || result.ticketCode) && (
            <div className="result-details">
              {result.ticketCode && (
                <p>
                  <strong>Código:</strong> {result.ticketCode}
                </p>
              )}
              {result.email && (
                <p>
                  <strong>Email:</strong> {result.email}
                </p>
              )}
              {result.name && (
                <p>
                  <strong>Nombre:</strong> {result.name}
                </p>
              )}
              {result.drinkIncluded && (
                <p className="drink-badge">🍹 Consumición incluida</p>
              )}
              {result.attendedAt && (
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Usado: {new Date(result.attendedAt).toLocaleString('es-ES')}
                </p>
              )}
            </div>
          )}

          {/* Botón escanear siguiente */}
          <button
            onClick={startScanner}
            className="btn-primary"
            style={{ marginTop: '16px' }}
          >
            📷 Escanear siguiente
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
          <div className="spinner">Validando entrada...</div>
        </div>
      )}

      {/* ── ESCÁNER QR ── */}
      {!result && !loading && (
        <>
          {scanning ? (
            <div id="qr-reader" style={{ width: '100%', maxWidth: '400px' }} />
          ) : (
            <button
              onClick={startScanner}
              className="btn-primary"
              style={{ marginTop: '16px', maxWidth: '300px' }}
            >
              📷 Abrir cámara
            </button>
          )}
        </>
      )}

      {/* ── VALIDACIÓN MANUAL (fallback) ── */}
      {!result && !loading && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            borderTop: '1px solid #4a5568',
          }}
        >
          <p
            style={{
              color: '#a0aec0',
              fontSize: '13px',
              marginBottom: '8px',
            }}
          >
            ¿La cámara no funciona? Introduce el código del ticket:
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
                padding: '10px 14px',
                borderRadius: '8px',
                border: '2px solid #4a5568',
                background: '#2d3748',
                color: 'white',
                fontSize: '16px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!manualToken.trim()}
              style={{ width: 'auto', padding: '10px 20px' }}
            >
              Validar
            </button>
          </form>
        </div>
      )}

      {/* ── DEBUG INFO (solo visible en desarrollo o para diagnóstico) ── */}
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
          <p
            style={{
              color: '#a0aec0',
              fontSize: '11px',
              fontFamily: 'monospace',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            🔍 {debugInfo}
          </p>
        </div>
      )}
    </div>
  )
}