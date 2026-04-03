# Smoke Test Final (Passo a Passo)

## 1) Checagem rapida por terminal
1. Rode:

```bash
bash scripts/smoke-check.sh
```

2. Para validacao estrita antes de producao (falha se runtimeConfig estiver vazio):

```bash
bash scripts/smoke-check.sh --strict
```

## 2) Checagem funcional manual (5-10 min)
1. Abra o cardapio em duas abas/dispositivos.
2. Abra o admin e faca login real do Supabase.
3. Edite um produto no admin (nome/preco/disponibilidade).
4. Confirme atualizacao do cardapio nas abas abertas (realtime/polling fallback).
5. Crie um pedido no cardapio com nome e telefone.
6. Confirme no admin:
   - pedido aparece na lista;
   - alerta de novo pedido aparece;
   - status muda e persiste apos reload.
7. Faça upload de imagem no admin e confirme exibicao no cardapio.

## 3) Critério de aprovacao
1. Script smoke-check sem FAIL.
2. Fluxo funcional completo validado.
3. Nenhum erro critico no console durante o fluxo.
