import { describe, expect, it } from "vitest";
import {
  calcularDvCnpj,
  ehCnpjAlfanumerico,
  ErroDocumento,
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
