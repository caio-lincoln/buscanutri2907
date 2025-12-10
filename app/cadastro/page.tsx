'use client'

import type React from 'react'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { signUp } from '@/lib/auth'
import { toast } from '@/components/ui/use-toast'
import ConsultationPricingConfig from './components/ConsultationPricingConfig'
import AddressManagement from './components/AddressManagement'
import { NutritionistDocumentsUpload } from '@/components/ui/nutritionist-documents-upload'
import { SpecialtySelector } from '@/components/ui/specialty-selector'

import {
  validateCRNFormat,
  validateCRNWithAPI,
  formatCRN,
} from '@/lib/crn-validator'
import {
  validateCNPJFormat,
  validateCNPJWithAPI,
  formatCNPJ,
} from '@/lib/cnpj-validator'
import {
  saveNutritionistAddresses,
  type AddressData,
} from '@/lib/address-utils'
import { useAuth } from '../../contexts/auth-context'

type PasswordStrength = 'weak' | 'medium' | 'strong'

interface PasswordValidation {
  strength: PasswordStrength
  score: number
  message: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

interface Certificate {
  id?: string
  title: string
  file: File | null
  fileName?: string
  fileUrl?: string
  fileSize?: number
  isUploaded?: boolean
}

function SubmittingOverlay({ message = 'Enviando seu cadastro...' }: { message?: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm text-center border border-gray-100">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-[#4AB0D9]" aria-hidden />
        <p className="font-medium text-[#1E1D40]">{message}</p>
        <p className="text-sm text-[#1E1D40]/70 mt-1">Isso pode levar alguns segundos…</p>
      </div>
    </div>
  )
}

export default function CadastroPage() {
  const [ showPassword, setShowPassword ] = useState(false)
  const [ userType, setUserType ] = useState('paciente')
  const [ acceptTerms, setAcceptTerms ] = useState(false)
  const [ loading, setLoading ] = useState(false)
  const [ acceptsCorporatePlans, setAcceptsCorporatePlans ] = useState<
    boolean | null
  >(null)
  const [ aceitaCupons, setAceitaCupons ] = useState(false)
  const [ error, setError ] = useState('')
  const [ addresses, setAddresses ] = useState<AddressData[]>([])
  const { user, loading: authLoading, refreshUser } = useAuth()
  const [ pricingConfig, setPricingConfig ] = useState({
    inPerson: {
      enabled: false,
      pricingType: 'combined' as 'combined' | 'separate',
      combinedPrice: '',
      consultationPrice: '',
      followupPrice: '',
    },
    online: {
      enabled: false,
      pricingType: 'combined' as 'combined' | 'separate',
      combinedPrice: '',
      consultationPrice: '',
      followupPrice: '',
    },
  })

  const [ password, setPassword ] = useState('')
  const [ passwordValidation, setPasswordValidation ] =
    useState<PasswordValidation>({
      strength: 'weak',
      score: 0,
      message: '',
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    })
  const [ crnValue, setCrnValue ] = useState('')
  const [ crnValidation, setCrnValidation ] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid'
    message: string
  }>({
    status: 'idle',
    message: '',
  })

  const [ crnProofFile, setCrnProofFile ] = useState<File | null>(null)
  const [ certificates, setCertificates ] = useState<Certificate[]>([])
  const [ documentsUploading, setDocumentsUploading ] = useState(false)

  const [ selectedSpecialties, setSelectedSpecialties ] = useState<string[]>([])

