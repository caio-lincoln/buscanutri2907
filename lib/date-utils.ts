
import { fromZonedTime, format as formatTz } from 'date-fns-tz'

/**
 * Converte uma data selecionada para um intervalo de início e fim do dia em UTC,
 * considerando o fuso horário especificado.
 * 
 * Exemplo: Se data="2023-10-27" e timezone="America/Sao_Paulo" (-03:00)
 * start -> 2023-10-27T03:00:00.000Z
 * end   -> 2023-10-28T02:59:59.999Z
 */
export function getDayRangeInUTC(date: Date | string, timezone: string = 'America/Sao_Paulo') {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Extract YYYY-MM-DD in the target timezone
  // This ensures that we get the correct date regardless of the input date's original timezone
  const yyyyMMdd = formatTz(dateObj, 'yyyy-MM-dd', { timeZone: timezone })
  
  const startLocal = `${yyyyMMdd}T00:00:00`
  const endLocal = `${yyyyMMdd}T23:59:59.999`
  
  const startUTC = fromZonedTime(startLocal, timezone)
  const endUTC = fromZonedTime(endLocal, timezone)
  
  return {
    start: startUTC.toISOString(),
    end: endUTC.toISOString()
  }
}
