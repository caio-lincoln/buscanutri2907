import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { HelpCircle, MessageCircle, Phone, Mail, Search, BookOpen, Users, Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Central de Ajuda | Busca Nutri",
  description:
    "Encontre respostas para suas dúvidas sobre a plataforma Busca Nutri. Suporte completo para pacientes, nutricionistas e empresas.",
}

export default function CentralAjudaPage() {
  const categorias = [
    {
      icon: Users,
      title: "Para Pacientes",
      description: "Como encontrar nutricionistas, agendar consultas e usar a plataforma",
      artigos: 12,
    },
    {
      icon: BookOpen,
      title: "Para Nutricionistas",
      description: "Gerenciar perfil, atender pacientes e usar ferramentas profissionais",
      artigos: 18,
    },
    {
      icon: Shield,
      title: "Para Empresas",
      description: "Publicar vagas, gerenciar candidatos e usar recursos corporativos",
      artigos: 8,
    },
  ]

  const perguntasFrequentes = [
    {
      pergunta: "Como criar uma conta na Busca Nutri?",
      resposta:
        "Clique em 'Cadastro' no menu superior e escolha seu tipo de usuário (Paciente, Nutricionista ou Empresa).",
    },
    {
      pergunta: "Como encontrar um nutricionista próximo a mim?",
      resposta:
        "Use nossa ferramenta de busca na página 'Nutricionistas' e filtre por localização, especialidade e disponibilidade.",
    },
    {
      pergunta: "A plataforma é gratuita?",
      resposta: "Sim, o cadastro e busca são gratuitos. Alguns recursos premium podem ter custos adicionais.",
    },
    {
      pergunta: "Como posso entrar em contato com o suporte?",
      resposta: "Você pode nos contatar pelo email buscanutri@gmail.com ou pelo telefone (79) 99813 4938.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Central de Ajuda</h1>
          <p className="text-xl text-gray-600 mb-8">Encontre respostas rápidas para suas dúvidas</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input type="text" placeholder="Pesquisar artigos de ajuda..." className="pl-12 py-4 text-lg" />
          </div>
        </div>

        {/* Categorias de Ajuda */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Categorias de Ajuda</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {categorias.map((categoria, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="text-center">
                  <categoria.icon className="h-12 w-12 text-[#4AB0D9] mx-auto mb-4" />
                  <CardTitle className="text-xl">{categoria.title}</CardTitle>
                  <CardDescription>{categoria.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-sm text-gray-500 mb-4">{categoria.artigos} artigos disponíveis</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Ver Artigos
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Perguntas Frequentes */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Perguntas Frequentes</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {perguntasFrequentes.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <HelpCircle className="h-5 w-5 text-[#4AB0D9]" />
                    {item.pergunta}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{item.resposta}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contato Direto */}
        <section className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Não encontrou o que procurava?</h2>
          <p className="text-gray-600 mb-8">Nossa equipe de suporte está pronta para ajudar você</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat ao Vivo
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Ligar Agora
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
