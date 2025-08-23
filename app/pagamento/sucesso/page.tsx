'use client'
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";

export default function Sucesso() {
  const router = useRouter()
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Pagamento confirmado 🎉</h1>
      <p className="text-gray-600 mb-6">
        Sua teleconsulta foi agendada. Você pode acompanhar em “Minhas Teleconsultas”.
      </p>
      <Button onClick={() => {
        router.replace('/dashboard/paciente')
      }} className="bg-green-500">
        Voltar para o dashboard
      </Button>

    </div>
  )
}
