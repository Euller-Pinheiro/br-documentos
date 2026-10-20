import { describe, expect, it } from "vitest";
import {
  calcularDvCpf,
  ErroDocumento,
  formatarCpf,
  gerarCpf,
  limparCpf,
  validarCpf,
} from "../src/index.js";

// CPFs fictícios, com dígitos verificadores corretos, usados em exemplos públicos.
const VALIDOS = ["52998224725", "11144477735", "12345678909"];

describe("limparCpf", () => {
  it("remove pontuação e espaços", () => {
    expect(limparCpf("529.982.247-25")).toBe("52998224725");
    expect(limparCpf(" 529 982 247 25 ")).toBe("52998224725");
  });
});

describe("calcularDvCpf", () => {
  it.each(VALIDOS)("calcula os DVs de %s", (cpf) => {
    expect(calcularDvCpf(cpf.slice(0, 9))).toBe(cpf.slice(9));
  });

  it("aceita a base com pontuação", () => {
    expect(calcularDvCpf("529.982.247")).toBe("25");
  });

  it("gera DV 0 quando o resto é menor que 2", () => {
    // 1º DV: soma 6 × 2 = 12 → resto 1 → DV 0
    expect(calcularDvCpf("000000006")).toBe("04");
  });

  it("recusa base com tamanho errado ou com letras", () => {
    expect(() => calcularDvCpf("12345678")).toThrow(ErroDocumento);
    expect(() => calcularDvCpf("12345678A")).toThrow(ErroDocumento);
  });
});

describe("validarCpf", () => {
  it.each(VALIDOS)("aceita %s sem pontuação", (cpf) => {
    expect(validarCpf(cpf)).toBe(true);
  });

  it("aceita com pontuação", () => {
    expect(validarCpf("529.982.247-25")).toBe(true);
  });

  it("recusa dígito verificador errado", () => {
    expect(validarCpf("52998224724")).toBe(false);
    expect(validarCpf("52998224715")).toBe(false);
  });

  it.each(["00000000000", "11111111111", "999.999.999-99"])(
    "recusa sequência repetida %s",
    (cpf) => {
      expect(validarCpf(cpf)).toBe(false);
    },
  );

  it.each(["", "5299822472", "529982247250", "529.982.247-2a", "529/982/247-25"])(
    "recusa entrada malformada %j",
    (cpf) => {
      expect(validarCpf(cpf)).toBe(false);
    },
  );
});

describe("formatarCpf", () => {
  it("formata no padrão 000.000.000-00", () => {
    expect(formatarCpf("52998224725")).toBe("529.982.247-25");
  });

  it("é idempotente", () => {
    expect(formatarCpf("529.982.247-25")).toBe("529.982.247-25");
  });

  it("preserva zeros à esquerda", () => {
    expect(formatarCpf("00000000191")).toBe("000.000.001-91");
  });

  it("lança TAMANHO_INVALIDO para tamanho errado", () => {
    expect(() => formatarCpf("123")).toThrow(
      expect.objectContaining({ codigo: "TAMANHO_INVALIDO" }),
    );
  });

  it("lança CARACTERE_INVALIDO para letras", () => {
    expect(() => formatarCpf("529.982.247-2X")).toThrow(
      expect.objectContaining({ codigo: "CARACTERE_INVALIDO" }),
    );
  });
});

describe("gerarCpf", () => {
  it("gera CPFs válidos", () => {
    for (let i = 0; i < 500; i++) {
      expect(validarCpf(gerarCpf())).toBe(true);
    }
  });

  it("gera formatado quando pedido", () => {
    expect(gerarCpf({ formatado: true })).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
  });

  it("é determinístico com gerador injetado", () => {
    const sequencia = [0.5, 0.2, 0.9, 0.9, 0.8, 0.2, 0.2, 0.4, 0.7];
    let i = 0;
    const aleatorio = () => sequencia[i++ % sequencia.length] ?? 0;
    expect(gerarCpf({ aleatorio })).toBe("52998224725");
  });

  it("nunca devolve sequência repetida", () => {
    // Gerador que primeiro produz 000000000 e depois uma base válida.
    const valores = [...Array<number>(9).fill(0), 0.5, 0.2, 0.9, 0.9, 0.8, 0.2, 0.2, 0.4, 0.7];
    let i = 0;
    const aleatorio = () => valores[i++] ?? 0;
    expect(gerarCpf({ aleatorio })).toBe("52998224725");
  });
});
