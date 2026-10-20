---
slug: "modelo-de-dados/relacoes"
title: "Relações e grupos empresariais"
description: "Conecte empresas, pessoas e estruturas maiores."
group: "Dados bem organizados"
---

## Uma relação liga registros
Uma pessoa pode estar ligada a uma empresa, e uma empresa pode reunir várias pessoas. Configure relações no modelo de dados e escolha a cardinalidade adequada para o processo.

## Modelar um grupo empresarial
1. Crie o objeto **Grupos empresariais** com nome e identificadores relevantes.
2. Em Empresas, adicione uma relação com esse objeto.
3. Configure um grupo para várias empresas.
4. Associe as empresas existentes ao grupo correto.
5. Crie uma visualização agrupada por grupo para acompanhar a carteira.

Esse é um modelo de configuração; a documentação não cria esses objetos automaticamente.

## Muitos para muitos
Quando uma pessoa ou entidade precisa participar de várias relações com informações próprias, use um objeto intermediário. Por exemplo, “Participações” pode ligar pessoa e empresa, guardando cargo e período naquela relação.

## Organização e autorização são distintas
Um grupo empresarial dentro do CRM não é um workspace nem cria isolamento de acesso. A separação de ambientes e o controle de papéis continuam nas configurações de acesso. Não use uma relação comercial como substituta de autorização.
