import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Busca Nutri - Conectando Nutricionistas, Transformando Vidas",
  description:
    "Plataforma que conecta nutricionistas e pacientes. Encontre profissionais qualificados ou expanda sua prática profissional.",
  icons: {
    icon: "https://i.ibb.co/W49PNh0f/cone.jpg",
    shortcut: "https://i.ibb.co/W49PNh0f/cone.jpg",
    apple: "https://i.ibb.co/W49PNh0f/cone.jpg",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
