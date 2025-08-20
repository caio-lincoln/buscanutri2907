import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Scale,
  FileText,
  Shield,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] via-white to-[#F2E6D8]/50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-[#1E1D40] hover:text-[#4AB0D9]"
              >
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
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium mb-6">
              <FileText className="h-4 w-4" />
              Documento Legal
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E1D40] mb-4">
              Termos de Uso
            </h1>
            <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
              Conheça os termos e condições para uso da plataforma Busca Nutri
            </p>
            <div className="mt-6 text-sm text-[#1E1D40]/60">
              <p><strong>Última atualização:</strong> 21 de janeiro de 2025</p>
              <p><strong>Versão:</strong> 2.0</p>
            </div>
          </div>

          {/* Empresa */}
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
                    <a href="tel:+557999134938" className="text-[#4AB0D9] hover:underline">
                      (79) 9 9813-4938
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

          <div className="space-y-8">
            {/* 1 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">1. Aceitação dos Termos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Ao acessar e utilizar a plataforma Busca Nutri, você concorda integralmente com estes Termos de Uso.
                  Caso não concorde com qualquer parte, não deverá utilizar nossos serviços. Estes termos constituem
                  um acordo legal entre você e a Busca Nutri (CNPJ: 57.370.073/0001-92), estabelecendo as condições
                  de uso da plataforma digital.
                </p>
              </CardContent>
            </Card>

            {/* 2 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">2. Descrição dos Serviços</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">A Busca Nutri é uma plataforma de intermediação que conecta:</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Cadastro e verificação de profissionais de nutrição;</li>
                  <li>Sistema de busca e agendamento de consultas presenciais e <strong>teleconsultas</strong>;</li>
                  <li>Ferramentas de comunicação entre usuários (fórum, Q&amp;A públicos);</li>
                  <li>Publicação de conteúdo educativo e científico;</li>
                  <li>Marketplace de oportunidades profissionais e serviços corporativos.</li>
                </ul>
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri <strong>não presta serviços de nutrição</strong>, atuando apenas como facilitadora entre usuários.
                </p>
              </CardContent>
            </Card>

            {/* 3 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">3. Cadastro e Conta de Usuário</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">3.1 Requisitos para Cadastro</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Ser maior de 18 anos ou possuir autorização dos responsáveis;</li>
                  <li>Fornecer informações verdadeiras, precisas e atualizadas;</li>
                  <li>Nutricionistas: registro ativo no CRN;</li>
                  <li>Empresas: CNPJ ativo e documentação válida.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.2 Responsabilidades e Especificidades</h4>
                <p className="text-[#1E1D40]/80 font-medium">Nutricionistas</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Manter perfil profissional atualizado;</li>
                  <li>Pagar assinatura mensal para funcionalidades ampliadas;</li>
                  <li>Aceitar retenção de <em>percentual previamente acordado</em> sobre valores de teleconsultas e serviços corporativos contratados via plataforma;</li>
                  <li>Cupons de desconto concedidos serão abatidos do valor pago pelo paciente;</li>
                  <li>Conteúdo de blog é de responsabilidade do autor; a plataforma pode moderar/remover publicações denunciadas ou em desacordo;</li>
                  <li>Permitir uso de imagem, nome e conteúdo profissional em campanhas de divulgação da plataforma, sem ônus adicional.</li>
                </ul>
                <p className="text-[#1E1D40]/80 italic">
                  Obrigação legal: toda atuação deve observar integralmente as normas do CFN/CRN. A qualidade técnica,
                  ética e científica do atendimento e das informações prestadas é de responsabilidade exclusiva do nutricionista.
                </p>

                <p className="text-[#1E1D40]/80 font-medium mt-4">Pacientes</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Podem navegar sem cadastro; cadastro é obrigatório para contatar profissionais, postar dúvidas e agendar consultas;</li>
                  <li>Devem manter suas informações atualizadas.</li>
                </ul>

                <p className="text-[#1E1D40]/80 font-medium">Empresas</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Devem possuir CNPJ válido e documentação adequada;</li>
                  <li>Podem cadastrar vagas, contratar serviços e interagir com profissionais.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3 mt-6">3.3 Responsabilidades Gerais</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Manter confidencialidade das credenciais;</li>
                  <li>Notificar uso não autorizado da conta;</li>
                  <li>Usar a plataforma de forma ética e conforme estes Termos.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">4. Uso Aceitável da Plataforma</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">4.1 Condutas Permitidas</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Uso profissional legítimo;</li>
                  <li>Compartilhamento de conteúdo educativo e científico;</li>
                  <li>Interações respeitosas;</li>
                  <li>Reporte de condutas inadequadas.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">4.2 Condutas Proibidas</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Publicar informações falsas;</li>
                  <li>Spam ou mensagens não solicitadas;</li>
                  <li>Violação de direitos autorais ou de terceiros;</li>
                  <li>Atividades ilegais;</li>
                  <li>Tentar acessar contas alheias ou interferir no funcionamento da plataforma;</li>
                  <li><strong>Realizar acordos, parcerias, agendamentos ou teleconsultas diretamente entre usuários, sem intermediação e cobrança via plataforma</strong>.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 5 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">5. Propriedade Intelectual</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Conteúdos, marcas, imagens e softwares são propriedade da Busca Nutri ou de seus fornecedores.
                  Usuários mantêm direitos sobre o que publicam, concedendo licença não exclusiva para uso e
                  distribuição dentro da plataforma.
                </p>
              </CardContent>
            </Card>

            {/* 6 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">6. Privacidade e Proteção de Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  A coleta e o tratamento de dados seguem nossa{' '}
                  <Link href="/privacidade" className="text-[#4AB0D9] hover:underline font-medium">
                    Política de Privacidade
                  </Link>{' '}
                  e a LGPD. Ao usar a plataforma, você consente com o tratamento de dados conforme a política.
                </p>
              </CardContent>
            </Card>

            {/* 7 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">7. Responsabilidades e Limitações</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">7.1 Responsabilidades da Busca Nutri</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Manter a plataforma operante;</li>
                  <li>Proteger dados conforme LGPD;</li>
                  <li>Verificar documentação de profissionais;</li>
                  <li>Prestar suporte técnico.</li>
                </ul>
                <h4 className="font-semibold text-[#1E1D40] mb-3">7.2 Limitações de Responsabilidade</h4>
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri é apenas intermediadora — não responde por qualidade dos serviços de terceiros,
                  resultados de consultas, disputas entre usuários ou conteúdos publicados.
                </p>
                <p className="text-[#1E1D40]/80 italic">
                  O nutricionista é o único responsável, perante pacientes, empregadores e CFN/CRN, por suas condutas,
                  atendimentos, conteúdos e pelo cumprimento das normas éticas e legais.
                </p>
              </CardContent>
            </Card>

            {/* 8 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">8. Pagamentos e Cancelamentos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">8.1 Política de Pagamentos</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Pagamentos via parceiros seguros;</li>
                  <li>Preços variam por serviço e podem ter taxas de transação;</li>
                  <li>Nutricionistas pagam assinatura mensal para recursos ampliados;</li>
                  <li>Retenção de <em>percentual previamente acordado</em> em teleconsultas e serviços corporativos;</li>
                  <li>Cupons concedidos pelo nutricionista são abatidos do pagamento do paciente.</li>
                </ul>
                <h4 className="font-semibold text-[#1E1D40] mb-3">8.2 Política de Cancelamento</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Consultas podem ser canceladas até 24h antes;</li>
                  <li>Reembolsos seguem políticas dos profissionais;</li>
                  <li>Cancelamentos de última hora podem gerar taxas;</li>
                  <li>Contas podem ser encerradas conforme regras aplicáveis.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 9 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">9. Suspensão e Encerramento de Conta</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Contas podem ser suspensas ou encerradas, sem aviso prévio, em casos de violação de políticas,
                  atividades ilegais, comportamento inadequado, informações falsas ou uso não autorizado.
                </p>
              </CardContent>
            </Card>

            {/* 10 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">10. Modificações dos Termos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri pode alterar estes Termos a qualquer momento. As mudanças vigoram após a publicação.
                  O uso contínuo representa aceitação dos novos termos.
                </p>
              </CardContent>
            </Card>

            {/* 11 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">11. Lei Aplicável e Foro</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Estes Termos regem-se pelas leis brasileiras. O foro eleito é o da comarca de Aracaju/SE,
                  com exclusão de qualquer outro, por mais privilegiado que seja.
                </p>
              </CardContent>
            </Card>

            {/* 12 */}
            <Card className="border-[#4AB0D9]/20 shadow-lg bg-[#4AB0D9]/5">
              <CardHeader><CardTitle className="text-[#1E1D40]">12. Contato e Suporte</CardTitle></CardHeader>
              <CardContent>
                <p className="text-[#1E1D40]/80 mb-4">
                  Para dúvidas, sugestões ou questões sobre estes Termos:
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
                      <a href="tel:+557999134938" className="text-[#4AB0D9] hover:underline">
                        (79) 9 9813-4938
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
                    Ao continuar usando a plataforma Busca Nutri, você confirma que leu, compreendeu e concorda
                    com todos os termos e condições deste documento. Se não concorda com algum termo, interrompa
                    o uso da plataforma imediatamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Link href="/"><Button variant="outline" className="border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9] hover:text-white bg-transparent"><ArrowLeft className="h-4 w-4 mr-2" />Voltar ao Início</Button></Link>
            <Link href="/privacidade"><Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Ver Política de Privacidade</Button></Link>
          </div>
        </div>
      </main>
    </div>
  )
}
