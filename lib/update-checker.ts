import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface OutdatedPackage {
  current: string
  wanted: string
  latest: string
  dependent: string
  location: string
}

export interface UpdateCheckResult {
  hasUpdates: boolean
  packages: Record<string, OutdatedPackage>
  error?: string
}

export async function checkOutdatedPackages(): Promise<UpdateCheckResult> {
  try {
    // Executa npm outdated --json
    // O comando retorna exit code 1 se houver pacotes desatualizados, então precisamos capturar o erro
    const { stdout } = await execAsync('npm outdated --json').catch((err) => {
      // Se o erro for apenas código de saída 1, ainda temos o output JSON
      if (err.code === 1 && err.stdout) {
        return { stdout: err.stdout }
      }
      throw err
    })

    if (!stdout || stdout.trim() === '') {
      return { hasUpdates: false, packages: {} }
    }

    const packages = JSON.parse(stdout) as Record<string, OutdatedPackage>
    
    return {
      hasUpdates: Object.keys(packages).length > 0,
      packages
    }
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error)
    return {
      hasUpdates: false,
      packages: {},
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
