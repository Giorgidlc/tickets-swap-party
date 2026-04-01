import React from 'react'
import { SessionProvider } from 'next-auth/react'
import '../globals.css'
import './styles.css'

export const metadata = {
  title: 'Swap Party 🔄 Intercambio de Ropa',
  description: 'Trae la ropa que ya no usas y llévate nuevos tesoros',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="es">
      <head>
        <style>
          @import
          url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
        </style>
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
