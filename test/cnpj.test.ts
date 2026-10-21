import { describe, expect, it } from "vitest";
import {
  calcularDvCnpj,
  ehCnpjAlfanumerico,
  ErroDocumento,
  formatarCnpj,
  gerarCnpj,
  limparCnpj,
  validarCnpj,
  valorCaractereCnpj,
} from "../src/index.js";

/** Exemplo publicado pelo Serpro/Receita Federal para o CNPJ alfanumérico. */
const EXEMPLO_OFICIAL = "12ABC34501DE35";
const NUMERICOS = ["11222333000181", "11444777000161"];

describe("limparCnpj", () => {
  it("remove pontuação e mantém letras em maiúsculas", () => {
    expect(limparCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
    expect(limparCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });
});

describe("valorCaractereCnpj", () => {
  it("usa ASCII − 48", () => {
    expect(valorCaractereCnpj("0")).toBe(0);
    expect(valorCaractereCnpj("9")).toBe(9);
    expect(valorCaractereCnpj("A")).toBe(17);
    expect(valorCaractereCnpj("B")).toBe(18);
    expect(valorCaractereCnpj("Z")).toBe(42);
  });

  it.each(["a", "-", "", "AB", "Ç"])("recusa %j", (c) => {
    expect(() => valorCaractereCnpj(c)).toThrow(ErroDocumento);
  });
});

describe("calcularDvCnpj", () => {
  it("bate com o exemplo oficial do CNPJ alfanumérico", () => {
    expect(calcularDvCnpj("12ABC34501DE")).toBe("35");
    expect(calcularDvCnpj("12.ABC.345/01DE")).toBe("35");
  });

  it.each(NUMERICOS)("mantém o cálculo antigo para o numérico %s", (cnpj) => {
    expect(calcularDvCnpj(cnpj.slice(0, 12))).toBe(cnpj.slice(12));
  });

  it("recusa base com tamanho errado", () => {
    expect(() => calcularDvCnpj("12ABC34501D")).toThrow(
      expect.objectContaining({ codigo: "TAMANHO_INVALIDO" }),
    );
  });

  it("recusa base com símbolo estranho", () => {
    expect(() => calcularDvCnpj("12ABC34501D#")).toThrow(
      expect.objectContaining({ codigo: "CARACTERE_INVALIDO" }),
    );
  });
});

describe("validarCnpj", () => {
  it("aceita o exemplo oficial com e sem pontuação", () => {
    expect(validarCnpj(EXEMPLO_OFICIAL)).toBe(true);
    expect(validarCnpj("12.ABC.345/01DE-35")).toBe(true);
  });

  it("aceita letras minúsculas", () => {
    expect(validarCnpj("12.abc.345/01de-35")).toBe(true);
  });

  it.each(NUMERICOS)("aceita o numérico %s", (cnpj) => {
    expect(validarCnpj(cnpj)).toBe(true);
  });

  it("recusa DV errado", () => {
    expect(validarCnpj("12ABC34501DE36")).toBe(false);
    expect(validarCnpj("11222333000182")).toBe(false);
  });

  it("recusa letra trocada na base (o DV detecta)", () => {
    expect(validarCnpj("12ABD34501DE35")).toBe(false);
  });

  it("recusa letra nos dígitos verificadores", () => {
    expect(validarCnpj("12ABC34501DE3A")).toBe(false);
  });

  it.each(["00000000000000", "AAAAAAAAAAAAAA", "11.111.111/1111-11"])(
    "recusa sequência repetida %s",
    (cnpj) => {
      expect(validarCnpj(cnpj)).toBe(false);
    },
  );

  it.each(["", "1122233300018", "112223330001811", "12ABC34501DE3#", "12_ABC_345_01DE_35"])(
    "recusa entrada malformada %j",
    (cnpj) => {
      expect(validarCnpj(cnpj)).toBe(false);
    },
  );
});

describe("ehCnpjAlfanumerico", () => {
  it("detecta letras", () => {
    expect(ehCnpjAlfanumerico(EXEMPLO_OFICIAL)).toBe(true);
    expect(ehCnpjAlfanumerico("11.222.333/0001-81")).toBe(false);
  });
});

describe("formatarCnpj", () => {
  it("formata numérico e alfanumérico", () => {
    expect(formatarCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatarCnpj("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  });

  it("é idempotente", () => {
    expect(formatarCnpj("12.ABC.345/01DE-35")).toBe("12.ABC.345/01DE-35");
  });

  it("lança TAMANHO_INVALIDO para tamanho errado ou letra no DV", () => {
    expect(() => formatarCnpj("1122233300018")).toThrow(
      expect.objectContaining({ codigo: "TAMANHO_INVALIDO" }),
    );
    expect(() => formatarCnpj("12ABC34501DE3A")).toThrow(
      expect.objectContaining({ codigo: "TAMANHO_INVALIDO" }),
    );
  });

  it("lança CARACTERE_INVALIDO para símbolo estranho", () => {
    expect(() => formatarCnpj("12*ABC*345/01DE-35")).toThrow(
      expect.objectContaining({ codigo: "CARACTERE_INVALIDO" }),
    );
  });
});

describe("gerarCnpj", () => {
  it("gera numéricos válidos de matriz por padrão", () => {
    for (let i = 0; i < 300; i++) {
      const cnpj = gerarCnpj();
      expect(cnpj).toMatch(/^\d{8}0001\d{2}$/);
      expect(validarCnpj(cnpj)).toBe(true);
    }
  });

  it("gera alfanuméricos válidos e com pelo menos uma letra", () => {
    for (let i = 0; i < 300; i++) {
      const cnpj = gerarCnpj({ alfanumerico: true });
      expect(ehCnpjAlfanumerico(cnpj)).toBe(true);
      expect(validarCnpj(cnpj)).toBe(true);
    }
  });

  it("respeita a ordem informada e a formatação", () => {
    const cnpj = gerarCnpj({ alfanumerico: true, ordem: "01DE", formatado: true });
    expect(cnpj).toMatch(/^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/01DE-\d{2}$/);
    expect(validarCnpj(cnpj)).toBe(true);
  });

  it("insiste até sair uma letra quando o pedido é alfanumérico", () => {
    // 8 sorteios caem em dígitos ("0"), depois a raiz inteira cai em "A".
    const valores = [...Array<number>(8).fill(0), ...Array<number>(8).fill(10 / 36)];
    let i = 0;
    const cnpj = gerarCnpj({ alfanumerico: true, aleatorio: () => valores[i++] ?? 0 });
    expect(cnpj.slice(0, 12)).toBe("AAAAAAAA0001");
    expect(validarCnpj(cnpj)).toBe(true);
  });

  it("recusa ordem inválida", () => {
    expect(() => gerarCnpj({ ordem: "01DE" })).toThrow(ErroDocumento);
    expect(() => gerarCnpj({ ordem: "001" })).toThrow(ErroDocumento);
    expect(() => gerarCnpj({ alfanumerico: true, ordem: "01-E" })).toThrow(ErroDocumento);
  });
});
