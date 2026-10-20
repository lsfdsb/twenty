---
slug: "modelo-de-dados"
title: "Modelo de dados"
description: "Objetos, campos e registros: a estrutura da sua operação."
group: "Dados bem organizados"
---

## Três conceitos
| Conceito | O que significa | Exemplo |
| --- | --- | --- |
| Objeto | Categoria de informação | Empresas |
| Campo | Propriedade do objeto | Segmento |
| Registro | Uma entrada na categoria | Uma empresa cadastrada |

A Enki tem objetos de pessoas, empresas, oportunidades, notas e tarefas. Você pode estender a estrutura com campos e objetos personalizados.

## Campo ou objeto?
Use um campo para uma característica, como porte ou tipo de cliente. Crie um objeto quando o conceito tiver atributos, relações e vida próprios, como contratos ou projetos. Evite campos numerados como “Contrato 1” e “Contrato 2”; uma relação permite vários contratos por empresa.

## Onde configurar
Em **Configurações → Modelo de dados**, abra o objeto para consultar seus campos. O acesso depende das permissões do seu papel. Comece com uma estrutura pequena e expanda conforme o uso mostrar uma necessidade real.

## Preserve os objetos principais
A sincronização de e-mails e calendário usa os objetos principais de pessoas, empresas e oportunidades. Para distinguir parceiros de clientes, prefira um campo de tipo e visualizações filtradas, em vez de duplicar o objeto Pessoas.

[Crie campos](/modelo-de-dados/campos) ou [organize relações](/modelo-de-dados/relacoes).
