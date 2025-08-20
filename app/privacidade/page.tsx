import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield, Lock, Phone, Mail, MapPin, Clock } from 'lucide-react'

export default function PrivacidadePage() {
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
              <Shield className="h-5 w-5 text-[#4AB0D9]" />
              <span className="font-semibold text-[#1E1D40]">Política de Privacidade</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4AB0D9]/10 text-[#4AB0D9] rounded-full text-sm font-medium mb-6">
              <Lock className="h-4 w-4" />
              LGPD Compliance
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1E1D40] mb-4">Política de Privacidade</h1>
            <p className="text-xl text-[#1E1D40]/70 leading-relaxed">
              Como coletamos, usamos e protegemos seus dados pessoais na Busca Nutri
            </p>
            <div className="mt-6 text-sm text-[#1E1D40]/60">
              <p><strong>Última atualização:</strong> 21 de janeiro de 2025</p>
              <p><strong>Versão:</strong> 2.0</p>
            </div>
          </div>

          {/* Controladora / DPO */}
          <Card className="mb-8 border-[#4AB0D9]/20 shadow-lg">
            <CardHeader className="bg-[#4AB0D9]/5">
              <CardTitle className="flex items-center gap-2 text-[#1E1D40]">
                <Shield className="h-5 w-5 text-[#4AB0D9]" />
                Controladora de Dados
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
                    <strong className="text-[#1E1D40]">Encarregada (DPO):</strong>
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
                    <a href="mailto:privacidade@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                      privacidade@buscanutri.com.br
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <div className="space-y-8">
            {/* 1. Introdução */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">1. Introdução</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A Busca Nutri (CNPJ: 57.370.073/0001-92) está comprometida com a proteção da privacidade
                  e dos dados pessoais de seus usuários. Esta Política descreve como coletamos, usamos,
                  armazenamos e protegemos suas informações em conformidade com a LGPD (Lei nº 13.709/2018).
                </p>
              </CardContent>
            </Card>

            {/* 2. Dados + Finalidades */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">2. Dados Pessoais Coletados e Suas Finalidades</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">2.1 Dados de Identificação</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li><strong>Nome completo:</strong> identificação do usuário na plataforma.</li>
                  <li><strong>E-mail:</strong> autenticação, notificações e comunicações.</li>
                  <li><strong>Telefone:</strong> contato para agendamentos/suporte e entre usuários autorizados.</li>
                  <li><strong>CPF (pacientes e nutricionistas):</strong> verificação de identidade, emissão fiscal e prevenção a fraudes.</li>
                  <li><strong>CNPJ (empresas):</strong> validação cadastral.</li>
                  <li><strong>Data de nascimento:</strong> verificação de maioridade/adequação de serviços.</li>
                  <li><strong>Endereço:</strong> notas fiscais, vinculação de serviços e regionalidade (busca por profissionais próximos).</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.2 Dados Profissionais (Nutricionistas)</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li><strong>Número do CRN:</strong> comprovação de regularidade profissional.</li>
                  <li><strong>Especialidades e certificações:</strong> exibição pública no perfil.</li>
                  <li><strong>Experiência e formação:</strong> composição do portfólio profissional.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.3 Dados de Empresas (Parceiras)</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Razão social, CNPJ, endereço, representantes e contatos para contratações e parcerias.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.4 Dados de Uso da Plataforma</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Logs de acesso e navegação para segurança, prevenção a fraudes e análise de uso.</li>
                  <li>Endereço IP e informações de dispositivo para integridade e melhoria da experiência.</li>
                  <li>Cookies e tecnologias similares para sessão, preferências, estatísticas e segurança.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Bases Legais */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">3. Bases Legais para o Tratamento</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li><strong>Consentimento:</strong> comunicações promocionais e cookies não essenciais.</li>
                  <li><strong>Execução de contrato:</strong> viabilizar serviços (agendamentos, pagamentos, interações).</li>
                  <li><strong>Legítimo interesse:</strong> melhorias, suporte e segurança preventiva.</li>
                  <li><strong>Obrigação legal/regulatória:</strong> exigências fiscais, regulatórias e auditoria.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Compartilhamento */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">4. Compartilhamento de Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">Podemos compartilhar seus dados:</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Com usuários quando necessário à prestação do serviço (ex.: dados básicos para agendamento).</li>
                  <li>Com fornecedores terceirizados (pagamentos, hospedagem, auditoria, suporte).</li>
                  <li>Com autoridades competentes, quando exigido por lei/ordem judicial.</li>
                  <li>Em operações societárias (fusão, aquisição ou incorporação).</li>
                </ul>
                <p className="text-[#1E1D40]/80 leading-relaxed mt-4"><strong>Não comercializamos dados pessoais.</strong></p>
              </CardContent>
            </Card>

            {/* 5. Segurança */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">5. Segurança dos Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Criptografia e protocolos seguros.</li>
                  <li>Controles estritos de acesso.</li>
                  <li>Monitoramento e auditorias periódicas.</li>
                  <li>Backups e políticas de recuperação.</li>
                  <li>Treinamento contínuo da equipe.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 6. Retenção */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">6. Retenção dos Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li><strong>Conta ativa:</strong> enquanto houver vínculo.</li>
                  <li><strong>Conta inativa:</strong> até 2 anos após a última atividade.</li>
                  <li><strong>Financeiros/fiscais:</strong> 5 anos.</li>
                  <li><strong>Logs de segurança:</strong> 6 meses.</li>
                  <li><strong>Exigências legais específicas:</strong> enquanto durar a obrigação.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 7. Direitos LGPD */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">7. Direitos dos Titulares</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li><strong>Acesso</strong> e confirmação de tratamento.</li>
                  <li><strong>Correção</strong> de dados incompletos/inexatos.</li>
                  <li><strong>Exclusão</strong> de dados desnecessários/irregulares.</li>
                  <li><strong>Portabilidade</strong> (quando aplicável).</li>
                  <li><strong>Oposição</strong> a tratamentos, quando cabível.</li>
                  <li><strong>Revogação do consentimento</strong> a qualquer momento.</li>
                  <li><strong>Informação</strong> sobre compartilhamentos.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 8. Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">8. Cookies e Tecnologias Similares</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">Usamos cookies para:</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Manter sessão ativa.</li>
                  <li>Lembrar preferências.</li>
                  <li>Analisar desempenho da plataforma.</li>
                  <li>Personalizar recomendações.</li>
                  <li>Garantir segurança do serviço.</li>
                </ul>
                <p className="text-[#1E1D40]/80 leading-relaxed mt-4">
                  Saiba mais na nossa{' '}
                  <Link href="/cookies" className="text-[#4AB0D9] hover:underline font-medium">
                    Política de Cookies
                  </Link>.
                </p>
              </CardContent>
            </Card>

            {/* 9. Transferência internacional */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">9. Transferência Internacional de Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">Quando houver transferência internacional, garantimos que:</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mt-4">
                  <li>O país de destino ofereça nível adequado de proteção.</li>
                  <li>Haja salvaguardas contratuais apropriadas.</li>
                  <li>Você seja informado previamente.</li>
                  <li>Quando exigido, coletaremos consentimento específico.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 10. Alterações */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">10. Alterações nesta Política</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Publicaremos a nova versão na plataforma.</li>
                  <li>Notificaremos por e-mail mudanças relevantes.</li>
                  <li>Indicaremos a data da última atualização.</li>
                  <li>Você poderá revisar e aceitar as mudanças.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 11. Contato / DPO */}
            <Card className="border-[#4AB0D9]/20 shadow-lg bg-[#4AB0D9]/5">
              <CardHeader><CardTitle className="text-[#1E1D40]">11. Contato e Encarregado de Dados (DPO)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Para exercer seus direitos, esclarecer dúvidas ou registrar reclamações, fale com a gente:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-[#1E1D40]">Encarregada (DPO):</strong>
                      <p className="text-[#1E1D40]/70">Iris Patricia Carregosa da Silva</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="mailto:dpo@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                        dpo@buscanutri.com.br
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="mailto:privacidade@buscanutri.com.br" className="text-[#4AB0D9] hover:underline">
                        privacidade@buscanutri.com.br
                      </a>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#4AB0D9]" />
                      <a href="tel:+557999134938" className="text-[#4AB0D9] hover:underline">
                        (79) 9 9813-4938
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#4AB0D9]" />
                      <span className="text-[#1E1D40]/70">Segunda a Sexta, 9h às 18h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#4AB0D9]" />
                      <span className="text-[#1E1D40]/70">Aracaju, SE - Brasil</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <strong>Tempo de resposta:</strong> responderemos em até 15 dias úteis, conforme a LGPD.
                  </p>
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
            <Link href="/cookies">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">
                Ver Política de Cookies
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
