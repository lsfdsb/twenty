---
slug: "modelo-de-dados/campos"
title: "Campos personalizados"
description: "Adicione informação sem tornar o cadastro cansativo."
group: "Dados bem organizados"
---

## Criar um campo
1. Abra **Configurações → Modelo de dados**.
2. Selecione o objeto.
3. Adicione um campo e escolha o tipo.
4. Defina nome, descrição e opções aplicáveis.
5. Salve e inclua o campo nas visualizações relevantes.

## Escolha o tipo certo
Use texto para descrições, número para quantidades, moeda para valores, data para prazos, seleção para uma opção e seleção múltipla para várias. Use uma relação para apontar para outro registro.

## Rótulo e nome de API
O rótulo é mostrado às pessoas. O nome de API é usado por integrações e pode ser diferente. Mudanças em nomes, opções e tipos exigem revisão das importações e automações que dependem deles.

## Campos compostos
Endereço, telefone, e-mail e link podem ter partes separadas. No importador, mapeie a URL do domínio para a parte de URL, não para o rótulo. Faça o mesmo com cidade, estado e país.

Antes de tornar um campo obrigatório, confira os registros existentes e o fluxo de cadastro. A obrigatoriedade deve ajudar a operação, não incentivar preenchimentos fictícios.
