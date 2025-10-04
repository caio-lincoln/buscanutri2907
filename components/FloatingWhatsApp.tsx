import Link from 'next/link'
import Image from 'next/image'

export function FloatingWhatsApp() {
  return (
    <Link
      href="https://wa.me/5579998134938"
      aria-label="Fale conosco pelo WhatsApp"
      title="Fale conosco pelo WhatsApp"
      rel="noopener noreferrer"
      target="_blank"
      className="fixed z-[99] select-none transition-transform hover:scale-105"
      style={{
        right: '20px',
        bottom: '20px',
        filter: 'drop-shadow(0px 5px 10px rgba(0,0,0,0.7))',
      }}
    >
      <Image
        src="/whatsapp.png"
        alt="WhatsApp"
        width={80}
        height={80}
        className="h-16 w-16 lg:h-20 lg:w-20 rounded-full"
        priority
      />
    </Link>
  )
}