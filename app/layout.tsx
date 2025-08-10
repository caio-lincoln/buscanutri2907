import type React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Busca Nutri - Conectando Nutricionistas, Transformando Vidas',
  description:
    'Plataforma que conecta nutricionistas e pacientes. Encontre profissionais qualificados ou expanda sua prática profissional.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/Rosa.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/Rosa.png',
  },
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
