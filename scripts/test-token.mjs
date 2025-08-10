import https from 'https'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const token = process.env.SUPABASE_ACCESS_TOKEN
const projectId = process.env.SUPABASE_PROJECT_ID

console.log('🔧 Testando Personal Access Token do Supabase...')
console.log('Token:', token ? `${token.substring(0, 10)}...` : 'Não encontrado')
console.log('Project ID:', projectId)

if (!token || !projectId) {
  console.error('❌ Token ou Project ID não encontrado no .env')
  process.exit(1)
}

// Testar o token fazendo uma requisição para a API do Supabase
const options = {
  hostname: 'api.supabase.com',
  port: 443,
  path: `/v1/projects/${projectId}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
}

const req = https.request(options, res => {
  console.log(`Status: ${res.statusCode}`)

  let data = ''
  res.on('data', chunk => {
    data += chunk
  })

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Token válido! Projeto encontrado:')
      const project = JSON.parse(data)
      console.log(`📋 Nome: ${project.name}`)
      console.log(`🌐 URL: ${project.url}`)
      console.log(`📍 Região: ${project.region}`)
    } else {
      console.error('❌ Erro na API:', res.statusCode)
      console.error('Resposta:', data)
    }
  })
})

req.on('error', error => {
  console.error('❌ Erro na requisição:', error.message)
})

req.end()
