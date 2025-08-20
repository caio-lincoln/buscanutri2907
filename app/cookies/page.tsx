import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Cookie,
  Settings,
  Shield,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
} from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] via-white to-[#F2E6D8]/50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-[#1E1D40] hover:text-[#4AB0D9]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao início
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-[#4AB0D9]" />
              <span className="font-semibold text-[#1E1D40]">Política de Cookies</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium mb-6">
              <Settings className="h-4 w-4" />
              Transparência Digital
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E1D40] mb-4">Política de Cookies</h1>
            <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
              Como utilizamos cookies e tecnologias similares na plataforma Busca Nutri
            </p>
            <div className="mt-6 text-sm text-[#1E1D40]/60">
              <p><strong>Última atualização:</strong> 20/08/2025</p>
              <p><strong>Versão:</strong> 2.0</p>
            </div>
          </div>

          {/* Empresa/Responsável */}
          <Card className="mb-8 border-[#4AB0D9]/20 shadow-lg">
            <CardHeader className="bg-[#4AB0D9]/5">
              <CardTitle className="flex items-center gap-2 text-[#1E1D40]">
                <Shield className="h-5 w-5 text-[#4AB0D9]" />
                Responsável pelos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <strong className="text-[#1E1D40]">Empresa:</strong>
                    <p className="text-[#1E1D40]/70">Busca Nutri</p>
                  </div>
                  <div>
                    <strong className="text-[#1E1D40]">CNPJ:</strong>
                    <p className="text-[#1E1D40]/70">57.370.073/0001-92</p>
                  </div>
                  <div>
                    <strong className="text-[#1E1D40]">Responsável:</strong>
                    <p className="text-[#1E1D40]/70">Iris Patricia Carregosa da Silva</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#4AB0D9]" />
                    <span className="text-[#1E1D40]/70">Aracaju, SE - Brasil</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#4AB0D9]" />
                    <a href="tel:+557999134938" className="text-[#4AB0D9] hover:underline">
                      (79) 9 9813-4938
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#4AB0D9]" />
                    <a href="mailto:cookies@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                      cookies@buscanutri.com.br
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <div className="space-y-8">
            {/* 1. O que são Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">1. O que são Cookies?</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita a
                  plataforma. Usamos cookies e tecnologias similares para melhorar sua experiência, personalizar
                  conteúdo, analisar uso, garantir segurança e permitir funcionalidades essenciais.
                </p>
              </CardContent>
            </Card>

            {/* 2. Gerenciamento e Consentimento */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">2. Gerenciamento e Consentimento</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Ao acessar a plataforma, exibimos um banner para você aceitar, recusar ou personalizar categorias
                  de cookies. Cookies não essenciais (marketing, analytics e redes sociais) só são ativados com seu
                  consentimento explícito. Você pode revisar ou alterar escolhas a qualquer momento no painel de
                  privacidade.
                </p>
                <p className="text-[#1E1D40]/80">
                  O uso de cookies deve ser interpretado em conjunto com nossa{' '}
                  <Link href="/privacidade" className="text-[#4AB0D9] hover:underline font-medium">
                    Política de Privacidade
                  </Link>.
                </p>
              </CardContent>
            </Card>

            {/* 3. Tipos de Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">3. Tipos de Cookies que Utilizamos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">3.1 Essenciais</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Manter você logado durante a sessão</li>
                  <li>Lembrar preferências de idioma</li>
                  <li>Garantir a segurança da navegação</li>
                  <li>Processar transações e pagamentos</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.2 Performance</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Páginas mais visitadas</li>
                  <li>Tempo de permanência</li>
                  <li>Identificar erros técnicos</li>
                  <li>Melhorar velocidade e otimização</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.3 Funcionalidade</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Lembrar preferências de busca</li>
                  <li>Adaptar a interface às suas necessidades</li>
                  <li>Salvar configurações de acessibilidade</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.4 Marketing</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li>Exibir anúncios relevantes</li>
                  <li>Medir resultados de campanhas</li>
                  <li>Evitar repetição excessiva de anúncios</li>
                  <li>Rastrear conversões</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Cookies de Terceiros (exemplos) */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">4. Cookies de Terceiros</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 mb-3">
                  Alguns cookies podem ser definidos por terceiros confiáveis para análise, segurança,
                  autenticação ou publicidade. Exemplos:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li><code>_ga</code> (Google Analytics) — análise de tráfego — 2 anos</li>
                  <li><code>_gid</code> (Google Analytics) — estatísticas de visitas — 24 horas</li>
                  <li><code>fr</code> (Facebook) — publicidade personalizada — 90 dias</li>
                  <li><code>__stripe_mid</code> (Stripe) — processamento seguro de pagamentos — 1 ano</li>
                  <li><code>sb</code> (Facebook) — autenticação/widgets sociais — 2 anos</li>
                  <li><code>c_user</code> (Facebook) — login social — sessão</li>
                </ul>
                <p className="text-[#1E1D40]/70 mt-3">
                  Alguns provedores podem processar informações fora do Brasil — veja “Transferência Internacional”.
                </p>
              </CardContent>
            </Card>

            {/* 5. Transferência Internacional */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">5. Transferência Internacional de Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Certos cookies (por ex., Google Analytics, Facebook/Meta, Stripe) podem envolver transferência
                  internacional (ex.: EUA/Irlanda). Sempre que necessário, garantimos: grau de proteção adequado,
                  salvaguardas contratuais apropriadas e, quando exigido, consentimento específico do usuário.
                  Você poderá optar por manter somente cookies que não gerem transferência internacional.
                </p>
              </CardContent>
            </Card>

            {/* 6. Duração dos Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">6. Duração dos Cookies</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li><strong>Sessão:</strong> removidos ao fechar o navegador</li>
                  <li><strong>Preferências:</strong> até 1 ano</li>
                  <li><strong>Analytics:</strong> até 2 anos</li>
                  <li><strong>Marketing:</strong> até 90 dias</li>
                  <li><strong>Segurança:</strong> até 6 meses</li>
                </ul>
              </CardContent>
            </Card>

            {/* 7. Como Gerenciar */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">7. Como Gerenciar seus Cookies</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li>Painel de configurações na plataforma: personalize ou revogue consentimento a qualquer momento</li>
                  <li>Configurações do navegador: Chrome, Firefox, Safari, Edge — bloquear, excluir ou gerenciar cookies</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Importante:</strong> Desabilitar cookies essenciais pode limitar o funcionamento da plataforma.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 8. Seus Direitos */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">8. Seus Direitos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li><strong>Consentimento:</strong> dar/retirar para cookies não essenciais</li>
                  <li><strong>Acesso:</strong> saber quais cookies estão armazenados</li>
                  <li><strong>Exclusão:</strong> solicitar remoção de cookies/dados associados</li>
                  <li><strong>Portabilidade:</strong> receber dados coletados via cookies em formato estruturado</li>
                  <li><strong>Oposição:</strong> recusar cookies para certas finalidades</li>
                </ul>
              </CardContent>
            </Card>

            {/* 9. Atualizações */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">9. Atualizações desta Política</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Esta Política pode ser alterada para refletir mudanças técnicas, legais ou operacionais.
                  Verifique periodicamente — a data da última atualização está no topo desta página.
                </p>
              </CardContent>
            </Card>

            {/* 10. Contato */}
            <Card className="border-[#4AB0D9]/20 shadow-lg bg-[#4AB0D9]/5">
              <CardHeader><CardTitle className="text-[#1E1D40]">10. Contato e Suporte</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-[#1E1D40]">Responsável:</strong>
                      <p className="text-[#1E1D40]/70">Iris Patricia Carregosa da Silva</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="mailto:cookies@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                        cookies@buscanutri.com.br
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="tel:+557999134938" className="text-[#4AB0D9] hover:underline">
                        (79) 9 9813-4938
                      </a>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-[#4AB0D9]" />
                      <a
                        href="https://wa.me/557999134938?text=Olá! Tenho dúvidas sobre a Política de Cookies da Busca Nutri."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4AB0D9] hover:underline"
                      >
                        WhatsApp
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#4AB0D9]" />
                      <span className="text-[#1E1D40]/70">Aracaju, SE - Brasil</span>
                    </div>
                    <div>
                      <strong className="text-[#1E1D40]">Horário:</strong>
                      <p className="text-[#1E1D40]/70">Segunda a Sexta, 9h às 18h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link href="/">
              <Button variant="outline" className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </Link>
            <Link href="/privacidade">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Ver Política de Privacidade</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
