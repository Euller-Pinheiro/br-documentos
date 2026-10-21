/**
 * Códigos de erro lançados pelas funções que só fazem sentido com uma
 * entrada bem-formada (por exemplo, formatar um CPF com 10 dígitos).
 *
 * As funções `validar*` nunca lançam: devolvem `false`.
 */
export type CodigoErroDocumento = "TAMANHO_INVALIDO" | "CARACTERE_INVALIDO";

export class ErroDocumento extends Error {
  override readonly name = "ErroDocumento";

  constructor(
    readonly codigo: CodigoErroDocumento,
    mensagem: string,
  ) {
    super(mensagem);
  }
}
