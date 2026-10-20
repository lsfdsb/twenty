---
slug: "integracoes/mcp"
title: "Conectar assistentes por MCP"
description: "Use o contexto da Enki em clientes compatíveis."
group: "Agentes e integrações"
---

## O que você conecta
O MCP permite que um cliente compatível acesse ferramentas e dados expostos pela Enki. Em **Configurações → Desenvolvedores**, consulte a configuração disponível para o seu workspace. Use o endereço mostrado pela sua instância, com HTTPS.

## Configuração manual
Um cliente que aceite configuração JSON pode usar este formato, quando o servidor MCP e a autenticação por chave estiverem habilitados:

```json
{
  "mcpServers": {
    "enki": {
      "url": "https://app.enki.now/mcp",
      "headers": { "Authorization": "Bearer <SUA_CHAVE_DE_API>" }
    }
  }
}
```

Crie uma chave com o menor acesso necessário e substitua o marcador apenas no cliente autorizado. Nunca publique a chave em documentação, prints ou repositórios.

## ChatGPT, Claude e outros clientes
Use o fluxo de conector personalizado do cliente quando disponível no seu plano. Cadastre nome **Enki** e a URL MCP da instância. O modo de autenticação aceito varia por cliente; copiar um arquivo JSON não configura todos eles.

A Enki não possui um aplicativo oficial de marketplace declarado por este guia. Não use um conector de outro fornecedor como se fosse uma integração Enki. Confira [a documentação do seu cliente](https://modelcontextprotocol.io/docs/learn/client-concepts) e a configuração oferecida no app.

## Revise antes de agir
Valide primeiro uma consulta de leitura. Depois teste alterações em registros de exemplo e confirme o resultado no app. Não conceda autorização ampla apenas para eliminar mensagens de permissão.
