---
slug: "automacoes/acoes"
title: "Ações, condições e formulários"
description: "Construa fluxos fáceis de entender e revisar."
group: "Conexões e automações"
---

## Ações sobre dados
Buscar, criar, atualizar e excluir registros são ações diferentes. Prefira buscar o registro e verificar a condição antes de alterar. Para integrações, use identificadores estáveis e trate reenvios para evitar duplicações.

## Condições e iterações
Use filtros para permitir que apenas os casos relevantes avancem. Ramificações separam caminhos. Iteradores processam listas; teste com listas vazias, um item e vários itens. Nomeie as etapas pela ação de negócio.

## Formulário
Uma ação de formulário coleta informação de uma pessoa durante a execução. Defina campos claros e valide o resultado antes de usá-lo em etapas posteriores. Um formulário pode ajudar a solicitar uma decisão, mas o controle de autorização deve continuar nas permissões e nas ações do fluxo.

## E-mail e HTTP
Envio de e-mail depende de um canal configurado. Uma chamada HTTP envia dados ao destino definido; revise destinatário, credenciais e campos antes de ativá-la. Não grave tokens em campos visíveis ou notas.

## IA e código
Ações com modelos dependem de credenciais e disponibilidade. Saídas de IA precisam de validação antes de produzir efeitos externos. Código personalizado exige infraestrutura isolada e não está habilitado na configuração atual da Enki.
