# Enki — documentação

Guias em português adaptados à instalação Enki. Fonte editorial em `content/`, assets em `public/` e geração estática em `build.mjs`. Não depende de serviço de documentação pago nem de chamadas a modelos.

Na raiz do repositório, com as dependências instaladas:

```sh
node packages/enki-docs/build.mjs
node --test packages/enki-docs/build.test.mjs
```

Publique o diretório `dist/` no projeto Vercel `enki-docs`, associado a `docs.enki.now`. Não publique arquivos `.env`, o checkout completo ou artefatos de banco. O build inclui redirects das seções antigas para guias equivalentes e os headers de segurança.

O guia é uma adaptação editorial, não uma tradução integral do manual upstream. O escopo é o produto Enki implantado; funcionalidades condicionais são identificadas. Créditos, licença aplicável e acesso ao código correspondente constam na página `licencas`. O material de origem permanece em `packages/twenty-docs` sob sua licença original.

Ao modificar um fluxo, revise o guia correspondente e rode os testes de links e busca. Não publique contratos de terceiros como acordos da Enki. Não prometa homologação de modelos, SSO, campanhas ou execução de código sem validar a configuração efetiva.