  const validatePasswordStrength = (password: string): PasswordValidation => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()\-_=+\[\]{};:'"\\|,.<>\/?]/.test(password),
    }

    const score = Object.values(requirements).filter(Boolean).length

    let strength: PasswordStrength = 'weak'
    let message = ''

    if (score < 3) {
      strength = 'weak'
      message = 'Senha fraca - Adicione mais caracteres'
    } else if (score < 5) {
      strength = 'medium'
      message = 'Senha média - Quase lá!'
    } else {
      strength = 'strong'
      message = 'Senha forte - Excelente!'
    }

    return {
      strength,
      score,
      message,
      requirements,
    }
  }
  
  const submitting = loading || documentsUploading
  // Função para lidar com mudanças na senha
  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordValidation(validatePasswordStrength(value))
  }

  // Estados para validação de CNPJ
  const [ cnpjValue, setCnpjValue ] = useState('')
  const [ cnpjValidation, setCnpjValidation ] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid'
    message: string
    companyData?: any
  }>({ status: 'idle', message: '' })

  const formRef = useRef<HTMLFormElement>(null)
  const [ canSubmit, setCanSubmit ] = useState(false)

  const updateCanSubmit = () => {
    const base = formRef.current ? formRef.current.checkValidity() : false
    const extra = acceptTerms && !!password && passwordValidation.strength !== 'weak' && !loading && !documentsUploading
    const byType = userType === 'nutricionista'
      ? (crnValidation.status === 'valid' && !!crnProofFile)
      : userType === 'empresa'
        ? (cnpjValidation.status === 'valid')
        : true
    setCanSubmit(Boolean(base && extra && byType))
  }

  useEffect(() => {
    updateCanSubmit()
  }, [ acceptTerms, password, passwordValidation.strength, loading, documentsUploading, userType, crnValidation.status, crnProofFile, cnpjValidation.status ])

  const getPendingReasons = (): string[] => {
    const reasons: string[] = []
    const baseInvalid = formRef.current ? !formRef.current.checkValidity() : false
    if (baseInvalid) reasons.push('Preencha todos os campos obrigatórios')
    if (!acceptTerms) reasons.push('Aceite os Termos de Uso e Política de Privacidade')
    if (!password) reasons.push('Informe a senha')
    if (passwordValidation.strength === 'weak') reasons.push('Use uma senha mais forte')
    if (userType === 'nutricionista') {
      if (crnValidation.status !== 'valid') reasons.push('Valide o CRN')
      if (!crnProofFile) reasons.push('Envie o comprovante de CRN')
    }
    if (userType === 'empresa') {
      if (cnpjValidation.status !== 'valid') reasons.push('Valide o CNPJ')
    }
    return reasons
  }

  const router = useRouter()

  // Função para upload de documentos
  const uploadNutritionistDocuments = async (
    userId: string,
    accessToken: string
  ) => {
    if (!crnProofFile) {
      throw new Error('Comprovante de CRN é obrigatório')
    }

    setDocumentsUploading(true)

    try {
      // Upload do comprovante de CRN
      // Uploading CRN proof document
      const crnFormData = new FormData()
      crnFormData.append('file', crnProofFile)
      crnFormData.append('documentType', 'crn_proof')
      crnFormData.append('userId', userId)
      crnFormData.append('accessToken', accessToken)

      const crnResponse = await fetch('/api/upload-nutritionist-document', {
        method: 'POST',
        body: crnFormData,
      })

      if (!crnResponse.ok) {
        const errorData = await crnResponse.json()
        throw new Error(
          errorData.error || 'Erro ao fazer upload do comprovante de CRN'
        )
      }

      // Upload dos certificados (se houver)
      for (const certificate of certificates) {
        if (certificate.title.trim() && certificate.file) {
          // Uploading certificate document

          const certFormData = new FormData()
          certFormData.append('file', certificate.file)
          certFormData.append('documentType', 'certificate')
          certFormData.append('title', certificate.title.trim())
          certFormData.append('userId', userId)
          certFormData.append('accessToken', accessToken)

          const certResponse = await fetch(
            '/api/upload-nutritionist-document',
            {
              method: 'POST',
              body: certFormData,
            }
          )

          if (!certResponse.ok) {
            // Error uploading certificate - not failing registration
            // Não falha o cadastro por causa dos certificados, apenas loga o erro
            toast({
              title: '⚠️ Aviso',
              description: `Erro ao fazer upload do certificado "${certificate.title}". Você pode adicioná-lo depois no seu perfil.`,
              variant: 'default',
            })
            return
          } else {
            // Certificate uploaded successfully
          }
        }
      }

      // All documents processed successfully
    } catch (error) {
      // Error during document upload
      throw error
    } finally {
      setDocumentsUploading(false)
    }
  }

  // Função para validar CRN em tempo real
  const handleCRNChange = async (value: string) => {
    const formatted = formatCRN(value)
    // const formatted = value
    setCrnValue(formatted)

    if (!formatted || formatted.length < 6) {
      setCrnValidation({ status: 'idle', message: '' })
      return
    }

    // Validação de formato primeiro
    const formatValidation = validateCRNFormat(formatted)

    if (!formatValidation.isValid) {
      setCrnValidation({
        status: 'invalid',
        message: formatValidation.message,
      })
      return
    }

    // Se formato está correto, valida via API
    setCrnValidation({ status: 'validating', message: 'Validando CRN...' })

    try {
      const apiValidation = await validateCRNWithAPI(formatted)
      setCrnValidation({
        status: 'valid',
        message: apiValidation.message,
      })
    } catch (error) {
      setCrnValidation({
        status: 'valid',
        message: 'Erro ao validar CRN. Tente novamente.',
      })
    }
  }

  // Função para validar CNPJ em tempo real
  const handleCNPJChange = async (value: string) => {
    const formatted = formatCNPJ(value)
    setCnpjValue(formatted)

    if (!formatted || formatted.replace(/D/g, '').length < 14) {
      setCnpjValidation({ status: 'idle', message: '' })
      return
    }

    // Validação de formato primeiro
    const formatValidation = validateCNPJFormat(formatted)

    if (!formatValidation.isValid) {
      setCnpjValidation({
        status: 'invalid',
        message: formatValidation.message,
      })
      return
    }

    // Se formato está correto, valida via API
    setCnpjValidation({
      status: 'validating',
      message: 'Consultando Receita Federal...',
    })

    try {
      const apiValidation = await validateCNPJWithAPI(formatted)
      setCnpjValidation({
        status: apiValidation.isValid ? 'valid' : 'invalid',
        message: apiValidation.message,
        companyData: apiValidation.companyData,
      })
    } catch (error) {
      setCnpjValidation({
        status: 'invalid',
        message: 'Erro ao validar CNPJ. Tente novamente.',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!acceptTerms) {
      setError('Você deve aceitar os termos de uso para continuar')
      return
    }

    // Validação específica para nutricionista
    if (userType === 'nutricionista') {
      if (crnValidation.status !== 'valid') {
        setError('CRN deve ser validado antes de continuar')
        return
      }

      if (!crnProofFile) {
        setError('Comprovante de CRN é obrigatório')
        return
      }

      // Validar certificados (se tiver título, deve ter arquivo e vice-versa)
      for (const cert of certificates) {
        if (cert.title.trim() && !cert.file) {
          setError(`Certificado "${cert.title}" precisa de um arquivo`)
          return
        }
        if (!cert.title.trim() && cert.file) {
          setError('Certificado com arquivo precisa de um título')
          return
        }
      }
    }

    // Validação específica para empresa
    if (userType === 'empresa') {
      if (cnpjValidation.status !== 'valid') {
        setError('CNPJ deve ser validado antes de continuar')
        return
      }
    }

    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = (formData.get('email') as string).trim().toLowerCase()
      const password = formData.get('password') as string

      // Validações básicas
      if (!email || !password) {
        throw new Error('Email e senha são obrigatórios')
      }

      const passwordValidation = validatePasswordStrength(password)

      if (
        passwordValidation.strength === 'weak' ||
        !passwordValidation.requirements.length
      ) {
        throw new Error(
          'A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
        )
      }

      let additionalData: any = {}

      if (userType === 'nutricionista') {
        const full_name = formData.get('full_name') as string
        const phone = formData.get('phone') as string

        if (!full_name || !crnValue) {
          throw new Error('Nome completo e CRN são obrigatórios')
        }

        if (acceptsCorporatePlans === null) {
          throw new Error(
            'Por favor, responda se aceita atender em planos corporativos'
          )
        }

        // Converter preços para números
        const parsePrice = (price: string): number | null => {
          if (!price) return null

          const raw = price.replace(/[^\d,.\-]/g, '')
          if (!raw) return null

          let normalized: string
          if (raw.includes(',') && !raw.includes('.')) {
            normalized = raw.replace(/\./g, '').replace(',', '.')
          } else if (raw.includes('.') && !raw.includes(',')) {
            normalized = raw.replace(/,/g, '')
          } else if (raw.includes(',') && raw.includes('.')) {
            const lastComma = raw.lastIndexOf(',')
            const lastDot = raw.lastIndexOf('.')
            normalized =
              lastComma > lastDot
                ? raw.replace(/\./g, '').replace(',', '.')
                : raw.replace(/,/g, '')
          } else {
            normalized = raw
          }

          const n = Number(normalized)
          return Number.isFinite(n) ? n : null
        }

        // Validações de preço e endereço
        // - Pelo menos uma modalidade habilitada
        // - Preço de consulta é opcional no cadastro
        // - Pelo menos um endereço de atendimento (mesmo para atendimento apenas virtual)

        const hasInPerson = !!pricingConfig.inPerson.enabled
        const hasOnline = !!pricingConfig.online.enabled

        if (!hasInPerson && !hasOnline) {
          throw new Error(
            'Configure pelo menos uma modalidade de atendimento (Presencial ou Teleconsulta).'
          )
        }

        // Preços não são obrigatórios no cadastro; remover validações de mínimos
        // (validações poderão ocorrer posteriormente no perfil se necessário)

        // Exigir pelo menos um endereço de atendimento
        if (!addresses || addresses.length < 1) {
          throw new Error(
            'Informe pelo menos um endereço de atendimento. Se atender apenas virtualmente, informe seu endereço de residência.'
          )
        }

        // Validação de campos obrigatórios do endereço
        const hasInvalidAddress = addresses.some(
          a => !a.state?.trim() || !a.city?.trim()
        )
        if (hasInvalidAddress) {
          throw new Error(
            'Endereços devem conter Estado e Cidade. Verifique seus endereços antes de continuar.'
          )
        }

        // Garantir pelo menos um endereço principal
        const hasMainAddress = addresses.some(a => a.is_main === true)
        if (!hasMainAddress) {
          throw new Error(
            'Defina um endereço principal antes de concluir o cadastro.'
          )
        }

        // Se presencial estiver habilitado, exigir endereço presencial
        if (hasInPerson) {
          const hasInPersonAddress = addresses.some(
            a => (a.type || 'in_person') === 'in_person'
          )
          if (!hasInPersonAddress) {
            throw new Error(
              'Para consultas presenciais, adicione pelo menos um endereço presencial.'
            )
          }
        }

        additionalData = {
          full_name,
          crn: crnValue,
          phone,
          accepts_corporate_plans: acceptsCorporatePlans,
          in_person_pricing_type: pricingConfig.inPerson.enabled
            ? pricingConfig.inPerson.pricingType
            : null,
          online_pricing_type: pricingConfig.online.enabled
            ? pricingConfig.online.pricingType
            : null,
          in_person_combined_price:
            pricingConfig.inPerson.enabled &&
              pricingConfig.inPerson.pricingType === 'combined'
              ? parsePrice(pricingConfig.inPerson.combinedPrice)
              : null,
          online_combined_price:
            pricingConfig.online.enabled &&
              pricingConfig.online.pricingType === 'combined'
              ? parsePrice(pricingConfig.online.combinedPrice)
              : null,
          in_person_consultation_price:
            pricingConfig.inPerson.enabled &&
              pricingConfig.inPerson.pricingType === 'separate'
              ? parsePrice(pricingConfig.inPerson.consultationPrice)
              : null,
          in_person_followup_price:
            pricingConfig.inPerson.enabled &&
              pricingConfig.inPerson.pricingType === 'separate'
              ? parsePrice(pricingConfig.inPerson.followupPrice)
              : null,
          online_consultation_price:
            pricingConfig.online.enabled &&
              pricingConfig.online.pricingType === 'separate'
              ? parsePrice(pricingConfig.online.consultationPrice)
              : null,
          online_followup_price:
            pricingConfig.online.enabled &&
              pricingConfig.online.pricingType === 'separate'
              ? parsePrice(pricingConfig.online.followupPrice)
              : null,
          aceita_cupons: aceitaCupons,
        }
      } else if (userType === 'paciente') {
        const full_name = formData.get('full_name') as string
        const birth_date = formData.get('birth_date') as string
        const phone = formData.get('phone') as string

        if (!full_name) {
          throw new Error('Nome completo é obrigatório')
        }

        additionalData = { full_name, birth_date, phone }
      } else if (userType === 'empresa') {
        const company_name = formData.get('company_name') as string
        const responsible_name = formData.get('responsible_name') as string
        const responsible_position = formData.get(
          'responsible_position'
        ) as string
        const phone = formData.get('phone') as string

        if (!company_name || !cnpjValue || !responsible_name) {
          throw new Error(
            'Nome da empresa, CNPJ e nome do responsável são obrigatórios'
          )
        }

        additionalData = {
          company_name,
          cnpj: cnpjValue, // Usa o valor formatado e validado
          responsible_name,
          responsible_position,
          phone,
          // Adiciona dados da empresa se disponível
          ...(cnpjValidation.companyData && {
            company_legal_name: cnpjValidation.companyData.name,
            company_fantasy_name: cnpjValidation.companyData.fantasyName,
            company_activity: cnpjValidation.companyData.activity,
          }),
        }
      }

      // Processing registration data

      // Pré-validação: documentos obrigatórios para nutricionista antes do cadastro
      if (userType === 'nutricionista') {
        if (!crnProofFile) {
          throw new Error(
            'Comprovante de CRN é obrigatório antes do cadastro. Adicione o arquivo e tente novamente.'
          )
        }
      }

      

      const { data, profileData, error: signUpError } = await signUp(
        email,
        password,
        userType as any,
        additionalData
      )

      if (signUpError) {
        throw new Error(signUpError)
      }

      // Salvar endereços para nutricionistas
      if (
        userType === 'nutricionista' &&
        data?.user?.id &&
        addresses.length > 0
      ) {
        try {
          await saveNutritionistAddresses(profileData.id, addresses)
          // Addresses saved successfully
        } catch (addressError) {
          // Error saving addresses
          // Não falha o cadastro por causa dos endereços, apenas loga o erro
          toast({
            title: '⚠️ Aviso',
            description:
              'Cadastro realizado, mas houve um problema ao salvar os endereços. Você pode adicioná-los depois no seu perfil.',
            variant: 'default',
          })
        }
      }

      // Upload de documentos para nutricionistas
      if (
        userType === 'nutricionista' &&
        data?.user?.id &&
        data?.session?.access_token
      ) {
        try {
          await uploadNutritionistDocuments(
            data.user.id,
            data.session.access_token
          )
          // Documents uploaded successfully
        } catch (documentError) {
          // Error uploading documents
          // Falha o cadastro se não conseguir fazer upload do comprovante de CRN
          throw new Error(
            'Erro ao fazer upload dos documentos obrigatórios. Tente novamente.'
          )
        }
      }

      // Salvar especialidades para nutricionistas
      if (
        userType === 'nutricionista' &&
        profileData?.id &&
        selectedSpecialties.length > 0
      ) {
        try {
          const response = await fetch('/api/nutritionist-specialties', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nutritionist_id: profileData.id,
              specialty_ids: selectedSpecialties,
            }),
          })

          if (!response.ok) {
            throw new Error('Erro ao salvar especialidades')
          }

          // Specialties saved successfully
        } catch (specialtyError) {
          // Error saving specialties
          // Não falha o cadastro por causa das especialidades, apenas loga o erro
          toast({
            title: '⚠️ Aviso',
            description:
              'Cadastro realizado, mas houve um problema ao salvar as especialidades. Você pode adicioná-las depois no seu perfil.',
            variant: 'default',
          })
        }
      }

      toast({
        title: '✅ Cadastro realizado com sucesso!',
        description: 'Bem-vindo ao Busca Nutri',
      })

      // Aguardar antes de redirecionar
      setTimeout(() => {
        if (userType === 'nutricionista') {
          router.push('/dashboard/nutricionistas?activeTab=assinatura')
        } else if (userType === 'paciente') {
          router.push('/dashboard/paciente')
        } else if (userType === 'empresa') {
          router.push('/dashboard/empresa')
        }

        refreshUser()
      }, 2000)
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido. Tente novamente.'
      setError(errorMessage)
      if (
        errorMessage.includes('Este email já possui uma conta') ||
        errorMessage.includes('Já existe uma conta iniciada')
      ) {
        toast({
          title: 'Verifique seu e-mail',
          description:
            'Já existe uma conta iniciada com este e-mail. Enviamos um link para concluir e definir a senha.',
          variant: 'default',
        })
      } else {
        toast({
          title: '❌ Erro no cadastro',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Função para renderizar ícone de validação CNPJ
  const renderCNPJValidationIcon = () => {
    switch (cnpjValidation.status) {
      case 'validating':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  // Função para renderizar ícone de força da senha
  const renderPasswordStrengthIcon = () => {
    if (!password) return null

    switch (passwordValidation.strength) {
      case 'weak':
        return <ShieldAlert className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-500" />
      case 'strong':
        return <ShieldCheck className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
          <p className="text-[#1E1D40]/70 font-medium">Verificando sessao...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2E6D8] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image
              src="/logo-busca-nutri.png"
              alt="Busca Nutri"
              width={180}
              height={36}
              className="h-8 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold text-[#1E1D40] mb-2">
            Crie sua conta
          </h1>
          <p className="text-[#1E1D40]/70">
            Junte-se à maior comunidade de nutrição do Brasil
          </p>
        </div>

        <Card className={`border-0 shadow-xl ${submitting ? 'pointer-events-none select-none' : ''}`}>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-[#1E1D40]">
              Cadastro
            </CardTitle>
            <CardDescription className="text-center">
              Escolha seu tipo de usuário e complete o cadastro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitting && <SubmittingOverlay message="Enviando seu cadastro..." />}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Tabs
              value={userType}
              onValueChange={setUserType}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="paciente" className="text-xs">
                  Paciente
                </TabsTrigger>
                <TabsTrigger value="nutricionista" className="text-xs">
                  Nutricionista
                </TabsTrigger>
                <TabsTrigger value="empresa" className="text-xs">
                  Empresa
                </TabsTrigger>
              </TabsList>

              <form ref={formRef} onInput={updateCanSubmit} onSubmit={handleSubmit} className="space-y-4" aria-busy={submitting}>
                <fieldset disabled={submitting} className="contents">
                  <TabsContent value="paciente" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome completo *</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Seu nome completo"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_date">Data de nascimento</Label>
                        <Input
                          id="birth_date"
                          name="birth_date"
                          type="date"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="h-11"
                          required
                        />
                        <p className="text-xs text-gray-500">Se já possui conta, use Esqueci minha senha</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="(11) 99999-9999"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="nutricionista" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nome completo *</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          placeholder="Seu nome completo"
                          className="h-11"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail profissional *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="h-11"
                          required
                        />
                        <p className="text-xs text-gray-500">Se já possui conta, use Esqueci minha senha</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="(11) 99999-9999"
                          className="h-11"
                        />
                      </div>
                    </div>

                    {/* Pergunta sobre planos corporativos */}
                    <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="space-y-2">
                        <Label className="text-base font-medium text-gray-900">
                          Aceita atender no modo corporativo?
                        </Label>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          O plano corporativo é uma opção de atendimento
                          nutricional para empresas, onde os funcionários podem
                          receber orientação nutricional, consultas individuais,
                          palestras e relatórios básicos. O valor do plano é
                          determinado pela quantidade de funcionários da empresa.
                          Ao aceitar atender no modo corporativo, você concorda em
                          fornecer serviços de nutrição para empresas que desejam
                          promover a saúde e o bem-estar de seus funcionários.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={
                            acceptsCorporatePlans === true ? 'default' : 'outline'
                          }
                          className={`flex-1 h-11 ${acceptsCorporatePlans === true
                            ? 'bg-[#4AB0D9] hover:bg-[#4AB0D9]/90 text-white'
                            : 'border-[#4AB0D9] text-[#4AB0D9] hover:bg-[#4AB0D9]/10'
                            }`}
                          onClick={() => setAcceptsCorporatePlans(true)}
                        >
                          Sim
                        </Button>
                        <Button
                          type="button"
                          variant={
                            acceptsCorporatePlans === false
                              ? 'default'
                              : 'outline'
                          }
                          className={`flex-1 h-11 ${acceptsCorporatePlans === false
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'border-gray-400 text-gray-600 hover:bg-gray-50'
                            }`}
                          onClick={() => setAcceptsCorporatePlans(false)}
                        >
                          Não
                        </Button>
                      </div>
                    </div>

                    {/* Configuração de Preços */}
                    <ConsultationPricingConfig
                      pricingConfig={pricingConfig}
                      setPricingConfig={setPricingConfig}
                    />

                    {/* Gerenciamento de Endereços */}
                    <AddressManagement onAddressesChange={setAddresses} />

                    {/* Documentos e CRN */}
                    <NutritionistDocumentsUpload
                      crnNumber={crnValue}
                      onCrnNumberChange={handleCRNChange}
                      crnProofFile={crnProofFile}
                      onCrnProofFileChange={setCrnProofFile}
                      certificates={certificates}
                      onCertificatesChange={setCertificates}
                      isRequired={true}
                      disabled={loading || documentsUploading}
                    />

                    {/* Seleção de Especialidades */}
                    <div className="space-y-2">
                      <Label className="text-base font-medium">
                        Especialidades
                      </Label>
                      <p className="text-sm text-gray-600">
                        Selecione suas áreas de especialização (máximo 5)
                      </p>
                      <SpecialtySelector
                        selectedSpecialties={selectedSpecialties}
                        onSpecialtiesChange={setSelectedSpecialties}
                        maxSelections={5}
                      />
                    </div>

                    {/* Consentimento para Cupons de Desconto */}
                    <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="aceita_cupons"
                          checked={aceitaCupons}
                          onChange={e => setAceitaCupons(e.target.checked)}
                          className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          aria-describedby="aceita_cupons_description"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="aceita_cupons"
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            Aceito disponibilizar cupons de desconto para
                            pacientes em promoções da plataforma.
                          </Label>
                          <p
                            id="aceita_cupons_description"
                            className="text-xs text-gray-600 mt-1 leading-relaxed"
                          >
                            Campanhas e prêmios para os primeiros pacientes que se
                            cadastrarem na plataforma serão realizadas, onde
                            disponibilizamos cupons de 10% desconto na consulta
                            online.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="empresa" className="space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Nome da empresa *</Label>
                        <Input
                          id="company_name"
                          name="company_name"
                          placeholder="Razão social"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ *</Label>
                        <div className="relative">
                          <Input
                            id="cnpj"
                            name="cnpj"
                            placeholder="00.000.000/0000-00"
                            className="h-11 pr-10"
                            value={cnpjValue}
                            onChange={e => handleCNPJChange(e.target.value)}
                            required
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {renderCNPJValidationIcon()}
                          </div>
                        </div>
                        {cnpjValidation.message && (
                          <p
                            className={`text-xs mt-1 ${cnpjValidation.status === 'valid'
                              ? 'text-green-600'
                              : cnpjValidation.status === 'invalid'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                              }`}
                          >
                            {cnpjValidation.message}
                          </p>
                        )}
                        {cnpjValidation.companyData &&
                          cnpjValidation.status === 'valid' && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs">
                              <div className="flex items-center gap-1 text-green-700 font-medium">
                                <Building className="h-3 w-3" />
                                Empresa Encontrada
                              </div>
                              <div className="text-green-600 mt-1">
                                <div>
                                  <strong>Razão Social:</strong>{' '}
                                  {cnpjValidation.companyData.name}
                                </div>
                                {cnpjValidation.companyData.fantasyName && (
                                  <div>
                                    <strong>Nome Fantasia:</strong>{' '}
                                    {cnpjValidation.companyData.fantasyName}
                                  </div>
                                )}
                                <div>
                                  <strong>Situação:</strong>{' '}
                                  {cnpjValidation.companyData.situation}
                                </div>
                              </div>
                            </div>
                          )}
                        <p className="text-xs text-gray-500 mt-1">
                          Será validado automaticamente na Receita Federal
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="responsible_name">
                          Nome do responsável *
                        </Label>
                        <Input
                          id="responsible_name"
                          name="responsible_name"
                          placeholder="Nome completo"
                          className="h-11"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsible_position">Cargo</Label>
                        <Input
                          id="responsible_position"
                          name="responsible_position"
                          placeholder="Ex: Gerente de RH"
                          className="h-11"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail corporativo *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="contato@empresa.com"
                          className="h-11"
                          required
                        />
                        <p className="text-xs text-gray-500">Se já possui conta, use Esqueci minha senha</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="(11) 3333-3333"
                          className="h-11"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        className="h-11 pr-20"
                        required
                        minLength={8}
                        value={password}
                        onChange={e => handlePasswordChange(e.target.value)}
                      />
                      <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                        {renderPasswordStrengthIcon()}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    {/* Indicador de força da senha */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${passwordValidation.strength === 'weak'
                                ? 'w-1/3 bg-red-500'
                                : passwordValidation.strength === 'medium'
                                  ? 'w-2/3 bg-yellow-500'
                                  : 'w-full bg-green-500'
                                }`}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${passwordValidation.strength === 'weak'
                              ? 'text-red-600'
                              : passwordValidation.strength === 'medium'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                              }`}
                          >
                            {passwordValidation.message}
                          </span>
                        </div>

                        {/* Lista de requisitos */}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div
                            className={`flex items-center gap-1 ${passwordValidation.requirements.length ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${passwordValidation.requirements.length ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            8+ caracteres
                          </div>
                          <div
                            className={`flex items-center gap-1 ${passwordValidation.requirements.uppercase ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${passwordValidation.requirements.uppercase ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            Letra maiúscula
                          </div>
                          <div
                            className={`flex items-center gap-1 ${passwordValidation.requirements.lowercase ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${passwordValidation.requirements.lowercase ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            Letra minúscula
                          </div>
                          <div
                            className={`flex items-center gap-1 ${passwordValidation.requirements.number ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${passwordValidation.requirements.number ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            Número
                          </div>
                          <div
                            className={`flex items-center gap-1 ${passwordValidation.requirements.special ? 'text-green-600' : 'text-gray-500'}`}
                          >
                            <div
                              className={`w-1 h-1 rounded-full ${passwordValidation.requirements.special ? 'bg-green-500' : 'bg-gray-300'}`}
                            />
                            Caractere especial
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      Aceito os{' '}
                      <Link
                        href="/termos"
                        className="text-[#4AB0D9] hover:underline"
                      >
                        Termos de Uso
                      </Link>{' '}
                      e{' '}
                      <Link
                        href="/privacidade"
                        className="text-[#4AB0D9] hover:underline"
                      >
                        Política de Privacidade
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-11 ${userType === 'nutricionista'
                      ? 'bg-[#4AB0D9] hover:bg-[#4AB0D9]/90'
                      : userType === 'paciente'
                        ? 'bg-[#D90D32] hover:bg-[#D90D32]/90'
                        : 'bg-[#1E1D40] hover:bg-[#1E1D40]/90'
                      } text-white`}
                    disabled={!canSubmit}
                  >
                    {loading || documentsUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      `Cadastrar como ${userType === 'nutricionista' ? 'Nutricionista' : userType === 'paciente' ? 'Paciente' : 'Empresa'}`
                    )}
                  </Button>
                  {!canSubmit && (
                    <div className="mt-2 p-3 border rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-2 text-yellow-700 font-medium">
                        <AlertCircle className="h-4 w-4" />
                        Motivos para habilitar o cadastro
                      </div>
                      <ul className="mt-2 text-sm text-yellow-800 list-disc pl-5">
                        {getPendingReasons().map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </fieldset >
              </form>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#1E1D40]/70">
                Já tem uma conta?{' '}
                <Link
                  href="/login"
                  className="text-[#4AB0D9] hover:underline font-medium"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#1E1D40]/70 hover:text-[#4AB0D9] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
