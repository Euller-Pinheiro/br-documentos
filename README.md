# br-documentos

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-C9A84C)
![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-green)

**[English below](#english)**

Biblioteca em **TypeScript**, sem dependências, para as regras que todo sistema brasileiro precisa acertar: validar e formatar CPF e CNPJ — incluindo o **CNPJ alfanumérico** que a Receita Federal adota a partir de 2026 —, ler e converter boletos e gerar o PIX copia-e-cola.

## Por que este projeto

Cada sistema reescreve essas regras do seu jeito, e é comum errar nos casos de borda: CPF com todos os dígitos iguais, CNPJ com letras, boleto de arrecadação, fator de vencimento que reiniciou em 2025. Aqui cada regra é implementada uma vez, com testes e com a fonte oficial citada.

## O que está a caminho

O projeto está sendo construído em entregas pequenas, cada uma com testes e CI. Acompanhe pelos commits e pull requests.

- [ ] CPF e CNPJ: validar, formatar, limpar e gerar números para teste — com o CNPJ alfanumérico
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

Zero-dependency TypeScript library for Brazilian documents: CPF, CNPJ (including the new alphanumeric CNPJ), bank slips (boleto) and PIX copy-and-paste codes. Fully tested. Work in progress — built in small, tested increments. Licensed under [MIT](LICENSE).
