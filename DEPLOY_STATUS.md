# Deploy Status

## Estado atual
- Projeto: Green Camp
- Data base: 2026-04-03
- Smoke check padrao: PASS (sem FAIL)
- Smoke check estrito: FAIL (faltam credenciais de producao no runtimeConfig)

## Bloqueadores atuais
1. `src/shared/runtimeConfig.js` ainda sem `GREENCAMP_SUPABASE_URL` de producao.
2. `src/shared/runtimeConfig.js` ainda sem `GREENCAMP_SUPABASE_ANON_KEY` de producao.

## Gatilho objetivo para deploy
Faça o deploy quando TODOS os itens abaixo estiverem concluídos:

1. Runtime configurado em `src/shared/runtimeConfig.js`:
- `window.GREENCAMP_SUPABASE_URL` preenchida
- `window.GREENCAMP_SUPABASE_ANON_KEY` preenchida

2. SQL aplicado no Supabase (ordem):
- `supabase/schema.sql`
- `supabase/seed.sql`
- `supabase/storage.sql`
- `supabase/rls_hardening.sql`

3. Realtime habilitado para tabelas:
- `orders`
- `categories`
- `products`

4. Conta admin real criada em Supabase Auth e login validado em `admin/index.html`.

5. Smoke test estrito sem FAIL:

```bash
bash scripts/smoke-check.sh --strict
```

6. Validacao manual curta concluida (SMOKE_TEST.md).

## Regra de decisao
- Se qualquer item acima estiver pendente: NAO publicar.
- Se todos estiverem completos: PUBLICAR.

## Observacao
Este arquivo serve como semaforo de deploy para evitar publicacao incompleta.
