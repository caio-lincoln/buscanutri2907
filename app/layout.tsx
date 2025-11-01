import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/auth-context'
import { SessionTrackerProvider } from '@/components/session-tracker-provider'
import { VisitTrackerProvider } from '@/components/visit-tracker-provider'
import { Suspense } from 'react'
import Loading from '@/components/ui/loading'
import Script from 'next/script'
import MetaPixelRouteChange from './MetaPixelRouteChange'
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp'

const inter = Inter({ subsets: [ 'latin' ] })

export const metadata: Metadata = {
  title: 'Busca Nutri - Conectando Nutricionistas, Transformando Vidas',
  description:
    'Plataforma que conecta nutricionistas e pacientes. Encontre profissionais qualificados ou expanda sua prática profissional.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pixelId = process.env[ 'NEXT_PUBLIC_FB_PIXEL_ID' ]
  const gtagId = process.env['NEXT_PUBLIC_GTAG_ID'] || 'AW-17548763804'

  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {gtagId && (
          <>
            {/* Google tag (gtag.js) */}
            <Script
              id="gtag-src"
              src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);} 
                gtag('js', new Date());
                gtag('config', '${gtagId}');
              `}
            </Script>
          </>
        )}
        {pixelId && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s){
                  if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)
                }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `}
            </Script>

            {/* Fallback sem JS deve ficar dentro do body (ou em app/head.tsx) */}
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>

            {/* Dispara PageView a cada navegação */}
            <Suspense fallback={<Loading /> }>
              <MetaPixelRouteChange />
            </Suspense>
          </>
        )}

        <AuthProvider>
          <VisitTrackerProvider>
          <SessionTrackerProvider>
            <Suspense fallback={<Loading /> }>
              {children}
              <Toaster />
              <Sonner />
              <FloatingWhatsApp />
            </Suspense>
          </SessionTrackerProvider>
          </VisitTrackerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
