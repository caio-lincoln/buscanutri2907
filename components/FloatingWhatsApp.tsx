"use client"

import Link from 'next/link'

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/5579998134938"
      aria-label="Contact via WhatsApp"
      title="Contact via WhatsApp"
      rel="noopener noreferrer"
      target="_blank"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 select-none"
    >
      <span
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-none transition-transform duration-200 hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/70"
        role="img"
      >
        {/* Clean SVG WhatsApp icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="24"
          height="24"
          aria-hidden="true"
          className="fill-current"
        >
          <path d="M20.487 3.515A10.457 10.457 0 0012.05 0C5.495 0 .184 5.31.184 11.866c0 2.096.547 4.142 1.593 5.937L0 24l6.31-1.657a11.83 11.83 0 005.737 1.472h.005c6.554 0 11.865-5.31 11.865-11.868a11.81 11.81 0 00-3.49-8.432zm-8.437 16.484h-.003a8.348 8.348 0 01-4.03-1.03l-.289-.178-2.984.781.799-2.915-.187-.299a8.432 8.432 0 01-1.295-4.47c0-4.674 3.802-8.475 8.479-8.475 2.263 0 4.392.88 5.993 2.48a8.403 8.403 0 012.49 5.995c-.002 4.674-3.804 8.476-8.473 8.476z" fill="currentColor"/>
          <path d="M16.2 14.382c-.297-.149-1.756-.867-2.029-.967-.273-.1-.472-.148-.672.149-.198.296-.772.966-.947 1.164-.174.198-.348.223-.645.074-.297-.149-1.257-.463-2.395-1.477-.883-.788-1.48-1.761-1.654-2.058-.173-.297-.019-.458.13-.606.134-.133.297-.346.446-.519.149-.173.198-.296.298-.495.099-.198.05-.371-.025-.52-.075-.148-.672-1.614-.921-2.212-.242-.58-.487-.502-.672-.51-.174-.007-.372-.009-.571-.009-.198 0-.52.074-.793.372-.273.297-1.04 1.016-1.04 2.479s1.065 2.872 1.213 3.07c.148.198 2.093 3.2 5.068 4.487.709.306 1.262.489 1.693.626.711.226 1.359.194 1.872.118.571-.085 1.756-.718 2.006-1.41.248-.692.248-1.285.173-1.41-.074-.124-.273-.198-.57-.347z" fill="currentColor"/>
        </svg>
      </span>
    </Link>
  )
}
