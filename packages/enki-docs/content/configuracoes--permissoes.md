---
slug: "configuracoes/permissoes"
title: "Papéis e permissões"
description: "Controle o que pessoas, agentes e integrações podem fazer."
group: "Administração"
---

## Configure por responsabilidade
Em **Configurações → Membros → Papéis**, revise os papéis disponíveis. Defina acesso a objetos, campos e configurações conforme os controles habilitados na instância.

## Separe capacidades
Leitura, criação, edição e exclusão são capacidades diferentes. Um usuário que acompanha uma carteira pode não precisar excluir empresas. Uma integração de relatórios normalmente precisa apenas de leitura.

## Valide o resultado
Teste a visualização e a alteração dos registros com um usuário de cada papel. Inclua campos sensíveis, APIs e agentes na revisão. Esconder um botão ou uma coluna não é uma barreira de autorização.

## Workspaces
O workspace organiza o ambiente de acesso. Um campo “organização”, um grupo comercial ou uma empresa no CRM não cria isolamento entre clientes. Integrações devem utilizar a credencial e o contexto corretos de cada ambiente.

## Recursos adicionais
SSO e controles avançados dependem da configuração e das funcionalidades disponíveis. Não habilite um fluxo de autenticação sem validar login, recuperação e saída de usuários existentes.
