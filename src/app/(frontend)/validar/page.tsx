import QRScanner from '@/components/QRScanner'

export const metadata = {
  title: 'Validador de Entradas — Swap Party',
}

export default function ValidarPage() {
  return (
    <main className="page-container dark">
      <QRScanner />
    </main>
  )
}
