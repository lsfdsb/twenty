---
slug: "automacoes/execucoes"
title: "Execuções e falhas"
description: "Saiba o que ocorreu antes de tentar novamente."
group: "Conexões e automações"
---

## Leia a execução
Abra o histórico do workflow e selecione a execução. Confira o gatilho, a versão utilizada, a etapa em que parou e a mensagem de erro. Diferencie falha de autorização, dado inválido, limite do provedor e indisponibilidade temporária.

## Antes de repetir
Verifique quais etapas já produziram efeitos. Repetir uma execução pode criar outro registro ou reenviar uma mensagem se o fluxo não tratar duplicidade. Use IDs externos e operações idempotentes nas integrações.

## Versões
Mudanças devem ser salvas e testadas antes de publicação. Anote o motivo da alteração e use um caso representativo para comparar o comportamento. Uma execução iniciada em uma versão anterior pode ter contexto diferente da configuração que você vê agora.

## Processamento sob demanda
Nesta instalação, filas despertam quando há trabalho e possuem rotinas de recuperação. A fila não deve ser confundida com execução instantânea. Se houver atraso persistente, informe horário, workflow e ID da execução ao administrador, sem incluir credenciais.
