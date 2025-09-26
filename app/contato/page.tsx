import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Mail, Phone, MapPin, Clock, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contato | Busca Nutri',
  description:
    'Entre em contato com a equipe Busca Nutri. Estamos aqui para ajudar voce com duvidas, suporte tecnico e parcerias.',
}

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Entre em Contato
          </h1>
          <p className="text-xl text-gray-600">
            Estamos aqui para ajudar voce. Escolha a melhor forma de nos
            contatar.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Formulario de Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Envie sua Mensagem</CardTitle>
              <CardDescription>
                Preencha o formulario abaixo e retornaremos em ate 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="nome"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nome Completo
                  </label>
                  <Input id="nome" placeholder="Seu nome completo" />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <Input id="email" type="email" placeholder="seu@email.com" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Telefone
                  </label>
                  <Input id="telefone" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label
                    htmlFor="assunto"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Assunto
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o assunto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suporte">Suporte Tecnico</SelectItem>
                      <SelectItem value="duvidas">Duvidas Gerais</SelectItem>
                      <SelectItem value="parceria">Parcerias</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="mensagem"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mensagem
                </label>
                <Textarea
                  id="mensagem"
                  placeholder="Descreva sua duvida ou solicitacao..."
                  rows={6}
                />
              </div>

              <Button className="w-full bg-[#4AB0D9] hover:bg-[#4AB0D9]/90">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>

          {/* Informacoes de Contato */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Informacoes de Contato
                </CardTitle>
                <CardDescription>
                  Outras formas de entrar em contato conosco
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-[#4AB0D9]/10 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-[#4AB0D9]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">buscanutri@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#4AB0D9]/10 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-[#4AB0D9]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Telefone</h3>
                    <p className="text-gray-600">(79) 9 9813-4938</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#4AB0D9]/10 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-[#4AB0D9]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Localizacao</h3>
                    <p className="text-gray-600">Aracaju, SE - Brasil</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-[#4AB0D9]/10 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-[#4AB0D9]" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Horario de Atendimento</h3>
                    <p className="text-gray-600">Segunda a Sexta: 8h as 18h</p>
                    <p className="text-gray-600">Sabado: 8h as 12h</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Informacoes da Empresa
                    </h3>
                    <p className="text-gray-600">CNPJ: 57.370.073/0001-92</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suporte Rapido</CardTitle>
                <CardDescription>
                  Para questoes urgentes, use nossos canais de suporte rapido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat ao Vivo
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
