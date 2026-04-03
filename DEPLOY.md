# Green Camp - Go-Live Checklist

## 1) Banco e dados (Supabase)
1. Execute `supabase/schema.sql` no SQL Editor.
2. Execute `supabase/seed.sql` para dados iniciais.
3. Execute `supabase/storage.sql` para bucket e policies de imagens.
4. Execute `supabase/rls_hardening.sql` para endurecer policies de producao.
5. Em Database > Replication, habilite realtime para `orders`, `categories` e `products`.

## 2) Auth e acesso admin
1. Em Authentication > Users, crie o usuario admin real (email/senha).
2. No admin, valide login com esse usuario.
3. Nao usar modo local para producao.

## 3) Configuracao do frontend estatico
1. Edite `src/shared/runtimeConfig.js` com:
   - `window.GREENCAMP_SUPABASE_URL`
   - `window.GREENCAMP_SUPABASE_ANON_KEY`
2. Faça deploy dos arquivos estaticos em Cloudflare Pages, Netlify ou Vercel.
3. URL publica deve conter:
   - cardapio em `index.html`
   - admin em `admin/index.html`

## 4) Validacao funcional (10 minutos)
0. Rode o roteiro de smoke test em `SMOKE_TEST.md`.
1. Abra o cardapio em 2 abas/dispositivos.
2. Abra `admin/index.html` e altere um produto (nome/preco/disponibilidade).
3. Confirme que os cardapios abertos atualizam automaticamente.
4. Crie um pedido no cardapio.
5. Confirme no admin:
   - novo pedido apareceu
   - alerta visual de novo pedido apareceu
   - mudanca de status persiste apos atualizar a pagina
6. Faça upload de imagem de produto no admin e valide exibicao no cardapio.

## 5) Checklist de seguranca minima
1. Revise RLS para evitar leitura ampla de dados administrativos.
2. Mantenha apenas policies publicas necessarias para leitura de cardapio e envio de pedido.
3. Restrinja operacoes de escrita (catalogo, status, imagens) para usuarios autenticados.

## 6) Critério de pronto para producao
1. Admin loga com usuario real do Supabase.
2. CRUD de categorias/produtos funciona e replica no cardapio.
3. Pedidos chegam no admin em tempo real.
4. Fluxo de imagem funciona via Storage.
5. Sistema continua funcional em fallback local se Supabase ficar indisponivel.

## 7) Operacao de release
1. Atualize `RELEASE_NOTES.md` com o resumo da versao publicada.
2. Use `RELEASE_TEMPLATE.md` para padronizar validacao, risco e rollback de cada release.

## 8) Semaforo de publicacao
1. Verifique `DEPLOY_STATUS.md` antes de publicar.
2. Execute handoff operacional em `HANDOFF.md` para validar monitoramento da primeira semana.
