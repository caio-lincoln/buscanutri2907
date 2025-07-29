import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Users, Briefcase, UserCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Perguntas Frequentes | Busca Nutri",
  description:
    "Encontre respostas para as perguntas mais comuns sobre a plataforma Busca Nutri. FAQ completo para pacientes, nutricionistas e empresas.",
}

export default function FAQPage() {
  const faqSections = [
    {
      title: "Para Pacientes",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
      perguntas: [
        {
          pergunta: "Como encontrar um nutricionista na plataforma?",
          resposta:
            "Acesse a seção 'Nutricionistas' e use os filtros de localização, especialidade, preço e disponibilidade para encontrar o profissional ideal para você.",
        },
        {
          pergunta: "Como agendar uma consulta?",
          resposta:
            "Após encontrar o nutricionista desejado, clique em 'Agendar Consulta' no perfil do profissional e escolha o horário disponível que melhor se adequa à sua agenda.",
        },
        {
          pergunta: "A consulta online é segura?",
          resposta:
            "Sim, nossa plataforma utiliza criptografia de ponta a ponta para garantir a segurança e privacidade de todas as consultas online.",
        },
        {
          pergunta: "Como funciona o pagamento?",
          resposta:
            "Oferecemos diversas formas de pagamento: cartão de crédito, débito, PIX e boleto. O pagamento é processado de forma segura através de nossa plataforma.",
        },
      ],
    },
    {
      title: "Para Nutricionistas",
      icon: UserCheck,
      color: "bg-green-50 text-green-600",
      perguntas: [
        {
          pergunta: "Como criar meu perfil profissional?",
          resposta:
            "Cadastre-se como nutricionista, complete seu perfil com informações profissionais, especialidades, formação e defina sua agenda de atendimento.",
        },
        {
          pergunta: "Qual é a taxa da plataforma?",
          resposta:
            "Cobramos uma taxa de 10% sobre cada consulta realizada através da plataforma. Não há taxas de cadastro ou mensalidades.",
        },
        {
          pergunta: "Como recebo os pagamentos?",
          resposta:
            "Os pagamentos são transferidos automaticamente para sua conta bancária cadastrada em até 2 dias úteis após a consulta.",
        },
        {
          pergunta: "Posso atender presencialmente e online?",
          resposta:
            "Sim, você pode configurar seu perfil para oferecer ambas as modalidades de atendimento conforme sua preferência.",
        },
      ],
    },
    {
      title: "Para Empresas",
      icon: Briefcase,
      color: "bg-purple-50 text-purple-600",
      perguntas: [
        {
          pergunta: "Como publicar uma vaga de emprego?",
          resposta:
            "Cadastre sua empresa, acesse o painel administrativo e clique em 'Nova Vaga'. Preencha as informações da posição e publique.",
        },
        {
          pergunta: "Quanto custa publicar uma vaga?",
          resposta:
            "A publicação de vagas tem diferentes planos: Básico (gratuito por 30 dias), Premium (R$ 99/mês) e Enterprise (consulte-nos).",
        },
        {
          pergunta: "Como gerenciar candidatos?",
          resposta:
            "No painel da empresa, você pode visualizar todos os candidatos, filtrar por critérios, agendar entrevistas e acompanhar o processo seletivo.",
        },
        {
          pergunta: "Posso buscar profissionais ativamente?",
          resposta:
            "Sim, com o plano Premium você pode buscar e contatar nutricionistas diretamente através de nossa base de dados.",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Perguntas & Respostas</h1>
          <p className="text-xl text-gray-600 mb-8">Encontre respostas rápidas para as dúvidas mais comuns</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input type="text" placeholder="Pesquisar perguntas..." className="pl-12 py-4 text-lg" />
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-12">
          {faqSections.map((section, sectionIndex) => (
            <Card key={sectionIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className={`p-3 rounded-lg ${section.color}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  {section.title}
                </CardTitle>
                <CardDescription>Perguntas frequentes para {section.title.toLowerCase()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.perguntas.map((item, index) => (
                  <Collapsible key={index}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-4 h-auto text-left hover:bg-gray-50">
                        <span className="font-medium">{item.pergunta}</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-gray-600 leading-relaxed">{item.resposta}</p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Não encontrou sua resposta?</h2>
          <p className="text-gray-600 mb-6">Nossa equipe de suporte está pronta para ajudar você</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">Entrar em Contato</Button>
            <Button variant="outline">Central de Ajuda</Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
