"use client"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Global error boundary:", error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h2 className="text-lg font-semibold">Algo deu errado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error?.message || "Ocorreu um erro inesperado. Tente novamente."}
            </p>
            <button
              className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              onClick={() => reset()}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}