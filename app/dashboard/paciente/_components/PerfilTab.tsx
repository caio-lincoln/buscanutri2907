'use client'
import {
  Heart,
  Target,
  FileText,
  User,
  AlertTriangle,
  Utensils,
  MessageSquare,
  Scale,
  Ruler,
  Pill,
  Dumbbell,
  Droplets,
  Edit,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { useAuth } from '../../../../contexts/auth-context';
import { useState } from 'react';

const UserProfileModal = dynamic(
  () =>
    import('../../../../components/user-profile-modal').then(
      (mod) => mod.UserProfileModal
    ),
  {
    ssr: false,
    loading: () => null,
  }
)
export default function PerfilTab({ anamneseData }: { anamneseData: any }) {
  const { patientProfile: profile, user } = useAuth()
  const [ isProfileModalOpen, setIsProfileModalOpen ] = useState(false)
  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            className="h-10 px-4 rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </div>
        {/* Cabeçalho removido conforme solicitado: manter apenas o módulo de perfil */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informações Pessoais */}
          <Card className="border-0 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span>Informações Pessoais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage
                    src={
                      profile?.profile_image_url ||
                      `/placeholder.svg?height=80&width=80&query=${profile?.full_name || 'user profile'}`
                    }
                  />
                  <AvatarFallback className="bg-gray-200 text-gray-600 text-xl font-semibold">
                    {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Nome Completo
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.full_name ||
                      anamneseData?.nome_completo ||
                      'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Data de Nascimento
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.birth_date ||
                      anamneseData?.data_nascimento ||
                      'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Telefone
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.phone ||
                      anamneseData?.telefone ||
                      'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    E-mail
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {user?.email ||
                      profile?.email ||
                      anamneseData?.email ||
                      'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    CPF
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.cpf || 'Não informado'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    RG
                  </label>
                  <p className="text-[#1E1D40] font-semibold">
                    {profile?.rg || 'Não informado'}
                  </p>
                </div>
                {anamneseData?.genero && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Gênero
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {anamneseData.genero}
                    </p>
                  </div>
                )}
                {anamneseData?.instagram && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Instagram
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {anamneseData.instagram}
                    </p>
                  </div>
                )}
                {(anamneseData?.cidade || anamneseData?.estado) && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">
                      Localização
                    </label>
                    <p className="text-[#1E1D40] font-semibold">
                      {[ anamneseData?.cidade, anamneseData?.estado ]
                        .filter(Boolean)
                        .join(', ') || 'Não informado'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Informações de Saúde */}
          <Card className="border-0 shadow-lg backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span>Informações de Saúde</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Dados Antropométricos */}
              {anamneseData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                    Dados Antropométricos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Peso Atual
                      </label>
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.peso_atual
                          ? `${anamneseData.peso_atual} kg`
                          : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Ruler className="h-4 w-4" />
                        Altura
                      </label>
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.altura
                          ? `${anamneseData.altura} cm`
                          : 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        IMC
                      </label>
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.imc || 'Não calculado'}
                      </p>
                    </div>
                  </div>
                  {anamneseData.historico_peso && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Histórico de Peso
                      </label>
                      <p className="text-[#1E1D40] font-semibold mt-1">
                        {anamneseData.historico_peso}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Objetivos e Metas */}
              {anamneseData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                    Objetivos e Metas
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Objetivos Nutricionais
                    </label>
                    {anamneseData.objetivos_nutricionais &&
                      anamneseData.objetivos_nutricionais.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {anamneseData.objetivos_nutricionais.map(
                          (objetivo: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {objetivo === 'definicao'
                                ? 'Definição'
                                : objetivo === 'disturbios_saude'
                                  ? 'Distúrbios na saúde'
                                  : objetivo === 'emagrecimento'
                                    ? 'Emagrecimento'
                                    : objetivo === 'ganho_massa_muscular'
                                      ? 'Ganho de massa muscular'
                                      : objetivo === 'intolerancia_alergia'
                                        ? 'Intolerância/alergia alimentar'
                                        : objetivo ===
                                          'performance_esportiva'
                                          ? 'Performance esportiva'
                                          : objetivo ===
                                            'reeducacao_alimentar'
                                            ? 'Reeducação alimentar'
                                            : objetivo === 'saude_geral'
                                              ? 'Saúde geral'
                                              : objetivo ===
                                                'saude_intestinal'
                                                ? 'Saúde intestinal'
                                                : objetivo === 'outro'
                                                  ? 'Outro'
                                                  : objetivo}
                            </Badge>
                          )
                        )}
                      </div>
                    ) : anamneseData.objetivo_nutricional ? (
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.objetivo_nutricional}
                      </p>
                    ) : (
                      <p className="text-[#1E1D40] font-semibold">
                        Não informado
                      </p>
                    )}
                    {anamneseData.objetivo_personalizado && (
                      <div className="mt-2">
                        <label className="text-sm font-medium text-gray-600">
                          Objetivo Personalizado:
                        </label>
                        <p className="text-[#1E1D40] font-semibold bg-gray-50 p-2 rounded-lg mt-1">
                          {anamneseData.objetivo_personalizado}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Condições de Saúde */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                  Condições de Saúde
                </h3>

                {/* Comorbidades */}
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Comorbidades
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(() => {
                      const conditions = [
                        ...(Array.isArray(profile?.health_conditions)
                          ? profile.health_conditions
                          : []),
                        ...(Array.isArray(anamneseData?.comorbidades)
                          ? anamneseData.comorbidades
                          : []),
                      ]
                      return conditions.length > 0 ? (
                        conditions.map((condition, i) => {
                          // Mapear códigos para nomes legíveis
                          const nomeComorbidade =
                            condition === 'anemia'
                              ? 'Anemia'
                              : condition === 'ansiedade'
                                ? 'Ansiedade'
                                : condition === 'artrite_reumatoide'
                                  ? 'Artrite reumatoide'
                                  : condition === 'colite_ulcerativa'
                                    ? 'Colite ulcerativa'
                                    : condition === 'depressao'
                                      ? 'Depressão'
                                      : condition === 'desnutricao'
                                        ? 'Desnutrição'
                                        : condition ===
                                          'diabetes_mellitus_1'
                                          ? 'Diabetes mellitus tipo 1'
                                          : condition ===
                                            'diabetes_mellitus_2'
                                            ? 'Diabetes mellitus tipo 2'
                                            : condition === 'dislipidemia'
                                              ? 'Dislipidemia'
                                              : condition ===
                                                'doenca_cardiaca'
                                                ? 'Doença cardíaca'
                                                : condition ===
                                                  'doenca_celiaca'
                                                  ? 'Doença celíaca'
                                                  : condition ===
                                                    'doenca_crohn'
                                                    ? 'Doença de Crohn'
                                                    : condition ===
                                                      'doenca_hashimoto'
                                                      ? 'Doença de Hashimoto'
                                                      : condition ===
                                                        'doenca_hepatica_cronica'
                                                        ? 'Doença hepática crônica'
                                                        : condition ===
                                                          'doenca_renal_cronica'
                                                          ? 'Doença renal crônica'
                                                          : condition ===
                                                            'doencas_neurodegenerativas'
                                                            ? 'Doenças neurodegenerativas'
                                                            : condition ===
                                                              'gastrite'
                                                              ? 'Gastrite'
                                                              : condition ===
                                                                'hipertensao_arterial'
                                                                ? 'Hipertensão arterial'
                                                                : condition ===
                                                                  'hipertiroidismo'
                                                                  ? 'Hipertiroidismo'
                                                                  : condition ===
                                                                    'hipotiroidismo'
                                                                    ? 'Hipotiroidismo'
                                                                    : condition ===
                                                                      'intolerancia_alergia_lactose'
                                                                      ? 'Intolerância à lactose'
                                                                      : condition ===
                                                                        'lupus'
                                                                        ? 'Lúpus'
                                                                        : condition ===
                                                                          'neoplasia'
                                                                          ? 'Neoplasia'
                                                                          : condition ===
                                                                            'obesidade'
                                                                            ? 'Obesidade'
                                                                            : condition ===
                                                                              'osteoporose'
                                                                              ? 'Osteoporose'
                                                                              : condition ===
                                                                                'refluxo_gastroesofagico'
                                                                                ? 'Refluxo gastroesofágico'
                                                                                : condition ===
                                                                                  'sindrome_intestino_irritavel'
                                                                                  ? 'Síndrome do intestino irritável'
                                                                                  : condition ===
                                                                                    'sindrome_metabolica'
                                                                                    ? 'Síndrome metabólica'
                                                                                    : condition ===
                                                                                      'transtorno_alimentar'
                                                                                      ? 'Transtorno alimentar'
                                                                                      : condition ===
                                                                                        'ulcera_peptica'
                                                                                        ? 'Úlcera péptica'
                                                                                        : condition

                          return (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-red-50 text-red-700 border-red-200"
                            >
                              {nomeComorbidade}
                            </Badge>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500">
                          Nenhuma informada
                        </p>
                      )
                    })()}
                  </div>
                </div>

                {/* Alergias e Intolerâncias */}
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Alergias e Intolerâncias
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(() => {
                      const allergies = [
                        ...(Array.isArray(profile?.allergies)
                          ? profile.allergies
                          : []),
                        ...(Array.isArray(
                          anamneseData?.alergias_alimentares
                        )
                          ? anamneseData.alergias_alimentares
                          : []),
                        ...(Array.isArray(
                          anamneseData?.alergias_intolerancias
                        )
                          ? anamneseData.alergias_intolerancias
                          : []),
                      ]
                      return allergies.length > 0 ? (
                        allergies.map((allergy, i) => {
                          // Mapear códigos para nomes legíveis
                          const nomeAlergia =
                            allergy === 'amendoim'
                              ? 'Amendoim'
                              : allergy === 'castanhas'
                                ? 'Castanhas'
                                : allergy === 'corantes'
                                  ? 'Corantes'
                                  : allergy === 'crustaceos'
                                    ? 'Crustáceos'
                                    : allergy === 'frutos_mar'
                                      ? 'Frutos do mar'
                                      : allergy === 'gluten'
                                        ? 'Glúten'
                                        : allergy === 'lactose'
                                          ? 'Lactose'
                                          : allergy === 'ovo'
                                            ? 'Ovo'
                                            : allergy === 'peixes'
                                              ? 'Peixes'
                                              : allergy === 'soja'
                                                ? 'Soja'
                                                : allergy === 'sulfitos'
                                                  ? 'Sulfitos'
                                                  : allergy === 'trigo'
                                                    ? 'Trigo'
                                                    : allergy

                          return (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                            >
                              {nomeAlergia}
                            </Badge>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500">
                          Nenhuma informada
                        </p>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Medicamentos e Suplementos */}
              {anamneseData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                    Medicamentos e Suplementos
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medicamentos */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Medicamentos em Uso
                      </label>
                      {anamneseData.medicacoes_uso &&
                        Array.isArray(anamneseData.medicacoes_uso) &&
                        anamneseData.medicacoes_uso.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {anamneseData.medicacoes_uso.map(
                            (medicamento: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {medicamento}
                              </Badge>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          Não informado
                        </p>
                      )}
                    </div>

                    {/* Suplementos */}
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        Suplementação
                      </label>
                      {anamneseData.suplementacao_atual &&
                        Array.isArray(anamneseData.suplementacao_atual) &&
                        anamneseData.suplementacao_atual.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {anamneseData.suplementacao_atual.map(
                            (suplemento: string, i: number) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                              >
                                {suplemento}
                              </Badge>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-1">
                          Não informado
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Exames e Avaliações */}
              {anamneseData?.exames_laboratoriais && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                    Exames e Avaliações
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Exames Laboratoriais Recentes
                    </label>
                    {anamneseData?.exames_laboratoriais &&
                    typeof anamneseData.exames_laboratoriais === 'object' &&
                    !Array.isArray(anamneseData.exames_laboratoriais) ? (
                      <div className="space-y-2 mt-1">
                        {Object.entries(anamneseData.exames_laboratoriais).map(([key, val]) => (
                          <div key={key} className="flex items-start justify-between gap-2">
                            <span className="text-sm text-gray-600 capitalize">
                              {String(key).replace(/_/g, ' ')}
                            </span>
                            <span className="text-sm text-[#1E1D40] font-semibold">
                              {Array.isArray(val)
                                ? val.join(', ')
                                : typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#1E1D40] font-semibold mt-1">
                        {(() => {
                          const v = anamneseData?.exames_laboratoriais
                          if (v == null) return '-'
                          if (Array.isArray(v)) return v.join(', ')
                          if (typeof v === 'string') return v
                          if (typeof v === 'object') return JSON.stringify(v)
                          return String(v)
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Estilo de Vida */}
              {anamneseData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                    Estilo de Vida
                  </h3>

                  {/* Atividade Física */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        Atividade Física
                      </label>
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.atividade_fisica || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Frequência
                      </label>
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.frequencia_atividade_fisica ||
                          'Não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Consumo de Água */}
                  {anamneseData.consumo_agua && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Droplets className="h-4 w-4" />
                        Consumo de Água Diário
                      </label>
                      <p className="text-[#1E1D40] font-semibold">
                        {anamneseData.consumo_agua}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Preferências e Restrições Alimentares */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                  Preferências e Restrições Alimentares
                </h3>

                {/* Preferências Alimentares */}
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Preferências Alimentares
                  </label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(() => {
                      const preferences = [
                        ...(Array.isArray(profile?.dietary_preferences)
                          ? profile.dietary_preferences
                          : []),
                        ...(Array.isArray(
                          anamneseData?.preferencias_alimentares
                        )
                          ? anamneseData.preferencias_alimentares
                          : []),
                      ]
                      return preferences.length > 0 ? (
                        preferences.map((preference, i) => {
                          // Mapear códigos para nomes legíveis
                          const nomePreferencia =
                            preference === 'cetogenica'
                              ? 'Cetogênica'
                              : preference === 'dash'
                                ? 'DASH'
                                : preference === 'flexitariana'
                                  ? 'Flexitariana'
                                  : preference === 'low_carb'
                                    ? 'Low Carb'
                                    : preference === 'mediterranea'
                                      ? 'Mediterrânea'
                                      : preference === 'paleo'
                                        ? 'Paleo'
                                        : preference === 'sem_gluten'
                                          ? 'Sem glúten'
                                          : preference === 'sem_lactose'
                                            ? 'Sem lactose'
                                            : preference === 'vegana'
                                              ? 'Vegana'
                                              : preference === 'vegetariana'
                                                ? 'Vegetariana'
                                                : preference

                          return (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              {nomePreferencia}
                            </Badge>
                          )
                        })
                      ) : (
                        <p className="text-sm text-gray-500">
                          Nenhuma informada
                        </p>
                      )
                    })()}
                  </div>
                </div>

                {/* Restrições Alimentares */}
                {anamneseData?.restricoes_alimentares &&
                  anamneseData.restricoes_alimentares.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Restrições Alimentares
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {anamneseData.restricoes_alimentares.map(
                          (restricao: string, i: number) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200"
                            >
                              {restricao}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Observações Adicionais */}
              {anamneseData?.observacoes_adicionais && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#1E1D40] border-b border-gray-200 pb-2">
                    Observações Adicionais
                  </h3>
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Informações Complementares
                    </label>
                    <p className="text-[#1E1D40] font-semibold mt-1 bg-gray-50 p-3 rounded-lg">
                      {anamneseData.observacoes_adicionais}
                    </p>
                  </div>
                </div>
              )}

              {/* Configurações de Notificação */}
              {/* <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-600 mb-3 block">
                  Configurações de Notificação
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-notifications"
                      checked={profile?.email_notifications_enabled ?? true}
                      onCheckedChange={checked =>
                        setProfile(prev =>
                          prev
                            ? {
                              ...prev,
                              email_notifications_enabled: checked,
                            }
                            : null
                        )
                      }
                    />
                    <label
                      htmlFor="email-notifications"
                      className="text-sm text-gray-700"
                    >
                      Receber notificações por e-mail
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="in-app-notifications"
                      checked={
                        profile?.in_app_notifications_enabled ?? true
                      }
                      onCheckedChange={checked =>
                        setProfile(prev =>
                          prev
                            ? {
                              ...prev,
                              in_app_notifications_enabled: checked,
                            }
                            : null
                        )
                      }
                    />
                    <label
                      htmlFor="in-app-notifications"
                      className="text-sm text-gray-700"
                    >
                      Receber notificações no aplicativo
                    </label>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>
        </div>
      </div>
      {profile && (
        <UserProfileModal
          open={isProfileModalOpen}
          onOpenChange={setIsProfileModalOpen}
          userType="paciente"
          initialData={profile}
          userId={profile.user_id}
        />
      )}
    </>

  );
}
