import NewsletterSignup from "@/components/newsletter-signup"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Newsletter - Busca Nutri | Receba conteúdo exclusivo sobre nutrição",
  description:
    "Inscreva-se na newsletter da Busca Nutri e receba dicas exclusivas, artigos especializados e novidades sobre nutrição diretamente em seu e-mail.",
  keywords: "newsletter nutrição, dicas nutrição, conteúdo exclusivo, busca nutri, nutricionista",
  openGraph: {
    title: "Newsletter Busca Nutri - Conteúdo Exclusivo sobre Nutrição",
    description: "Transforme sua prática com conteúdo especializado. Inscreva-se gratuitamente!",
    type: "website",
    url: "https://buscanutri.com/newsletter",
  },
}

export default function NewsletterPage() {
  return (
    <div className="min-h-screen">
      <NewsletterSignup />
    </div>
  )
}

