# Handoff Operacional

## O que ja esta pronto
1. Cardapio e admin com integracao Supabase e fallback local.
2. Realtime para pedidos no admin.
3. Realtime para alteracoes de cardapio no cliente (com fallback polling).
4. Alerta de novo pedido no admin (visual + tentativa de som).
5. Script de smoke test e documentacao de deploy/release.

## Dependencias de ambiente para producao
1. Runtime config preenchido em `src/shared/runtimeConfig.js`.
2. SQL de schema/seed/storage/rls aplicado no projeto Supabase final.
3. Realtime habilitado no Supabase.
4. Usuario admin real criado no Auth.

## Primeira semana (monitoramento)
1. Confirmar que pedidos novos chegam no admin em tempo real durante horarios de pico.
2. Validar que alteracoes de cardapio no admin aparecem no cliente sem recarga manual.
3. Monitorar falhas de upload de imagem e URL invalida.
4. Revisar erros no console do navegador em cardapio e admin apos cada ajuste operacional.

## Rotina de release
1. Atualizar `RELEASE_NOTES.md`.
2. Rodar `bash scripts/smoke-check.sh`.
3. Em pre-producao, rodar `bash scripts/smoke-check.sh --strict`.
4. Executar validacao manual de `SMOKE_TEST.md`.
5. Publicar apenas com semaforo verde em `DEPLOY_STATUS.md`.
