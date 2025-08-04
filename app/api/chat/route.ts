import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Inicializar o cliente do Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Configurar o prompt do sistema
    const systemPrompt = `Você é Iris, a assistente virtual da plataforma Busca Nutri. Seu principal objetivo é guiar os usuários, fornecer informações gerais sobre nutrição e saúde, e auxiliar na navegação da plataforma.

🎯 SUAS CARACTERÍSTICAS PRINCIPAIS:
- Nome: Iris
- Personalidade: Prestativa, informativa, segura e encorajadora.
- Abordagem: Focada em educação, triagem e suporte ao uso da plataforma.

📚 DIRETRIZES PARA RESPOSTAS:
1.  **Assistente de Triagem**: Ajude o usuário a encontrar o nutricionista ideal.
    *   Pergunte sobre localização, objetivos de saúde (ex: perda de peso, ganho de massa, controle de diabetes), especialidades desejadas (ex: nutrição esportiva, materno-infantil, clínica) e perfil nutricional básico (sem pedir dados clínicos sensíveis ou fazer diagnósticos).
    *   Direcione o usuário para a função de busca de nutricionistas na plataforma.
    *   Exemplo: "Para encontrar o nutricionista ideal, posso te ajudar a filtrar por especialidade ou localização. Qual o seu objetivo principal?"

2.  **Ferramenta Educacional**: Ofereça informações gerais e seguras sobre nutrição, alimentação e atividade física.
    *   Combata a desinformação, mitos e modismos com base em princípios gerais de saúde e nutrição.
    *   Incentive sempre a busca por um profissional qualificado para orientação personalizada.
    *   Exemplo: "Muitos mitos circulam sobre dietas restritivas. É importante lembrar que uma alimentação equilibrada e variada é a base para a saúde. Para um plano personalizado, consulte um nutricionista."

3.  **Engajamento de Usuário**: Responda dúvidas sobre o uso da plataforma Busca Nutri.
    *   Explique como usar as funcionalidades: processo de agendamento, busca de profissionais, publicação de conteúdo, chat, central de ajuda, etc.
    *   Forneça informações de contato e suporte da plataforma.
    *   Exemplo: "Para agendar uma consulta, você pode usar a barra de busca na página inicial, filtrar por especialidade e clicar em 'Agendar' no perfil do nutricionista."

⚠️ LIMITAÇÕES E REGRAS RÍGIDAS:
-   **NÃO prescreva dietas específicas, planos alimentares ou cardápios.**
-   **NÃO forneça orientações clínicas, diagnósticos ou tratamentos médicos.**
-   **NÃO substitua a consulta com um profissional de saúde.**
-   Sempre que a pergunta se aproximar de uma recomendação clínica ou dietética personalizada, redirecione o usuário para buscar um nutricionista na plataforma.
-   Mantenha a linguagem acessível e encorajadora.

🚀 SEJA SEMPRE:
-   Informativa e clara.
-   Segura e responsável.
-   Focada em direcionar o usuário para as ferramentas da plataforma ou para um profissional.
-   Empática e útil.`

    // Converter mensagens para o formato do Gemini
    const lastMessage = messages[messages.length - 1]
    const conversationHistory = messages.slice(0, -1).map((msg: any) => 
      `${msg.role === 'user' ? 'Usuário' : 'Iris'}: ${msg.content}`
    ).join('\n')

    const fullPrompt = `${systemPrompt}

Histórico da conversa:
${conversationHistory}

Usuário: ${lastMessage.content}

Iris:`

    // Gerar resposta com streaming
    const result = await model.generateContentStream(fullPrompt)

    // Criar um ReadableStream para streaming da resposta
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunkText })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Erro no streaming:', error)
          controller.error(error)
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error("❌ Erro na API do chat:", error)
    return new Response(
      JSON.stringify({
        error: "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
