/**
 * Dígito verificador "módulo 11" no formato usado por CPF e CNPJ:
 * soma os valores multiplicados pelos pesos, pega o resto da divisão por 11
 * e devolve 0 quando o resto é 0 ou 1; nos demais casos, 11 − resto.
 *
 * @param valores valor numérico de cada posição, da esquerda para a direita
 * @param pesos peso de cada posição, com o mesmo tamanho de `valores`
 */
export function dvModulo11(valores: readonly number[], pesos: readonly number[]): number {
  if (valores.length !== pesos.length) {
    throw new RangeError(
      `valores (${String(valores.length)}) e pesos (${String(pesos.length)}) precisam ter o mesmo tamanho`,
    );
  }
  let soma = 0;
  for (const [i, valor] of valores.entries()) {
    soma += valor * (pesos[i] ?? 0);
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** Verdadeiro quando a string tem pelo menos um caractere e todos são iguais. */
export function todosIguais(texto: string): boolean {
  if (texto.length === 0) return false;
  const primeiro = texto.charAt(0);
  for (let i = 1; i < texto.length; i++) {
    if (texto.charAt(i) !== primeiro) return false;
  }
  return true;
}

/** Função no formato de `Math.random`: devolve um número em [0, 1). */
export type GeradorAleatorio = () => number;

/** Sorteia um caractere de `alfabeto` usando o gerador informado. */
export function sortear(alfabeto: string, aleatorio: GeradorAleatorio): string {
  const indice = Math.floor(aleatorio() * alfabeto.length);
  const caractere = alfabeto[Math.min(indice, alfabeto.length - 1)];
  if (caractere === undefined) {
    throw new RangeError("alfabeto vazio");
  }
  return caractere;
}
