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
              <p><strong>Última atualização:</strong> 30/08/2025</p>
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
                    <a href="mailto:buscanutri@gmail.com" className="text-[#4AB0D9] hover:underline">
                      buscanutri@gmail.com
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
                  Ao acessar e utilizar a plataforma Busca Nutri, você concorda integralmente com estes Termos de Uso. Caso 
                  não concorde com qualquer parte destes termos, não deverá utilizar nossos serviços.
                </p>
                <p className="text-[#1E1D40]/80">
                  Estes termos constituem um acordo legal entre você e a Busca Nutri (CNPJ: 57.370.073/0001-92), 
                  estabelecendo as condições de utilização de nossa plataforma digital.
                </p>
              </CardContent>
            </Card>

            {/* 2 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">2. Descrição dos Serviços</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri é uma plataforma digital de intermediação, que conecta três públicos distintos 
                  — Nutricionistas, Pacientes e Empresas — oferecendo:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Cadastro e verificação de profissionais de nutrição;</li>
                  <li>Sistema de busca e agendamento de consultas presenciais e teleconsultas;</li>
                  <li>Ferramentas de comunicação entre usuários, incluindo fórum e perguntas e respostas visíveis;</li>
                  <li>Publicação de conteúdo educativo e científico;</li>
                  <li>Marketplace de oportunidades profissionais e contratação de serviços corporativos.</li>
                </ul>
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri não presta serviços de nutrição nem se responsabiliza pelo atendimento realizado pelos 
                  profissionais cadastrados, atuando exclusivamente como facilitadora e intermediadora entre os usuários.
                </p>
              </CardContent>
            </Card>

            {/* 3 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">3. Cadastro e Conta de Usuário</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">3.1 Requisitos para Cadastro</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Ser maior de 18 anos ou possuir autorização dos responsáveis legais;</li>
                  <li>Fornecer informações verdadeiras, precisas e atualizadas;</li>
                  <li>Nutricionistas devem possuir registro ativo no Conselho Regional de Nutrição (CRN);</li>
                  <li>Empresas devem possuir CNPJ ativo e documentação válida.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">3.2 Responsabilidades e Especificidades por Público</h4>
                <p className="text-[#1E1D40]/80 font-medium">Nutricionistas</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Criar e manter perfil profissional atualizado;</li>
                  <li>Efetuar pagamento de assinatura mensal para acesso às funcionalidades ampliadas;</li>
                  <li>Aceitar que a Busca Nutri retenha percentual acordado sobre pagamentos recebidos por teleconsultas e serviços de nutrição corporativa contratados via plataforma;</li>
                  <li>Concordar que, ao fornecer cupons de desconto para pacientes, estes serão descontados do valor final pago pelo paciente;</li>
                  <li>Postagens no blog são de responsabilidade exclusiva do nutricionista, que não recebe remuneração da plataforma por este conteúdo; a Busca Nutri realizará curadoria, podendo suspender ou remover publicações que violem regras ou recebam denúncia;</li>
                  <li>Aceitar participar da comercialização de pacotes de nutrição corporativa, com percentual retido pela plataforma conforme acordo;</li>
                  <li>Conceder permissão para utilização da sua imagem, nome e conteúdo profissional em campanhas de marketing e divulgação da plataforma, incluindo redes sociais, sem ônus adicional, para promoção dos serviços da Busca Nutri.</li>
                </ul>
                <p className="text-[#1E1D40]/80 italic mb-4">
                  <strong>Obrigação legal dos nutricionistas:</strong> Todo nutricionista cadastrado deve exercer sua atividade 
                  profissional em conformidade integral com as normas do Conselho Federal de Nutrição (CFN) e do 
                  respectivo Conselho Regional de Nutrição (CRN) ao qual esteja inscrito. A responsabilidade pela qualidade 
                  técnica, ética e científica do atendimento e das informações prestadas é exclusivamente do nutricionista, 
                  sendo a Busca Nutri apenas canal de intermediação.
                </p>

                <p className="text-[#1E1D40]/80 font-medium mt-4">Pacientes</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Podem visualizar perfis de nutricionistas e conteúdos da plataforma sem necessidade de cadastro;</li>
                  <li>O cadastro é obrigatório para contato direto com nutricionistas, postagem de dúvidas, agendamento de consultas e acesso ao dashboard personalizado;</li>
                  <li>Devem manter informações pessoais atualizadas e verdadeiras.</li>
                </ul>

                <p className="text-[#1E1D40]/80 font-medium">Empresas</p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Devem possuir CNPJ válido e documentação atual;</li>
                  <li>Podem cadastrar vagas de emprego, contratar serviços e interagir com profissionais na plataforma.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3 mt-6">3.3 Responsabilidades Gerais do Usuário</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Manter a confidencialidade das credenciais de acesso;</li>
                  <li>Notificar imediatamente a plataforma sobre uso não autorizado de sua conta;</li>
                  <li>Utilizar a plataforma de forma ética, responsável e em conformidade com estes Termos.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 4 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">4. Uso Aceitável da Plataforma</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">4.1 Condutas Permitidas</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Uso da plataforma para fins profissionais legítimos;</li>
                  <li>Compartilhamento de conteúdo educativo e científico relevante;</li>
                  <li>Interações respeitosas entre usuários;</li>
                  <li>Reportar comportamentos inadequados.</li>
                </ul>

                <h4 className="font-semibold text-[#1E1D40] mb-3">4.2 Condutas Proibidas</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Publicação de informações falsas ou enganosas;</li>
                  <li>Prática de spam ou envio de mensagens não solicitadas;</li>
                  <li>Violação de direitos autorais ou propriedade intelectual;</li>
                  <li>Utilização da plataforma para atividades ilegais;</li>
                  <li>Tentativa de acesso não autorizado a contas ou informações;</li>
                  <li>Interferência no funcionamento da plataforma;</li>
                  <li><strong>Realizar acordos, parcerias, agendamentos ou teleconsultas diretamente entre usuários, sem passagem e cobrança via plataforma, caracterizando tentativa de burlar o sistema e prejudicando suas funcionalidades e segurança.</strong></li>
                </ul>
              </CardContent>
            </Card>

            {/* 5 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">5. Propriedade Intelectual</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Todo o conteúdo da Busca Nutri, incluindo textos, gráficos, logotipos, ícones, imagens e softwares, é 
                  propriedade da Busca Nutri ou de seus fornecedores.
                </p>
                <p className="text-[#1E1D40]/80">
                  Os usuários mantêm direitos sobre o conteúdo que criam e publicam, concedendo à plataforma licença não 
                  exclusiva para uso, modificação e distribuição dentro do ambiente da plataforma.
                </p>
              </CardContent>
            </Card>

            {/* 6 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">6. Privacidade e Proteção de Dados</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  A coleta, uso e proteção dos seus dados pessoais seguem nossa{' '}
                  <Link href="/privacidade" className="text-[#4AB0D9] hover:underline font-medium">
                    Política de Privacidade
                  </Link>{' '}
                  , em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                </p>
                <p className="text-[#1E1D40]/80">
                  Ao utilizar nossos serviços, você consente expressamente com o tratamento dessas informações conforme 
                  descrito na política.
                </p>
              </CardContent>
            </Card>

            {/* 7 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">7. Responsabilidades e Limitações</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">7.1 Responsabilidades da Busca Nutri</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Manter a plataforma operando adequadamente;</li>
                  <li>Proteger os dados dos usuários conforme LGPD;</li>
                  <li>Verificar documentação dos profissionais cadastrados;</li>
                  <li>Prestar suporte técnico.</li>
                </ul>
                <h4 className="font-semibold text-[#1E1D40] mb-3">7.2 Limitações de Responsabilidade</h4>
                <p className="text-[#1E1D40]/80 mb-3">
                  A Busca Nutri atua exclusivamente como plataforma de intermediação digital, não sendo responsável por:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Qualidade dos serviços prestados pelos profissionais;</li>
                  <li>Resultados de tratamentos ou consultas;</li>
                  <li>Disputas entre usuários;</li>
                  <li>Conteúdos publicados por usuários.</li>
                </ul>
                <p className="text-[#1E1D40]/80">
                  O nutricionista é o único responsável, perante seus pacientes, empregadores e órgãos de classe 
                  (CFN/CRN), pelas condutas adotadas, atendimentos prestados, conteúdos veiculados e pelo 
                  cumprimento das normas éticas e legais da profissão.
                </p>
              </CardContent>
            </Card>

            {/* 8 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">8. Pagamentos e Cancelamentos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h4 className="font-semibold text-[#1E1D40] mb-3">8.1 Política de Pagamentos</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80 mb-4">
                  <li>Pagamentos realizados via parceiros seguros;</li>
                  <li>Preços variam conforme o serviço;</li>
                  <li>Taxas de transação podem ser aplicadas;</li>
                  <li>Nutricionistas pagam assinatura mensal para acesso a funcionalidades;</li>
                  <li>Percentuais previamente acordados serão retidos pela plataforma sobre teleconsultas e serviços corporativos;</li>
                  <li>Cupons de desconto fornecidos pelos nutricionistas serão descontados do pagamento dos pacientes.</li>
                </ul>
                <h4 className="font-semibold text-[#1E1D40] mb-3">8.2 Política de Cancelamento</h4>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Consultas podem ser canceladas até 24 horas antes;</li>
                  <li>Reembolsos seguem políticas dos profissionais;</li>
                  <li>Cancelamentos tardios podem acarretar taxas;</li>
                  <li>Contas podem ser encerradas a qualquer momento conforme regras.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 9 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">9. Suspensão e Encerramento de Conta</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri reserva-se o direito de suspender ou encerrar contas que violem estes Termos, sem aviso 
                  prévio, especialmente em casos de:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li>Violação das políticas;</li>
                  <li>Atividades fraudulentas ou ilegais;</li>
                  <li>Comportamento inadequado;</li>
                  <li>Informações falsas;</li>
                  <li>Uso não autorizado.</li>
                </ul>
              </CardContent>
            </Card>

            {/* 10 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">10. Modificações dos Termos</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  A Busca Nutri pode alterar estes Termos a qualquer momento, que passam a vigorar imediatamente após 
                  publicação na plataforma.
                </p>
                <p className="text-[#1E1D40]/80">
                  É responsabilidade do usuário revisar periodicamente estes termos. O uso continuado após alterações 
                  constitui aceitação.
                </p>
              </CardContent>
            </Card>

            {/* 11 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">11. Lei Aplicável e Foro</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Estes Termos são regidos pelas leis brasileiras. Quaisquer disputas decorrentes do uso da plataforma serão 
                  resolvidas no foro da comarca de Aracaju, Sergipe, com exclusão de qualquer outro, por mais privilegiado 
                  que seja.
                </p>
              </CardContent>
            </Card>

            {/* 12 */}
            <Card className="border-[#F2E6D8] shadow-lg">
              <CardHeader><CardTitle className="text-[#1E1D40]">12. Contato e Suporte</CardTitle></CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-[#1E1D40]/80">
                  Para dúvidas, sugestões ou questões acerca destes Termos:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-[#1E1D40]/80">
                  <li><strong>E-mail:</strong> buscanutri@gmail.com</li>
                  <li><strong>Telefone:</strong> (79) 9 9813-4938</li>
                  <li><strong>Atendimento:</strong> Segunda a Sexta, das 9h às 18h</li>
                </ul>
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
