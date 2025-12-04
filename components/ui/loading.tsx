'use client'

import { Loader2 } from 'lucide-react'

type LoadingProps = {
  message?: string
  className?: string
}

export default function Loading({ message = 'Carregando...', className = '' }: LoadingProps) {
  return (
    <div className={`min-h-screen flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-[#1E1D40]/70 font-medium">{message}</p>
      </div>
    </div>
  )
}
