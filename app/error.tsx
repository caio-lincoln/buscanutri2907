"use client"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("App error boundary:", error)
  }, [error])

  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold">Ocorreu um erro inesperado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message || "Tente novamente ou recarregue a página."}
        </p>
        <button
          className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
