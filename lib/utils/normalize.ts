// Escapa caracteres para montar regex dinâmica
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Normaliza texto removendo diacríticos (acentos), caracteres especiais
 * e tratando espaços. Mantém letras e números.
 */
export function normalizeText(
  input: string,
  opts?: {
    lower?: boolean;                 // deixa minúsculo (default: true)
    trim?: boolean;                  // .trim() (default: true)
    allowed?: string;                // caracteres extras permitidos (ex: "-_")
    replaceWhitespace?: string|null; // substitui espaços por " ", "-" etc. (default: " ")
  }
): string {
  const {
    lower = true,
    trim = true,
    allowed = '',
    replaceWhitespace = ' ',
  } = opts ?? {};

  let s = String(input);

  // 1) Remove diacríticos (acentos)
  // NFD separa base + marcas; remove marcas U+0300–U+036F
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 2) Normaliza espaços
  s = s.replace(/\s+/g, ' ');

  // 3) Remove tudo que não seja letra (L), número (N) ou permitido
  const extra = escapeRegExp(allowed + (replaceWhitespace ?? ''));
  const re = new RegExp(`[^\\p{L}\\p{N}${extra}]+`, 'gu');
  s = s.replace(re, '');

  // 4) Substitui espaços pelo desejado (ou mantém, se null)
  if (replaceWhitespace !== null) {
    s = s.replace(/\s+/g, replaceWhitespace);
    if (replaceWhitespace === '-') {
      s = s.replace(/-+/g, '-'); // colapsa múltiplos "-"
    }
  }

  if (trim) {
    s = s.trim();
    if (replaceWhitespace === '-') s = s.replace(/^-+|-+$/g, '');
  }
  if (lower) s = s.toLowerCase();

  return s;
}

/** Gera slug URL-friendly */
export const toSlug = (s: string) =>
  normalizeText(s, { replaceWhitespace: '-', allowed: '-', lower: true });
