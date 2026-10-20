---
slug: "integracoes/aplicativos"
title: "Aplicativos e extensões"
description: "Estenda a Enki sem perder a coerência dos dados."
group: "Agentes e integrações"
---

## Antes de instalar
Revise quem publica o aplicativo, as permissões solicitadas e os objetos que ele cria ou altera. Disponibilidade no catálogo não implica aprovação pela Enki. Teste em um ambiente separado antes de usar dados reais.

## Modelo principal
Pessoas, empresas, oportunidades, notas e tarefas formam a base do CRM. Extensões devem aproveitar esses registros e suas relações. Não remova a aplicação que fornece os objetos principais para tentar ocultar campos; configure a exibição e as permissões.

## Desenvolver uma extensão
O fork mantém compatibilidade com o SDK e os nomes técnicos dos pacotes de origem. Use a versão compatível com o servidor e consulte o código correspondente antes de publicar. A documentação da interface usa a marca Enki; nomes de dependências e comandos técnicos não devem ser substituídos por pacotes inexistentes.

## Validação
Teste instalação, atualização, permissões e remoção. Confira se os dados permanecem íntegros e se a extensão depende de execução de código isolada, indisponível nesta configuração. Não presuma que um aplicativo de outra instalação funcionará sem ajustes.

[Consulte o código e as licenças](/licencas) ou use a [API](/integracoes/api) para uma integração externa.
