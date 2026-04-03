# Release Notes

## v0.1.0 - Base operacional completa
Data: 2026-04-03

### Entregas
1. Cardapio dinamico com fallback local e integracao Supabase.
2. Painel admin com login, fila de pedidos, alteracao de status e texto de impressao.
3. CRUD de categorias/produtos com sincronizacao Supabase e fallback.
4. Upload de imagens de produtos com Supabase Storage e fallback local.
5. Captura de nome/telefone no checkout e propagacao no WhatsApp, ticket e admin.
6. Realtime de pedidos no admin + fallback polling.
7. Realtime de cardapio no cliente + controle de estabilidade para evitar cascata de atualizacoes.
8. Alerta de novo pedido no admin (visual pulsante + som leve com fallback).
9. Preparacao de deploy: runtime config, checklist de go-live e smoke test terminal.
10. Hardening inicial de RLS para producao.

### Arquivos-chave adicionados para operacao
- supabase/storage.sql
- supabase/rls_hardening.sql
- src/shared/runtimeConfig.js
- scripts/smoke-check.sh
- SMOKE_TEST.md
- DEPLOY.md

### Validacao da release
1. Smoke test executado sem FAIL.
2. Fluxos principais revisados e sem erros de compilacao.

### Pendencias para proxima release
1. Definir URL/chave de producao em src/shared/runtimeConfig.js.
2. Executar SQL de storage/RLS no projeto final Supabase.
3. Validacao manual ponta a ponta no ambiente de deploy publico.
