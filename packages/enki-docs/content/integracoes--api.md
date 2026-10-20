---
slug: "integracoes/api"
title: "API e webhooks"
description: "Integre sua operação com identificadores estáveis."
group: "Agentes e integrações"
---

## Comece pela documentação da instância
Em **Configurações → Desenvolvedores**, consulte as APIs disponíveis e crie uma chave quando autorizado. A estrutura dos objetos pode mudar entre workspaces; use os nomes de API e o esquema do seu ambiente.

## Uma consulta de leitura
Quando a API REST estiver habilitada, o formato básico de autenticação é:

```bash
curl 'https://app.enki.now/rest/companies'   --header 'Authorization: Bearer <SUA_CHAVE_DE_API>'
```

A consulta depende das permissões da chave. Use paginação para bases grandes. Para GraphQL, consulte o explorador e o esquema gerado da instância; não copie campos de outro ambiente sem verificar.

## Criação e atualização
Guarde o ID retornado ao criar um registro. Use esse ID nas próximas atualizações. Antes de repetir uma requisição que expirou, confira se o registro já existe. Esse cuidado evita duplicações.

## Webhooks
Configure eventos e o destino de recebimento. Valide a autenticidade conforme a configuração oferecida e processe eventos de forma idempotente. Registre o ID do evento, trate reenvios e responda rapidamente ao recebimento antes de executar trabalho demorado.

## Credenciais
Mantenha chaves no servidor ou no gerenciador de segredos da integração. Revogue chaves que não são mais usadas. O ID do workspace não substitui uma credencial nem autoriza acesso por conta própria.
