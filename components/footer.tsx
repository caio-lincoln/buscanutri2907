import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, Globe, Instagram, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#2A2951] text-white">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="space-y-6">
            <Image
              src="/logo-busca-nutri-white.png"
              alt="Busca Nutri"
              width={160}
              height={32}
              className="h-8 w-auto"
            />
            <p className="text-white/70 text-sm leading-relaxed">
              Conectando nutricionistas e transformando vidas através da
              tecnologia e colaboração. A plataforma que revoluciona o cuidado
              nutricional.
            </p>
          </div>

          {/* Plataforma */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Plataforma</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/nutricionistas"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Nutricionistas
                </Link>
              </li>
              <li>
                <Link
                  href="/vagas"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Vagas
                </Link>
              </li>
              <li>
                <Link
                  href="/cadastro"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Cadastro
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Suporte</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/central-ajuda"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-white/70 hover:text-[#4AB0D9] transition-colors"
                >
                  Perguntas & Respostas
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Contato</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3 text-white/70">
                <Mail className="h-4 w-4 text-[#4AB0D9]" />
                <span>buscanutri@gmail.com</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <Phone className="h-4 w-4 text-[#4AB0D9]" />
                <span>(79) 9 9813-4938 (Busca Nutri)</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <Globe className="h-4 w-4 text-[#4AB0D9]" />
                <span>www.buscanutri.com.br</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <Instagram className="h-4 w-4 text-[#4AB0D9]" />
                <span>@buscanutri</span>
              </li>
              <li className="flex items-center gap-3 text-white/70">
                <MapPin className="h-4 w-4 text-[#4AB0D9]" />
                <span>Aracaju, SE - Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-white/10 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <div className="text-white/50 text-sm">
                © 2025 Busca Nutri. Todos os direitos reservados.
              </div>
              <div className="text-white/40 text-xs mt-1">
                CNPJ: 57.370.073/0001-92
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <Link
                href="/termos"
                className="text-white/50 hover:text-[#4AB0D9] transition-colors"
              >
                Termos de Uso
              </Link>
              <Link
                href="/privacidade"
                className="text-white/50 hover:text-[#4AB0D9] transition-colors"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/cookies"
                className="text-white/50 hover:text-[#4AB0D9] transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
