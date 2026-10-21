# br-documentos

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-C9A84C)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

**[English below](#english)**

Biblioteca em **TypeScript**, sem dependências, para as regras que todo sistema brasileiro precisa acertar: validar e formatar CPF e CNPJ — incluindo o **CNPJ alfanumérico** que a Receita Federal adota a partir de 2026 —, ler e converter boletos e gerar o PIX copia-e-cola.

## Por que este projeto

Cada sistema reescreve essas regras do seu jeito, e é comum errar nos casos de borda: CPF com todos os dígitos iguais, CNPJ com letras, boleto de arrecadação, fator de vencimento que reiniciou em 2025. Aqui cada regra é implementada uma vez, com testes e com a fonte oficial citada.

## Instalação

O pacote ainda não está publicado no npm. Para usar agora, clone e gere o build:

```bash
git clone https://github.com/Euller-Pinheiro/br-documentos.git
cd br-documentos
npm ci
npm run build   # gera dist/ com JavaScript (ESM) e tipos .d.ts
```

Requer Node.js 20 ou mais novo. Não há dependências de runtime.

## CPF

```ts
import { validarCpf, formatarCpf, limparCpf, gerarCpf, calcularDvCpf } from "br-documentos";

validarCpf("529.982.247-25"); // true
validarCpf("111.111.111-11"); // false — sequência repetida
formatarCpf("52998224725");   // "529.982.247-25"
limparCpf("529.982.247-25");  // "52998224725"
calcularDvCpf("529982247");   // "25"
gerarCpf({ formatado: true }); // ex.: "384.019.552-70" (só para testes!)
```

### Como o dígito verificador do CPF é calculado

Os dois últimos dígitos do CPF são **dígitos verificadores (DV)**: servem para pegar erros de digitação.

1. Multiplique os 9 primeiros dígitos pelos pesos **10, 9, 8, …, 2** e some.
2. Calcule o resto da divisão da soma por 11. Se o resto for **0 ou 1**, o DV é **0**; senão, é **11 − resto**.
3. Para o 2º DV, repita com os 9 dígitos **mais o 1º DV**, usando os pesos **11, 10, …, 2**.

Exemplo com `529.982.247`: a soma é 5·10 + 2·9 + 9·8 + 9·7 + 8·6 + 2·5 + 2·4 + 4·3 + 7·2 = 295; 295 mod 11 = 9; DV₁ = 11 − 9 = **2**. Repetindo com `5299822472` e pesos 11…2, sai DV₂ = **5** → `529.982.247-25`.

**Por que recusar 111.111.111-11?** Sequências de dígitos iguais passam no cálculo, mas a Receita não as emite. Toda biblioteca séria precisa tratar esse caso à parte.

## CNPJ (numérico e alfanumérico)

```ts
import {
  validarCnpj, formatarCnpj, limparCnpj, gerarCnpj,
  calcularDvCnpj, ehCnpjAlfanumerico, valorCaractereCnpj,
} from "br-documentos";

validarCnpj("11.222.333/0001-81");   // true — numérico, como sempre foi
validarCnpj("12.ABC.345/01DE-35");   // true — alfanumérico
validarCnpj("12.abc.345/01de-35");   // true — minúsculas são normalizadas
validarCnpj("12.ABC.345/01DE-3A");   // false — DV é sempre numérico
formatarCnpj("12abc34501de35");      // "12.ABC.345/01DE-35"
limparCnpj("12.abc.345/01de-35");    // "12ABC34501DE35"
calcularDvCnpj("12ABC34501DE");      // "35"
ehCnpjAlfanumerico("12ABC34501DE35"); // true
gerarCnpj({ alfanumerico: true, formatado: true }); // ex.: "0I.Q9D.7ZI/0001-36" (só para testes!)
```

### O que mudou: o CNPJ alfanumérico

Os CNPJs numéricos estavam se esgotando. A **Instrução Normativa RFB nº 2.229, de 15 de outubro de 2024**, criou o CNPJ alfanumérico, emitido para **novas inscrições a partir de julho de 2026**:

```
 1 2 . A B C . 3 4 5 / 0 1 D E - 3 5
 └──── raiz (8) ───┘ └ordem(4)┘  └DV┘
 posições 1–12: letras A–Z ou dígitos     posições 13–14: sempre dígitos
```

- As **12 primeiras posições** (raiz + ordem do estabelecimento) aceitam **letras maiúsculas A–Z e dígitos**.
- Os **2 dígitos verificadores continuam numéricos**.
- **CNPJs já emitidos não mudam.** O sistema precisa aceitar os dois formatos ao mesmo tempo.

### Como o DV do CNPJ é calculado (vale para os dois formatos)

1. Converta cada caractere em número: **código ASCII − 48**. Dígitos continuam valendo 0–9; letras passam a valer A = 17, B = 18, …, Z = 42.
2. Multiplique as 12 posições pelos pesos **5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2** (de 2 a 9, da direita para a esquerda, recomeçando) e some.
3. Resto da divisão por 11: se for **0 ou 1**, DV = **0**; senão, DV = **11 − resto**.
4. Para o 2º DV, inclua o 1º DV no fim e use os pesos **6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2**.

Exemplo oficial, `12ABC34501DE`:

| Caractere | 1 | 2 | A  | B  | C  | 3 | 4 | 5 | 0 | 1 | D  | E  |
|-----------|---|---|----|----|----|---|---|---|---|---|----|----|
| Valor     | 1 | 2 | 17 | 18 | 19 | 3 | 4 | 5 | 0 | 1 | 20 | 21 |
| Peso      | 5 | 4 | 3  | 2  | 9  | 8 | 7 | 6 | 5 | 4 | 3  | 2  |

Soma = 459; 459 mod 11 = 8; DV₁ = 11 − 8 = **3**. Com o 3 no fim e os pesos do 2º DV, a soma é 424; 424 mod 11 = 6; DV₂ = **5**. Resultado: **12.ABC.345/01DE-35**.

Repare no truque: como `"0"` tem código ASCII 48, **ASCII − 48 dá exatamente o valor do dígito**. Por isso o cálculo novo é idêntico ao antigo para CNPJs só com números — e é por isso que uma única função atende os dois formatos.

### O que costuma quebrar em sistemas antigos

- Coluna do banco como `BIGINT`/`NUMERIC` ou máscara que só aceita dígitos: precisa virar texto (`CHAR(14)`).
- Código que faz `replace(/\D/g, "")` para "limpar" o CNPJ: **apaga as letras**. Aqui, `limparCnpj` remove só a pontuação.
- Comparação sensível a maiúsculas/minúsculas: normalize para maiúsculas antes de gravar ou comparar.

### Fontes oficiais

- Receita Federal — Instrução Normativa RFB nº 2.229, de 15 de outubro de 2024 (DOU de 16/10/2024), que altera a IN RFB nº 2.119/2022 e cria o CNPJ alfanumérico. Consulte o texto no [portal de normas da Receita](http://normas.receita.fazenda.gov.br/).
- Receita Federal — [Perguntas e respostas sobre o CNPJ alfanumérico (PDF)](https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/cnpj/cnpj-alfanumerico.pdf).
- Serpro — [Cálculo do DV do CNPJ alfanumérico (PDF)](https://serpro.gov.br/menu/noticias/videos/calculodvcnpjalfanaumerico.pdf), de onde vem o exemplo `12.ABC.345/01DE-35`.

## Erros

As funções `validar*` **nunca lançam exceção**: devolvem `true` ou `false`. As demais (`formatar*`, `calcularDv*`, `gerarCnpj` com `ordem` inválida) lançam `ErroDocumento`, que traz um `codigo` para tratar sem depender do texto da mensagem:

```ts
import { formatarCpf, ErroDocumento } from "br-documentos";

try {
  formatarCpf("123");
} catch (erro) {
  if (erro instanceof ErroDocumento && erro.codigo === "TAMANHO_INVALIDO") {
    // mostrar "CPF incompleto" ao usuário
  }
}
```

| Código               | Quando                                                      |
|----------------------|-------------------------------------------------------------|
| `TAMANHO_INVALIDO`   | Quantidade de dígitos/posições errada (ou letra no DV do CNPJ) |
| `CARACTERE_INVALIDO` | Símbolo fora de dígitos, letras (CNPJ) e pontuação usual     |

## Gerar números para teste

`gerarCpf` e `gerarCnpj` produzem números **matematicamente válidos** para preencher bancos de teste e formulários de homologação. Eles podem coincidir com documentos reais: **nunca use para identificar pessoas ou empresas**. Para testes determinísticos, injete a fonte de aleatoriedade:

```ts
let semente = 42;
const aleatorio = () => ((semente = (semente * 16807) % 2147483647) / 2147483647);
gerarCnpj({ alfanumerico: true, aleatorio }); // sempre "0IQ9D7ZI000136"
```

## Desenvolvimento

```bash
npm ci
npm run lint       # ESLint com regras que usam os tipos
npm run typecheck  # tsc --noEmit em modo estrito
npm test           # Vitest
npm run check      # os três acima
```

O CI roda lint, type-check, testes e build em Node 20, 22 e 24 a cada pull request.

## Roadmap

- [x] CPF e CNPJ: validar, formatar, limpar e gerar números para teste — com o CNPJ alfanumérico
- [ ] Boleto: linha digitável ↔ código de barras, dígitos verificadores (bancário e arrecadação), valor e vencimento
- [ ] PIX copia-e-cola (BR Code): gerar com CRC16 e ler
- [ ] CEP e telefone

## Tecnologias

TypeScript · Vitest · ESLint · GitHub Actions

## Autor

**Euller Pinheiro**, Diretor Técnico da [ESX Tecnologia](https://esxtecnologia.com) — desenvolvimento de sistemas, infraestrutura e TI gerenciada em São Paulo.

---

<a name="english"></a>
## English

Zero-dependency TypeScript library for Brazilian documents: CPF, CNPJ (including the new alphanumeric CNPJ), bank slips (boleto) and PIX copy-and-paste codes. Work in progress — built in small, tested increments. Licensed under [MIT](LICENSE).

**Available now:** validate, format, clean and generate (test-only) CPF and CNPJ numbers. The alphanumeric CNPJ (Receita Federal, IN RFB 2,229/2024, issued from July 2026) allows `A–Z` in the first 12 positions; check digits stay numeric and are computed with mod 11 using each character's `ASCII code − 48`, which keeps the old numeric CNPJ results unchanged.

```ts
validarCnpj("12.ABC.345/01DE-35"); // true
validarCpf("529.982.247-25");      // true
```
