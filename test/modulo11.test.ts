import { describe, expect, it } from "vitest";
import { dvModulo11, sortear, todosIguais } from "../src/internal/modulo11.js";

describe("dvModulo11", () => {
  it("devolve 11 − resto quando o resto é 2 ou mais", () => {
    // soma = 1*2 + 2*3 = 8 → resto 8 → DV 3
    expect(dvModulo11([1, 2], [2, 3])).toBe(3);
  });

  it("devolve 0 quando o resto é 0 ou 1", () => {
    expect(dvModulo11([0, 0], [2, 3])).toBe(0); // resto 0
    expect(dvModulo11([6], [2])).toBe(0); // 12 → resto 1
  });

  it("recusa valores e pesos de tamanhos diferentes", () => {
    expect(() => dvModulo11([1, 2], [2])).toThrow(RangeError);
  });
});

describe("todosIguais", () => {
  it("detecta sequências repetidas", () => {
    expect(todosIguais("11111111111")).toBe(true);
    expect(todosIguais("11111111112")).toBe(false);
    expect(todosIguais("")).toBe(false);
  });
});

describe("sortear", () => {
  it("usa o gerador para escolher a posição", () => {
    expect(sortear("ABC", () => 0)).toBe("A");
    expect(sortear("ABC", () => 0.5)).toBe("B");
    expect(sortear("ABC", () => 0.9999)).toBe("C");
  });

  it("não estoura o alfabeto se o gerador devolver 1", () => {
    expect(sortear("ABC", () => 1)).toBe("C");
  });

  it("recusa alfabeto vazio", () => {
    expect(() => sortear("", () => 0)).toThrow(RangeError);
  });
});
