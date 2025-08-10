'use client'

type ToastProps = {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function toast({ title, description, variant = 'default' }: ToastProps) {
  // Simple toast implementation - in a real app you'd use a proper toast library
  // For demo purposes, we'll use a simple alert
  if (variant === 'destructive') {
    alert(`Erro: ${title}\n${description}`)
  } else {
    alert(`${title}\n${description}`)
  }
}

export function useToast() {
  return { toast }
}
