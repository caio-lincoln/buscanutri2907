import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Scale, FileText, Shield, AlertTriangle, Phone, Mail, MapPin } from "lucide-react"

export default function TermosPage() {
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
              <Scale className="h-5 w-5 text-[#4AB0D9]" />
              <span className="font-semibold text-[#1E1D40]">Termos de Uso</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium mb-6">
              <FileText className="h-4 w-4" />
              Documento Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E1D40] mb-4">Termos de Uso</h1>
            <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
              Conheça os termos e condições para uso da plataforma Busca Nutri
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
                Informações da Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <strong className="text-[#1E1D40]">Razão Social:</strong>
                    <p className="text-[#1E1D40]/70">Busca Nutri</p>
                  </div>
                  <div>
                    <strong className="text-[#1E1D40]">CNPJ:</strong>
                    <p className="text-[#1E1D40]/70">57.370.073/0001-92</p>
                  </div>
                  <div>
                    <strong className="text-[#1E1D40]">Responsável Legal:</strong>
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
                    <a href="tel:+5579999158274" className="text-[#4AB0D9] hover:underline">
                      (79) 99915-8274
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#4AB0D9]" />
                    <a href="mailto:legal@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                      legal@buscanutri.com.br
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo dos Termos */}
          <div className="space-y-8">
            {/* 1. Aceitação dos Termos */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">1. Aceitação dos Termos</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Ao acessar e utilizar a plataforma Busca Nutri, você concorda integralmente com estes Termos de Uso.
                  Se você não concorda com qualquer parte destes termos, não deve utilizar nossos serviços.
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Estes termos constituem um acordo legal entre você e a Busca Nutri (CNPJ: 57.370.073/0001-92),
                  estabelecendo as condições para uso de nossa plataforma digital.
                </p>
              </CardContent>
            </Card>

            {/* 2. Descrição dos Serviços */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">2. Descrição dos Serviços</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A Busca Nutri é uma plataforma digital que conecta nutricionistas, pacientes e empresas, oferecendo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Cadastro e verificação de profissionais de nutrição</li>
                  <li>Sistema de busca e agendamento de consultas presenciais</li>
                  <li>Ferramentas de comunicação entre usuários</li>
                  <li>Publicação de conteúdo educativo e científico</li>
                  <li>Marketplace de oportunidades profissionais</li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Cadastro e Conta de Usuário */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">3. Cadastro e Conta de Usuário</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">3.1 Requisitos para Cadastro</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Ser maior de 18 anos ou ter autorização dos responsáveis legais</li>
                  <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                  <li>Para nutricionistas: possuir registro ativo no CRN</li>
                  <li>Para empresas: possuir CNPJ ativo e documentação válida</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.2 Responsabilidades do Usuário</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Notificar imediatamente sobre uso não autorizado da conta</li>
                  <li>Atualizar informações pessoais e profissionais regularmente</li>
                  <li>Utilizar a plataforma de forma ética e responsável</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Uso Aceitável */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">4. Uso Aceitável da Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">4.1 Condutas Permitidas</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Utilizar a plataforma para fins profissionais legítimos</li>
                  <li>Compartilhar conteúdo educativo e científico relevante</li>
                  <li>Interagir respeitosamente com outros usuários</li>
                  <li>Reportar comportamentos inadequados ou suspeitos</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">4.2 Condutas Proibidas</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Publicar informações falsas ou enganosas</li>
                  <li>Praticar spam ou enviar mensagens não solicitadas</li>
                  <li>Violar direitos autorais ou propriedade intelectual</li>
                  <li>Utilizar a plataforma para atividades ilegais</li>
                  <li>Tentar acessar contas de outros usuários</li>
                  <li>Interferir no funcionamento da plataforma</li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Propriedade Intelectual */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">5. Propriedade Intelectual</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Todo o conteúdo da plataforma Busca Nutri, incluindo mas não limitado a textos, gráficos, logotipos,
                  ícones, imagens, clipes de áudio, downloads digitais e software, é propriedade da Busca Nutri ou de
                  seus fornecedores de conteúdo.
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Os usuários mantêm os direitos sobre o conteúdo que criam e publicam, mas concedem à Busca Nutri uma
                  licença não exclusiva para usar, modificar e distribuir esse conteúdo na plataforma.
                </p>
              </CardContent>
            </Card>

            {/* 6. Privacidade e Proteção de Dados */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">6. Privacidade e Proteção de Dados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A coleta, uso e proteção de seus dados pessoais são regidos por nossa
                  <Link href="/privacidade" className="text-[#4AB0D9] hover:underline font-medium">
                    Política de Privacidade
                  </Link>
                  , que está em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Ao utilizar nossa plataforma, você consente com a coleta e uso de suas informações conforme descrito
                  em nossa Política de Privacidade.
                </p>
              </CardContent>
            </Card>

            {/* 7. Responsabilidades e Limitações */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">7. Responsabilidades e Limitações</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">7.1 Responsabilidades da Busca Nutri</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Manter a plataforma funcionando adequadamente</li>
                  <li>Proteger os dados dos usuários conforme a LGPD</li>
                  <li>Verificar a documentação dos profissionais cadastrados</li>
                  <li>Fornecer suporte técnico aos usuários</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">7.2 Limitações de Responsabilidade</h4>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A Busca Nutri atua como intermediadora, não sendo responsável por:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Qualidade dos serviços prestados pelos profissionais</li>
                  <li>Resultados de tratamentos ou consultas</li>
                  <li>Disputas entre usuários da plataforma</li>
                  <li>Conteúdo publicado pelos usuários</li>
                </ul>
              </CardContent>
            </Card>

            {/* 8. Pagamentos e Cancelamentos */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">8. Pagamentos e Cancelamentos</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">8.1 Política de Pagamentos</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Pagamentos são processados através de parceiros seguros</li>
                  <li>Preços podem variar conforme o tipo de serviço</li>
                  <li>Taxas de transação podem ser aplicadas</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">8.2 Política de Cancelamento</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Consultas podem ser canceladas até 24 horas antes</li>
                  <li>Reembolsos seguem as políticas dos profissionais</li>
                  <li>Cancelamentos de última hora podem gerar taxas</li>
                  <li>Contas podem ser encerradas a qualquer momento</li>
                </ul>
              </CardContent>
            </Card>

            {/* 9. Suspensão e Encerramento */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">9. Suspensão e Encerramento de Conta</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A Busca Nutri reserva-se o direito de suspender ou encerrar contas que violem estes Termos de Uso, sem
                  aviso prévio, especialmente em casos de:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Violação das políticas da plataforma</li>
                  <li>Atividades fraudulentas ou ilegais</li>
                  <li>Comportamento inadequado com outros usuários</li>
                  <li>Fornecimento de informações falsas</li>
                  <li>Uso não autorizado da plataforma</li>
                </ul>
              </CardContent>
            </Card>

            {/* 10. Modificações dos Termos */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">10. Modificações dos Termos</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A Busca Nutri pode modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor
                  imediatamente após sua publicação na plataforma.
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  É responsabilidade do usuário revisar periodicamente estes termos. O uso continuado da plataforma após
                  as modificações constitui aceitação dos novos termos.
                </p>
              </CardContent>
            </Card>

            {/* 11. Lei Aplicável e Foro */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">11. Lei Aplicável e Foro</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa decorrente destes termos será
                  resolvida no foro da comarca de Aracaju, Estado de Sergipe, com exclusão de qualquer outro, por mais
                  privilegiado que seja.
                </p>
              </CardContent>
            </Card>

            {/* 12. Contato */}
            <Card className="border-[#4AB0D9]/20 shadow-lg bg-[#4AB0D9]/5">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">12. Contato e Suporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Para dúvidas, sugestões ou questões relacionadas a estes Termos de Uso, entre em contato conosco:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="mailto:legal@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                        legal@buscanutri.com.br
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="tel:+5579999158274" className="text-[#4AB0D9] hover:underline">
                        (79) 99915-8274
                      </a>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#4AB0D9]" />
                      <span className="text-[#1E1D40]/70">Aracaju, SE - Brasil</span>
                    </div>
                    <div>
                      <strong className="text-[#1E1D40]">Horário de Atendimento:</strong>
                      <p className="text-[#1E1D40]/70">Segunda a Sexta, 9h às 18h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerta Final */}
          <Card className="mt-8 border-amber-200 bg-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Importante</h4>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Ao continuar usando a plataforma Busca Nutri, você confirma que leu, compreendeu e concorda com
                    todos os termos e condições estabelecidos neste documento. Se você não concorda com algum termo,
                    deve interromper o uso da plataforma imediatamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
