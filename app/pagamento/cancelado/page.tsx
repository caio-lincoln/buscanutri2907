export default function Cancelado() {
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold mb-2">Pagamento cancelado</h1>
      <p className="text-gray-600 mb-6">
        O pagamento foi cancelado e o agendamento não foi criado.
      </p>
      <a href="/dashboard/paciente?activeTab=teleconsultas" className="underline">
        Escolher outro horário
      </a>
    </div>
  )
}
