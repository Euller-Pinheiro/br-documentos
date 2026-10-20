import { ErroDocumento } from "./erros.js";
import { dvModulo11, sortear, todosIguais, type GeradorAleatorio } from "./internal/modulo11.js";

const TAMANHO_CPF = 11;
const TAMANHO_BASE_CPF = 9;
const DIGITOS = "0123456789";

/** Caracteres aceitos na entrada: dígitos e a pontuação usual (ponto, hífen, espaço). */
const ENTRADA_CPF = /^[\d.\-\s]*$/;

/**
 * Remove pontuação e espaços, mantendo só os dígitos.
 *
 * @example limparCpf("529.982.247-25") // "52998224725"
 */
export function limparCpf(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Calcula os dois dígitos verificadores a partir dos 9 primeiros dígitos.
 *
 * 1º DV: pesos 10 a 2 sobre os 9 dígitos; 2º DV: pesos 11 a 2 sobre os
 * 9 dígitos + 1º DV. Em ambos, resto < 2 vira 0; senão, 11 − resto.
 *
 * @throws {ErroDocumento} se a base não tiver exatamente 9 dígitos
 */
export function calcularDvCpf(base: string): string {
  const limpa = limparCpf(base);
  if (!ENTRADA_CPF.test(base) || limpa.length !== TAMANHO_BASE_CPF) {
    throw new ErroDocumento(
      "TAMANHO_INVALIDO",
      `A base do CPF precisa ter ${String(TAMANHO_BASE_CPF)} dígitos; recebido: "${base}"`,
    );
  }
  const valores = Array.from(limpa, Number);
  const dv1 = dvModulo11(valores, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvModulo11([...valores, dv1], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${String(dv1)}${String(dv2)}`;
}

/**
 * Valida um CPF, com ou sem pontuação. Nunca lança: devolve `false` para
 * qualquer entrada inválida.
 *
 * Recusa: letras ou outros símbolos, tamanho diferente de 11 dígitos,
 * sequências repetidas (111.111.111-11 passa no cálculo, mas não é emitido)
 * e dígitos verificadores errados.
 */
export function validarCpf(valor: string): boolean {
  if (!ENTRADA_CPF.test(valor)) return false;
  const cpf = limparCpf(valor);
  if (cpf.length !== TAMANHO_CPF || todosIguais(cpf)) return false;
  return calcularDvCpf(cpf.slice(0, TAMANHO_BASE_CPF)) === cpf.slice(TAMANHO_BASE_CPF);
}

/**
 * Formata no padrão 000.000.000-00. Só confere o formato (11 dígitos);
 * use `validarCpf` para conferir os dígitos verificadores.
 *
 * @throws {ErroDocumento} se a entrada tiver caracteres estranhos ou não tiver 11 dígitos
 */
export function formatarCpf(valor: string): string {
  if (!ENTRADA_CPF.test(valor)) {
    throw new ErroDocumento("CARACTERE_INVALIDO", `CPF com caractere inválido: "${valor}"`);
  }
  const cpf = limparCpf(valor);
  if (cpf.length !== TAMANHO_CPF) {
    throw new ErroDocumento(
      "TAMANHO_INVALIDO",
      `CPF precisa ter ${String(TAMANHO_CPF)} dígitos; recebido: "${valor}"`,
    );
  }
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

export interface OpcoesGerarCpf {
  /** Devolve com pontuação (000.000.000-00). Padrão: `false`. */
  formatado?: boolean;
  /** Fonte de aleatoriedade no formato de `Math.random`. Útil para testes determinísticos. */
  aleatorio?: GeradorAleatorio;
}

/**
 * Gera um CPF válido **para testes e dados fictícios**. Não use para
 * identificar pessoas: o número pode pertencer a alguém de verdade.
 */
export function gerarCpf(opcoes: OpcoesGerarCpf = {}): string {
  const { formatado = false, aleatorio = Math.random } = opcoes;
  let base: string;
  do {
    base = Array.from({ length: TAMANHO_BASE_CPF }, () => sortear(DIGITOS, aleatorio)).join("");
  } while (todosIguais(base));
  const cpf = base + calcularDvCpf(base);
  return formatado ? formatarCpf(cpf) : cpf;
}
