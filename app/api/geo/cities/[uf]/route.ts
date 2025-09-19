import { NextResponse } from 'next/server'

// export const revalidate = 60 * 60 * 24

type IBGECity = { id: number; nome: string }

export async function GET(
  _req: Request,
  ctx: { params: { uf: string } }
) {
  const paramsAwaited = await ctx.params
  const uf = (paramsAwaited.uf || '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(uf)) {
    return NextResponse.json({ cities: [] }, { status: 200 })
  }

  try {
    const r = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,

    )
    if (!r.ok) throw new Error('IBGE error')
    const data = (await r.json()) as IBGECity[]

    const cities = data.map(c => ({ ibge_id: c.id, name: c.nome }))
    return NextResponse.json({ cities })
  } catch (e) {
    return NextResponse.json({ cities: [] }, { status: 200 })
  }
}
