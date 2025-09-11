'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

export type TabItem = {
  id: string
  label: React.ReactNode
  disabled?: boolean
}

type Props = {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
}

/**
 * Barra de abas com scroll horizontal suave:
 * - Esconde scrollbar
 * - Auto-scroll para aba ativa
 * - Botões de navegação nas bordas com gradiente
 */
export default function ScrollableTabs({ tabs, activeId, onChange, className }: Props) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = React.useState(false)
  const [showRight, setShowRight] = React.useState(false)

  // Atualiza visibilidade das setas
  const refreshArrows = React.useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setShowLeft(el.scrollLeft > 2)
    setShowRight(el.scrollLeft < max - 2)
  }, [])

  // Observa scroll/resize
  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    refreshArrows()
    const onScroll = () => refreshArrows()
    el.addEventListener('scroll', onScroll, { passive: true })
    const ro = new ResizeObserver(refreshArrows)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [refreshArrows])

  // Centraliza a aba ativa quando muda
  React.useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const active = el.querySelector<HTMLElement>(`[data-tab-id="${CSS.escape(activeId)}"]`)
    if (active) {
      active.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
    }
  }, [activeId])

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.max(160, Math.round(el.clientWidth * 0.7))
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <div className={clsx('relative', className)}>
      {/* Gradiente e botão esquerdo */}
      <div
        className={clsx(
          'pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent dark:from-background',
          showLeft ? 'opacity-100' : 'opacity-0',
          'transition-opacity'
        )}
      />
      {showLeft && (
        <button
          type="button"
          aria-label="Rolagem para a esquerda"
          onClick={() => scrollBy(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full border bg-white shadow-sm hover:bg-gray-50 p-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Scroller */}
      <div
        ref={scrollerRef}
        className="no-scrollbar overflow-x-auto whitespace-nowrap px-10" // padding p/ area dos gradientes
        role="tablist"
        aria-label="Navegação de abas"
      >
        <div className="inline-flex items-center gap-1 py-1">
          {tabs.map((t) => {
            const active = t.id === activeId
            return (
              <button
                key={t.id}
                data-tab-id={t.id}
                role="tab"
                aria-selected={active}
                disabled={t.disabled}
                onClick={() => onChange(t.id)}
                className={clsx('' )}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Gradiente e botão direito */}
      <div
        className={clsx(
          'pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent dark:from-background',
          showRight ? 'opacity-100' : 'opacity-0',
          'transition-opacity'
        )}
      />
      {showRight && (
        <button
          type="button"
          aria-label="Rolagem para a direita"
          onClick={() => scrollBy(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full border bg-white shadow-sm hover:bg-gray-50 p-1.5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
