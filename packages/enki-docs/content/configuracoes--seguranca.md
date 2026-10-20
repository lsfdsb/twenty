---
slug: "configuracoes/seguranca"
title: "Segurança e operação"
description: "Cuidados concretos com acesso, dados e integrações."
group: "Administração"
---

## Acesso
Use contas individuais, senhas exclusivas e autenticação adicional quando habilitada. Links de convite e recuperação não devem ser compartilhados. Nenhum atendente precisa da sua senha para analisar um erro.

## Dados
Evite armazenar segredos em notas, anexos ou campos de CRM. Defina responsáveis por importações, exportações e permissões. Revise quem pode instalar aplicativos e criar chaves de API.

## Operação técnica
Nesta instalação, o app usa serviços na Vercel, PostgreSQL no Neon e processamento de filas sob demanda. Anexos e e-mail transacional usam serviços próprios configurados para essa função. Esses componentes possuem limites independentes.

## Diagnóstico
Ao reportar uma falha, inclua horário, página, ação tentada e ID do registro ou execução. Remova tokens, senhas e dados pessoais desnecessários das capturas. Um erro de acesso deve ser investigado sem ampliar permissões indiscriminadamente.

## Continuidade
Mantenha procedimentos de backup, restauração e rollback documentados e teste sua execução. Uma cópia de exemplo ou um deploy anterior não substitui a recuperação de dados de produção.
