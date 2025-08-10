import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Verificar variáveis de ambiente
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variáveis de ambiente do Supabase não configuradas")
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      )
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Parse do form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const documentType = formData.get("documentType") as string // 'crn_proof' or 'certificate'
    const title = formData.get("title") as string // Required for certificates
    const accessToken = formData.get("accessToken") as string

    console.log("📄 Upload de documento:", { userId, documentType, title, fileName: file?.name })

    // Validações básicas
    if (!file || !userId || !documentType || !accessToken) {
      return NextResponse.json(
        { error: "Arquivo, userId, documentType e accessToken são obrigatórios" },
        { status: 400 }
      )
    }

    // Validar se é certificado e tem título
    if (documentType === "certificate" && (!title || title.trim() === "")) {
      return NextResponse.json(
        { error: "Título é obrigatório para certificados" },
        { status: 400 }
      )
    }

    // Validar access token
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
    if (authError || !user || user.id !== userId) {
      console.error("❌ Erro de autenticação:", authError)
      return NextResponse.json(
        { error: "Token de acesso inválido" },
        { status: 401 }
      )
    }

    // Verificar se o usuário é nutricionista
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", userId)
      .single()

    if (userError || userData?.user_type !== "nutricionista") {
      console.error("❌ Usuário não é nutricionista:", userError)
      return NextResponse.json(
        { error: "Apenas nutricionistas podem fazer upload de documentos" },
        { status: 403 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use PDF, JPG ou PNG." },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB." },
        { status: 400 }
      )
    }

    // Para CRN proof, verificar se já existe um documento
    if (documentType === "crn_proof") {
      const { data: existingDoc, error: checkError } = await supabase
        .from("nutritionist_documents")
        .select("id")
        .eq("nutritionist_id", userId)
        .eq("document_type", "crn_proof")
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("❌ Erro ao verificar documento existente:", checkError)
        return NextResponse.json(
          { error: "Erro interno do servidor" },
          { status: 500 }
        )
      }

      // Se já existe, será uma substituição
      if (existingDoc) {
        console.log("🔄 Substituindo comprovante de CRN existente")
      }
    }

    // Gerar nome único do arquivo
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const sanitizedTitle = title ? title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "-") : ""
    const fileName = documentType === "crn_proof" 
      ? `crn-proof-${timestamp}.${fileExtension}`
      : `certificate-${sanitizedTitle}-${timestamp}.${fileExtension}`

    // Definir caminho no storage
    const storagePath = `${userId}/${documentType}/${fileName}`

    console.log("📁 Fazendo upload do arquivo:", fileName, "para:", storagePath)

    // Fazer upload do arquivo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documentos-nutricionistas")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Erro no upload:", uploadError)
      return NextResponse.json(
        { error: "Erro ao fazer upload do arquivo" },
        { status: 500 }
      )
    }

    // Obter URL pública (mesmo sendo bucket privado, precisamos da URL para referência)
    const { data: urlData } = supabase.storage
      .from("documentos-nutricionistas")
      .getPublicUrl(storagePath)

    // Salvar metadados no banco de dados
    const documentData = {
      nutritionist_id: userId,
      document_type: documentType,
      title: documentType === "certificate" ? title : null,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      is_verified: false,
    }

    // Se é substituição de CRN proof, fazer update
    if (documentType === "crn_proof") {
      const { data: existingDoc } = await supabase
        .from("nutritionist_documents")
        .select("id, storage_path")
        .eq("nutritionist_id", userId)
        .eq("document_type", "crn_proof")
        .single()

      if (existingDoc) {
        // Deletar arquivo antigo do storage
        await supabase.storage
          .from("documentos-nutricionistas")
          .remove([existingDoc.storage_path])

        // Atualizar registro existente
        const { data: updatedDoc, error: updateError } = await supabase
          .from("nutritionist_documents")
          .update(documentData)
          .eq("id", existingDoc.id)
          .select()
          .single()

        if (updateError) {
          console.error("❌ Erro ao atualizar documento:", updateError)
          return NextResponse.json(
            { error: "Erro ao salvar metadados do documento" },
            { status: 500 }
          )
        }

        console.log("✅ Comprovante de CRN substituído com sucesso")
        return NextResponse.json({
          success: true,
          document: updatedDoc,
          message: "Comprovante de CRN substituído com sucesso",
        })
      }
    }

    // Inserir novo documento
    const { data: newDoc, error: insertError } = await supabase
      .from("nutritionist_documents")
      .insert(documentData)
      .select()
      .single()

    if (insertError) {
      console.error("❌ Erro ao salvar documento:", insertError)
      
      // Limpar arquivo do storage em caso de erro
      await supabase.storage
        .from("documentos-nutricionistas")
        .remove([storagePath])

      return NextResponse.json(
        { error: "Erro ao salvar metadados do documento" },
        { status: 500 }
      )
    }

    console.log("✅ Documento salvo com sucesso:", newDoc.id)

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: documentType === "crn_proof" 
        ? "Comprovante de CRN enviado com sucesso" 
        : "Certificado enviado com sucesso",
    })

  } catch (error) {
    console.error("💥 Erro no upload de documento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}