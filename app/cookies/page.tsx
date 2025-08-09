import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Cookie, Settings, Shield, Phone, Mail, MapPin, MessageCircle } from "lucide-react"

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
          {/* Hero Section */}
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
              <p>
                <strong>Última atualização:</strong> 21 de janeiro de 2025
              </p>
              <p>
                <strong>Versão:</strong> 2.0
              </p>
            </div>
          </div>

          {/* Informações da Empresa */}
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

          {/* Conteúdo da Política */}
          <div className="space-y-8">
            {/* 1. O que são Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">1. O que são Cookies?</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo (computador, tablet ou
                  smartphone) quando você visita um site. Eles são amplamente utilizados para fazer os sites funcionarem
                  de forma mais eficiente e fornecer informações aos proprietários do site.
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Na Busca Nutri, utilizamos cookies e tecnologias similares para melhorar sua experiência, personalizar
                  conteúdo e analisar como nossa plataforma é utilizada.
                </p>
              </CardContent>
            </Card>

            {/* 2. Tipos de Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">2. Tipos de Cookies que Utilizamos</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">2.1 Cookies Essenciais</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-2">
                  <strong>Finalidade:</strong> Necessários para o funcionamento básico da plataforma
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Manter você logado durante a sessão</li>
                  <li>Lembrar suas preferências de idioma</li>
                  <li>Garantir a segurança da navegação</li>
                  <li>Processar transações e pagamentos</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.2 Cookies de Performance</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-2">
                  <strong>Finalidade:</strong> Coletar informações sobre como você usa nossa plataforma
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Páginas mais visitadas</li>
                  <li>Tempo de permanência no site</li>
                  <li>Identificar erros e problemas técnicos</li>
                  <li>Melhorar a velocidade e performance</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.3 Cookies de Funcionalidade</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-2">
                  <strong>Finalidade:</strong> Personalizar sua experiência na plataforma
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Lembrar suas preferências de busca</li>
                  <li>Personalizar conteúdo relevante</li>
                  <li>Adaptar a interface às suas necessidades</li>
                  <li>Salvar configurações de acessibilidade</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.4 Cookies de Marketing</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-2">
                  <strong>Finalidade:</strong> Entregar publicidade relevante e medir eficácia
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li>Mostrar anúncios personalizados</li>
                  <li>Medir eficácia de campanhas publicitárias</li>
                  <li>Evitar mostrar o mesmo anúncio repetidamente</li>
                  <li>Rastrear conversões e resultados</li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Cookies de Terceiros */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">3. Cookies de Terceiros</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Alguns cookies em nossa plataforma são definidos por serviços de terceiros confiáveis:
                </p>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.1 Google Analytics</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Análise de tráfego e comportamento dos usuários</li>
                  <li>Relatórios de performance da plataforma</li>
                  <li>Identificação de tendências de uso</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.2 Processadores de Pagamento</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>Processamento seguro de transações</li>
                  <li>Prevenção de fraudes</li>
                  <li>Conformidade com padrões de segurança</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.3 Redes Sociais</h4>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li>Botões de compartilhamento</li>
                  <li>Login social (Facebook, Google)</li>
                  <li>Widgets de redes sociais</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Duração dos Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">4. Duração dos Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">4.1 Cookies de Sessão</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  São temporários e são excluídos quando você fecha o navegador. Utilizados para manter você logado
                  durante a navegação.
                </p>

                <h4 className="font-semibold text-[#1E1D40] mb-3">4.2 Cookies Persistentes</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Permanecem no seu dispositivo por um período determinado:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80">
                  <li>
                    <strong>Preferências:</strong> Até 1 ano
                  </li>
                  <li>
                    <strong>Analytics:</strong> Até 2 anos
                  </li>
                  <li>
                    <strong>Marketing:</strong> Até 90 dias
                  </li>
                  <li>
                    <strong>Segurança:</strong> Até 6 meses
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Gerenciamento de Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">5. Como Gerenciar seus Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">5.1 Configurações da Plataforma</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Você pode gerenciar suas preferências de cookies diretamente em nossa plataforma através do painel de
                  configurações de privacidade.
                </p>

                <h4 className="font-semibold text-[#1E1D40] mb-3">5.2 Configurações do Navegador</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-2">
                  Você também pode controlar cookies através das configurações do seu navegador:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-[#1E1D40]/80 mb-4">
                  <li>
                    <strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies
                  </li>
                  <li>
                    <strong>Firefox:</strong> Opções → Privacidade e segurança → Cookies
                  </li>
                  <li>
                    <strong>Safari:</strong> Preferências → Privacidade → Cookies
                  </li>
                  <li>
                    <strong>Edge:</strong> Configurações → Cookies e permissões do site
                  </li>
                </ul>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Importante:</strong> Desabilitar cookies essenciais pode afetar o funcionamento da
                    plataforma e limitar algumas funcionalidades.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 6. Seus Direitos */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">6. Seus Direitos</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Em relação aos cookies e dados coletados, você tem o direito de:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>
                    <strong>Consentimento:</strong> Dar ou retirar consentimento para cookies não essenciais
                  </li>
                  <li>
                    <strong>Acesso:</strong> Saber quais cookies estão sendo utilizados
                  </li>
                  <li>
                    <strong>Exclusão:</strong> Solicitar a remoção de cookies e dados associados
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> Receber dados coletados via cookies em formato estruturado
                  </li>
                  <li>
                    <strong>Oposição:</strong> Opor-se ao uso de cookies para determinadas finalidades
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 7. Atualizações */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">7. Atualizações desta Política</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Esta Política de Cookies pode ser atualizada periodicamente para refletir mudanças em nossas práticas
                  ou por outros motivos operacionais, legais ou regulamentares.
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Recomendamos que você revise esta política regularmente. A data da última atualização está sempre
                  indicada no topo desta página.
                </p>
              </CardContent>
            </Card>

            {/* 8. Contato */}
            <Card className="border-[#4AB0D9]/20 shadow-lg bg-[#4AB0D9]/5">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">8. Contato e Suporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Para dúvidas sobre cookies, exercer seus direitos ou obter mais informações, entre em contato conosco:
                </p>
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

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link href="/">
              <Button
                variant="outline"
                className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent"
              >
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

