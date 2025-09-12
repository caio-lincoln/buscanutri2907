// app/api/geo/states/route.ts
import { NextResponse } from 'next/server'

// export const revalidate = 60 * 60 * 24 // 24h

type IBGEState = {
  id: number
  nome: string
  sigla: string
  regiao: { id: number; sigla: string; nome: string }
}

export async function GET() {
  try {
    const r = await fetch(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome',
    )
    if (!r.ok) throw new Error('IBGE error')
    const data = (await r.json()) as IBGEState[]

    const states = data.map(s => ({
      ibge_id: s.id,
      uf: s.sigla,
      name: s.nome,
      region: s.regiao?.nome ?? null,
    }))

    return NextResponse.json({ states })
  } catch (e) {
    return NextResponse.json({ states: [] }, { status: 200 })
  }
}
