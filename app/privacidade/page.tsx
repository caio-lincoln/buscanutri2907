import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Lock, Phone, Mail, MapPin, Clock } from "lucide-react"

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
          {/* Hero Section */}
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
              <p>
                <strong>Última atualização:</strong> 21 de janeiro de 2025
              </p>
              <p>
                <strong>Versão:</strong> 2.0
              </p>
            </div>
          </div>

          {/* Informações da Controladora */}
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
                    <strong className="text-[#1E1D40]">DPO (Encarregado):</strong>
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

          {/* Conteúdo da Política */}
          <div className="space-y-8">
            {/* 1. Introdução */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">1. Introdução</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  A Busca Nutri (CNPJ: 57.370.073/0001-92) está comprometida com a proteção da privacidade e dos dados
                  pessoais de seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
                  protegemos suas informações pessoais.
                </p>
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e
                  outras regulamentações aplicáveis de proteção de dados.
                </p>
              </CardContent>
            </Card>

            {/* 2. Dados Coletados */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">2. Dados Pessoais Coletados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">2.1 Dados de Identificação</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Nome completo</li>
                  <li>E-mail</li>
                  <li>Telefone</li>
                  <li>CPF/CNPJ</li>
                  <li>Data de nascimento</li>
                  <li>Endereço</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.2 Dados Profissionais (Nutricionistas)</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Número do CRN (Conselho Regional de Nutricionistas)</li>
                  <li>Especialidades e certificações</li>
                  <li>Experiência profissional</li>
                  <li>Formação acadêmica</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">2.3 Dados de Uso</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Logs de acesso e navegação</li>
                  <li>Endereço IP</li>
                  <li>Informações do dispositivo</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Finalidades do Tratamento */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">3. Finalidades do Tratamento</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Utilizamos seus dados pessoais para as seguintes finalidades:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Criar e gerenciar sua conta na plataforma</li>
                  <li>Verificar a identidade e qualificações profissionais</li>
                  <li>Facilitar a conexão entre nutricionistas e pacientes</li>
                  <li>Processar agendamentos e pagamentos</li>
                  <li>Enviar comunicações importantes sobre o serviço</li>
                  <li>Melhorar nossos serviços e experiência do usuário</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Base Legal */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">4. Base Legal para o Tratamento</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  O tratamento de seus dados pessoais é baseado nas seguintes hipóteses legais:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>
                    <strong>Consentimento:</strong> Para comunicações de marketing e cookies não essenciais
                  </li>
                  <li>
                    <strong>Execução de contrato:</strong> Para prestação dos serviços da plataforma
                  </li>
                  <li>
                    <strong>Legítimo interesse:</strong> Para melhorias do serviço e prevenção de fraudes
                  </li>
                  <li>
                    <strong>Cumprimento de obrigação legal:</strong> Para atender exigências regulamentares
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Compartilhamento de Dados */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">5. Compartilhamento de Dados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Seus dados pessoais podem ser compartilhados nas seguintes situações:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Com outros usuários da plataforma (conforme necessário para o serviço)</li>
                  <li>Com prestadores de serviços terceirizados (processamento de pagamentos, hospedagem)</li>
                  <li>Com autoridades competentes (quando exigido por lei)</li>
                  <li>Em caso de fusão, aquisição ou venda de ativos da empresa</li>
                </ul>
                <p className="text-[#1E1D40]/80 leading-relaxed mt-4">
                  <strong>Importante:</strong> Nunca vendemos seus dados pessoais para terceiros.
                </p>
              </CardContent>
            </Card>

            {/* 6. Segurança dos Dados */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">6. Segurança dos Dados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Implementamos medidas técnicas e organizacionais para proteger seus dados:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controles de acesso rigorosos</li>
                  <li>Monitoramento contínuo de segurança</li>
                  <li>Backups regulares e seguros</li>
                  <li>Treinamento regular da equipe sobre proteção de dados</li>
                  <li>Auditorias de segurança periódicas</li>
                </ul>
              </CardContent>
            </Card>

            {/* 7. Retenção de Dados */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">7. Retenção de Dados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Mantemos seus dados pessoais pelos seguintes períodos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>
                    <strong>Dados de conta ativa:</strong> Enquanto a conta estiver ativa
                  </li>
                  <li>
                    <strong>Dados de conta inativa:</strong> Até 2 anos após a última atividade
                  </li>
                  <li>
                    <strong>Dados financeiros:</strong> 5 anos (conforme legislação fiscal)
                  </li>
                  <li>
                    <strong>Logs de segurança:</strong> 6 meses
                  </li>
                  <li>
                    <strong>Dados para cumprimento legal:</strong> Conforme exigido por lei
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 8. Seus Direitos */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">8. Seus Direitos como Titular dos Dados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Conforme a LGPD, você possui os seguintes direitos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>
                    <strong>Acesso:</strong> Saber quais dados temos sobre você
                  </li>
                  <li>
                    <strong>Correção:</strong> Corrigir dados incompletos ou incorretos
                  </li>
                  <li>
                    <strong>Exclusão:</strong> Solicitar a remoção de seus dados
                  </li>
                  <li>
                    <strong>Portabilidade:</strong> Receber seus dados em formato estruturado
                  </li>
                  <li>
                    <strong>Oposição:</strong> Opor-se ao tratamento de seus dados
                  </li>
                  <li>
                    <strong>Revogação do consentimento:</strong> Retirar o consentimento a qualquer momento
                  </li>
                  <li>
                    <strong>Informação:</strong> Saber com quem compartilhamos seus dados
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 9. Cookies */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">9. Cookies e Tecnologias Similares</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Utilizamos cookies e tecnologias similares para:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Manter você logado na plataforma</li>
                  <li>Lembrar suas preferências</li>
                  <li>Analisar o uso da plataforma</li>
                  <li>Personalizar sua experiência</li>
                  <li>Garantir a segurança do serviço</li>
                </ul>
                <p className="text-[#1E1D40]/80 leading-relaxed mt-4">
                  Para mais informações, consulte nossa
                  <Link href="/cookies" className="text-[#4AB0D9] hover:underline font-medium">
                    Política de Cookies
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>

            {/* 10. Transferência Internacional */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">10. Transferência Internacional de Dados</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Alguns de nossos prestadores de serviços podem estar localizados fora do Brasil. Quando isso ocorre,
                  garantimos que:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mt-4">
                  <li>O país de destino oferece grau de proteção adequado</li>
                  <li>São implementadas salvaguardas contratuais apropriadas</li>
                  <li>Você é informado sobre essas transferências</li>
                  <li>Seus direitos continuam protegidos</li>
                </ul>
              </CardContent>
            </Card>

            {/* 11. Alterações na Política */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">11. Alterações nesta Política</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80 leading-relaxed">
                  Esta Política de Privacidade pode ser atualizada periodicamente. Quando isso acontecer:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mt-4">
                  <li>Publicaremos a nova versão em nossa plataforma</li>
                  <li>Notificaremos você por e-mail sobre mudanças significativas</li>
                  <li>A data da última atualização será sempre indicada</li>
                  <li>Você terá a oportunidade de revisar as alterações</li>
                </ul>
              </CardContent>
            </Card>

            {/* 12. Contato e DPO */}
            <Card className="border-[#4AB0D9]/20 shadow-lg bg-[#4AB0D9]/5">
              <CardHeader>
                <CardTitle className="text-[#1E1D40]">12. Contato e Encarregado de Dados (DPO)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#1E1D40]/80 leading-relaxed mb-4">
                  Para exercer seus direitos, esclarecer dúvidas ou fazer reclamações sobre o tratamento de seus dados
                  pessoais, entre em contato conosco:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-[#1E1D40]">Encarregado de Dados (DPO):</strong>
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
                    <strong>Tempo de resposta:</strong> Responderemos às suas solicitações em até 15 dias úteis,
                    conforme estabelecido pela LGPD.
                  </p>
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
            <Link href="/cookies">
              <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white">Ver Política de Cookies</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

