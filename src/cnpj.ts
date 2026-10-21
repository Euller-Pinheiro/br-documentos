import { ErroDocumento } from "./erros.js";
import { dvModulo11, sortear, todosIguais, type GeradorAleatorio } from "./internal/modulo11.js";

const TAMANHO_CNPJ = 14;
const TAMANHO_BASE_CNPJ = 12;
const TAMANHO_RAIZ_CNPJ = 8;
const DIGITOS = "0123456789";
const ALFANUMERICOS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Pesos do 1º DV (12 posições) e do 2º DV (13 posições): 2 a 9, da direita para a esquerda. */
const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/** Caracteres aceitos na entrada: letras, dígitos e a pontuação usual (ponto, barra, hífen, espaço). */
const ENTRADA_CNPJ = /^[0-9A-Za-z./\-\s]*$/;
/** CNPJ limpo: 12 posições alfanuméricas + 2 DVs sempre numéricos. */
const FORMATO_CNPJ = /^[0-9A-Z]{12}[0-9]{2}$/;
const FORMATO_BASE_CNPJ = /^[0-9A-Z]{12}$/;

/**
 * Remove pontuação e espaços e converte letras para maiúsculas.
 * Não descarta letras: desde 2026 elas fazem parte do CNPJ.
 *
 * @example limparCnpj("12.abc.345/01de-35") // "12ABC34501DE35"
 */
export function limparCnpj(valor: string): string {
  return valor.replace(/[^0-9A-Za-z]/g, "").toUpperCase();
}

/**
 * Valor de um caractere no cálculo do DV: código ASCII − 48.
 * Assim, "0"–"9" valem 0–9 (o cálculo antigo continua igual) e
 * "A"–"Z" valem 17–42.
 */
export function valorCaractereCnpj(caractere: string): number {
  if (!/^[0-9A-Z]$/.test(caractere)) {
    throw new ErroDocumento(
      "CARACTERE_INVALIDO",
      `Caractere inválido no CNPJ: "${caractere}" (use 0-9 ou A-Z)`,
    );
  }
  return caractere.charCodeAt(0) - 48;
}

/**
 * Calcula os dois dígitos verificadores a partir das 12 primeiras posições
 * (numéricas ou alfanuméricas).
 *
 * @example calcularDvCnpj("12ABC34501DE") // "35"
 * @throws {ErroDocumento} se a base não tiver 12 posições de 0-9/A-Z
 */
export function calcularDvCnpj(base: string): string {
  const limpa = limparCnpj(base);
  if (!ENTRADA_CNPJ.test(base)) {
    throw new ErroDocumento("CARACTERE_INVALIDO", `Base de CNPJ com caractere inválido: "${base}"`);
  }
  if (!FORMATO_BASE_CNPJ.test(limpa)) {
    throw new ErroDocumento(
      "TAMANHO_INVALIDO",
      `A base do CNPJ precisa ter ${String(TAMANHO_BASE_CNPJ)} posições; recebido: "${base}"`,
    );
  }
  const valores = Array.from(limpa, valorCaractereCnpj);
  const dv1 = dvModulo11(valores, PESOS_DV1);
  const dv2 = dvModulo11([...valores, dv1], PESOS_DV2);
  return `${String(dv1)}${String(dv2)}`;
}

/**
 * Valida um CNPJ numérico ou alfanumérico, com ou sem pontuação, aceitando
 * letras minúsculas. Nunca lança: devolve `false` para qualquer entrada inválida.
 *
 * Recusa: símbolos fora da pontuação usual, tamanho diferente de 14,
 * letras nos DVs, sequências repetidas e DVs errados.
 */
export function validarCnpj(valor: string): boolean {
  if (!ENTRADA_CNPJ.test(valor)) return false;
  const cnpj = limparCnpj(valor);
  if (cnpj.length !== TAMANHO_CNPJ || !FORMATO_CNPJ.test(cnpj) || todosIguais(cnpj)) return false;
  return calcularDvCnpj(cnpj.slice(0, TAMANHO_BASE_CNPJ)) === cnpj.slice(TAMANHO_BASE_CNPJ);
}

/** Verdadeiro quando o CNPJ (válido ou não) contém pelo menos uma letra. */
export function ehCnpjAlfanumerico(valor: string): boolean {
  return /[A-Z]/.test(limparCnpj(valor));
}

/**
 * Formata no padrão AA.AAA.AAA/AAAA-DV (por exemplo 12.ABC.345/01DE-35).
 * Só confere o formato; use `validarCnpj` para conferir os DVs.
 *
 * @throws {ErroDocumento} se houver caractere estranho ou o formato não for 12 posições + 2 dígitos
 */
export function formatarCnpj(valor: string): string {
  if (!ENTRADA_CNPJ.test(valor)) {
    throw new ErroDocumento("CARACTERE_INVALIDO", `CNPJ com caractere inválido: "${valor}"`);
  }
  const cnpj = limparCnpj(valor);
  if (!FORMATO_CNPJ.test(cnpj)) {
    throw new ErroDocumento(
      "TAMANHO_INVALIDO",
      `CNPJ precisa ter 12 posições alfanuméricas e 2 dígitos verificadores; recebido: "${valor}"`,
    );
  }
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
}

export interface OpcoesGerarCnpj {
  /** Gera raiz e ordem com letras e números (novo formato). Padrão: `false` (só dígitos). */
  alfanumerico?: boolean;
  /**
   * Número de ordem do estabelecimento (posições 9 a 12): "0001" é a matriz.
   * Padrão: `"0001"`. Aceita letras quando `alfanumerico` for `true`.
   */
  ordem?: string;
  /** Devolve com pontuação. Padrão: `false`. */
  formatado?: boolean;
  /** Fonte de aleatoriedade no formato de `Math.random`. Útil para testes determinísticos. */
  aleatorio?: GeradorAleatorio;
}

/**
 * Gera um CNPJ válido **para testes e dados fictícios**. O número pode
 * coincidir com uma empresa real; não use para identificar ninguém.
 *
 * @throws {ErroDocumento} se `ordem` não tiver 4 posições compatíveis com o tipo pedido
 */
export function gerarCnpj(opcoes: OpcoesGerarCnpj = {}): string {
  const { alfanumerico = false, ordem = "0001", formatado = false, aleatorio = Math.random } = opcoes;
  const formatoOrdem = alfanumerico ? /^[0-9A-Z]{4}$/ : /^[0-9]{4}$/;
  if (!formatoOrdem.test(ordem)) {
    throw new ErroDocumento(
      "CARACTERE_INVALIDO",
      `A ordem precisa ter 4 ${alfanumerico ? "posições de 0-9/A-Z" : "dígitos"}; recebido: "${ordem}"`,
    );
  }
  const alfabeto = alfanumerico ? ALFANUMERICOS : DIGITOS;
  let base: string;
  do {
    const raiz = Array.from({ length: TAMANHO_RAIZ_CNPJ }, () => sortear(alfabeto, aleatorio)).join("");
    base = raiz + ordem;
    // Um gerador "alfanumérico" que sorteasse só dígitos devolveria um CNPJ numérico:
    // insiste até sair pelo menos uma letra, para o resultado ser do tipo pedido.
  } while (todosIguais(base) || (alfanumerico && !/[A-Z]/.test(base)));
  const cnpj = base + calcularDvCnpj(base);
  return formatado ? formatarCnpj(cnpj) : cnpj;
}
