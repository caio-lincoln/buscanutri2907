"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NewsletterSignup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    profile: "nutricionista",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      // Here you would integrate with your newsletter service
      console.log("Newsletter signup:", formData)

      setIsSubmitted(true)
      toast({
        title: "Inscrição realizada com sucesso!",
        description: "Você receberá nossas novidades em breve.",
      })
    } catch (error) {
      toast({
        title: "Erro ao se inscrever",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  if (isSubmitted) {
    return (
      <div className="bg-gradient-to-br from-[#1E1D40] via-[#2D2B5F] to-[#3A3875] py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="mb-6">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-[#1E1D40] mb-4">Bem-vindo à comunidade Busca Nutri!</h2>
                  <p className="text-gray-600 text-lg">
                    Sua inscrição foi realizada com sucesso. Em breve você receberá nossas novidades, dicas exclusivas e
                    conteúdos especializados em nutrição.
                  </p>
                </div>
                <Button onClick={() => setIsSubmitted(false)} variant="outline" className="mt-4">
                  Fazer nova inscrição
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[#1E1D40] via-[#2D2B5F] to-[#3A3875] py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Comece agora a transformar sua prática com a <span className="text-[#4AB0D9]">Busca Nutri</span>
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Cadastre-se gratuitamente e descubra como é fácil crescer em comunidade.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Nome completo */}
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-medium text-gray-700">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="h-14 text-base border-2 border-gray-200 focus:border-[#4AB0D9] focus:ring-0 rounded-xl"
                  />
                </div>

                {/* E-mail */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-medium text-gray-700">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="h-14 text-base border-2 border-gray-200 focus:border-[#4AB0D9] focus:ring-0 rounded-xl"
                  />
                </div>

                {/* Perfil */}
                <div className="space-y-4">
                  <Label className="text-base font-medium text-gray-700">Qual é o seu perfil?</Label>
                  <RadioGroup
                    value={formData.profile}
                    onValueChange={(value) => handleInputChange("profile", value)}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-[#4AB0D9] transition-colors cursor-pointer">
                      <RadioGroupItem value="nutricionista" id="nutricionista" className="text-[#4AB0D9]" />
                      <Label htmlFor="nutricionista" className="text-base font-medium cursor-pointer flex-1">
                        Nutricionista
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-[#4AB0D9] transition-colors cursor-pointer">
                      <RadioGroupItem value="paciente" id="paciente" className="text-[#4AB0D9]" />
                      <Label htmlFor="paciente" className="text-base font-medium cursor-pointer flex-1">
                        Paciente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-[#4AB0D9] transition-colors cursor-pointer">
                      <RadioGroupItem value="empresa" id="empresa" className="text-[#4AB0D9]" />
                      <Label htmlFor="empresa" className="text-base font-medium cursor-pointer flex-1">
                        Empresa
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name || !formData.email}
                  className="w-full h-16 text-lg font-semibold bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Quero fazer parte
                      <ArrowRight className="h-5 w-5" />
                    </div>
                  )}
                </Button>

                {/* Privacy Notice */}
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  Ao se inscrever, você concorda em receber comunicações da Busca Nutri sobre novidades, dicas de
                  nutrição e conteúdos exclusivos. Respeitamos sua privacidade e você pode cancelar sua inscrição a
                  qualquer momento.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Benefits */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="text-white">
              <div className="w-16 h-16 bg-[#4AB0D9] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Conteúdo Exclusivo</h3>
              <p className="text-gray-300">
                Receba artigos, dicas e novidades sobre nutrição diretamente em seu e-mail
              </p>
            </div>
            <div className="text-white">
              <div className="w-16 h-16 bg-[#4AB0D9] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalizado</h3>
              <p className="text-gray-300">Conteúdo direcionado para seu perfil: nutricionista, paciente ou empresa</p>
            </div>
            <div className="text-white">
              <div className="w-16 h-16 bg-[#4AB0D9] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Oportunidades</h3>
              <p className="text-gray-300">Seja o primeiro a saber sobre vagas, eventos e novidades da plataforma</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
