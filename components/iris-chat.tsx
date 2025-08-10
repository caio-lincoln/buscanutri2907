'use client'

import type React from 'react'

import { useState, useRef, useEffect } from 'react'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Função para renderizar texto com formatação básica de Markdown
const renderMarkdownText = (text: string) => {
  // Primeiro, processa negrito **texto**
  const boldRegex = /(\*\*[^*]+\*\*)/g
  const parts = text.split(boldRegex)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      // Dentro do texto em negrito, também processa itálico *texto*
      const italicParts = boldText.split(/(\*[^*]+\*)/g)
      const processedBoldText = italicParts.map((italicPart, italicIndex) => {
        if (
          italicPart.startsWith('*') &&
          italicPart.endsWith('*') &&
          !italicPart.startsWith('**')
        ) {
          const italicText = italicPart.slice(1, -1)
          return (
            <em key={italicIndex} className="italic">
              {italicText}
            </em>
          )
        }
        return italicPart
      })
      return (
        <strong key={index} className="font-bold">
          {processedBoldText}
        </strong>
      )
    } else {
      // Para texto normal, também processa itálico *texto*
      const italicParts = part.split(/(\*[^*]+\*)/g)
      return italicParts.map((italicPart, italicIndex) => {
        if (
          italicPart.startsWith('*') &&
          italicPart.endsWith('*') &&
          !italicPart.startsWith('**')
        ) {
          const italicText = italicPart.slice(1, -1)
          return (
            <em key={`${index}-${italicIndex}`} className="italic">
              {italicText}
            </em>
          )
        }
        return italicPart
      })
    }
  })
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'iris'
  timestamp: Date
  isTyping?: boolean
}

interface IrisChatProps {
  userType?: 'paciente' | 'nutricionista' | 'empresa' | 'admin'
}

const welcomeMessages = {
  paciente:
    'Olá! Sou a IrisBot, sua assistente inteligente da BuscaNutri. Estou aqui para te orientar na plataforma, fornecer informações educativas sobre nutrição e te ajudar a encontrar o nutricionista ideal para suas necessidades. Como posso te ajudar hoje?',
  nutricionista:
    'Olá! Sou a IrisBot, sua assistente inteligente na BuscaNutri. Posso te ajudar a navegar pela plataforma, otimizar seu perfil profissional, acompanhar métricas do seu dashboard e fornecer informações gerais sobre nutrição. Em que posso te auxiliar?',
  empresa:
    'Olá! Sou a IrisBot, assistente inteligente para empresas na BuscaNutri. Posso te orientar sobre como encontrar nutricionistas qualificados para sua equipe, usar as ferramentas de recrutamento e implementar programas de bem-estar corporativo. Como posso te ajudar?',
  admin:
    'Olá! Sou a IrisBot, assistente administrativa da BuscaNutri. Posso fornecer informações sobre métricas da plataforma, funcionamento do sistema, dados de engajamento e te ajudar com questões operacionais. O que você gostaria de saber?',
}

const suggestedQuestions = {
  paciente: [
    'Como encontro um nutricionista especializado na minha região?',
    'Como agendar uma consulta pela plataforma?',
    'Quais informações preciso para minha primeira consulta?',
    'Como funciona o acompanhamento nutricional online?',
  ],
  nutricionista: [
    'Como otimizar meu perfil profissional na BuscaNutri?',
    'Como visualizar o progresso dos meus pacientes?',
    'Como acessar cursos de atualização profissional?',
    'Como gerenciar minha agenda de consultas?',
  ],
  empresa: [
    'Como encontrar nutricionistas para minha equipe?',
    'Quais são os benefícios de um programa nutricional corporativo?',
    'Como implementar bem-estar nutricional na empresa?',
    'Como gerenciar candidatos nutricionistas?',
  ],
  admin: [
    'Métricas de usuários ativos na plataforma',
    'Como funciona a verificação de CRN/CNPJ?',
    'Relatório de agendamentos realizados',
    'Dados de engajamento dos profissionais',
  ],
}

export function IrisChat({ userType = 'paciente' }: IrisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      content: welcomeMessages[userType],
      sender: 'iris',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate typing indicator
    const typingMessage: Message = {
      id: 'typing',
      content: '',
      sender: 'iris',
      timestamp: new Date(),
      isTyping: true,
    }
    setMessages(prev => [...prev, typingMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get reader from response body')
      }

      let receivedText = ''
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: '
            if (data === '[DONE]') {
              break
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                receivedText += parsed.content
                // Update typing message with partial content
                setMessages(prev =>
                  prev.map(m =>
                    m.id === 'typing' ? { ...m, content: receivedText } : m
                  )
                )
              }
            } catch (e) {
              // Se não conseguir fazer parse do JSON, trata como texto simples
              receivedText += data
              setMessages(prev =>
                prev.map(m =>
                  m.id === 'typing' ? { ...m, content: receivedText } : m
                )
              )
            }
          }
        }
      }

      const irisResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: receivedText,
        sender: 'iris',
        timestamp: new Date(),
      }

      setMessages(prev =>
        prev.filter(m => m.id !== 'typing').concat(irisResponse)
      )
    } catch (error) {
      // Silent error handling - API message send error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.',
        sender: 'iris',
        timestamp: new Date(),
      }
      setMessages(prev =>
        prev.filter(m => m.id !== 'typing').concat(errorMessage)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-[600px] flex flex-col">
      {/* Header */}
      <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-t-xl">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">IrisBot</span>
            <Badge
              variant="outline"
              className="ml-2 bg-green-50 text-green-700 border-green-200"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Online
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.sender === 'iris' && (
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              {message.isTyping ? (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">IrisBot está digitando...</span>
                </div>
              ) : (
                <>
                  <p className="text-sm leading-relaxed">
                    {message.sender === 'iris'
                      ? renderMarkdownText(message.content)
                      : message.content}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {message.sender === 'iris' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {message.sender === 'user' && (
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Suggested Questions */}
      {messages.length === 1 &&
        (suggestedQuestions[userType] ?? []).length > 0 && (
          <div className="px-4 py-2 border-t bg-gray-50/50">
            <p className="text-xs text-gray-600 mb-2">Perguntas sugeridas:</p>
            <div className="flex flex-wrap gap-2">
              {(suggestedQuestions[userType] ?? []).map((question, index) => (
                <Button
                  key={`suggested-question-${userType}-${index}-${question.slice(0, 20)}`}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-white hover:bg-gray-100"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-xl">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta para a IrisBot..."
            className="flex-1 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
