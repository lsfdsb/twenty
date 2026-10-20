---
slug: "dados/importar"
title: "Importar empresas e pessoas"
description: "Traga sua base com vínculos corretos e sem duplicação."
group: "Dados bem organizados"
---

## Prepare o arquivo
O importador aceita CSV e planilhas compatíveis. Use cabeçalhos claros e lotes com menos de 10 mil registros; para volumes maiores, divida o arquivo ou planeje a [API](/integracoes/api). Crie os campos personalizados antes da importação.

## Importe nesta ordem
1. Empresas.
2. Pessoas, relacionadas às empresas.
3. Oportunidades, relacionadas às empresas e pessoas.

Em **Empresas**, abra o menu de ações e escolha **Importar registros**. Baixe o arquivo de exemplo para conferir os nomes de colunas esperados pela sua versão.

## Revise o mapeamento
Associe cada coluna ao campo correto. Para domínio, use a parte URL com `https://empresa.example`. Para seleções, confira as opções e seus valores de API. Ignore colunas que não devem ser importadas.

## Valide antes de confirmar
Corrija as linhas destacadas pelo importador. Compare contagem, nomes, domínios e relações. Faça primeiro um lote pequeno; abra alguns registros e só então continue com o restante.

Não use pessoas da demonstração como destinatárias de campanhas. Os exemplos não representam clientes reais.
