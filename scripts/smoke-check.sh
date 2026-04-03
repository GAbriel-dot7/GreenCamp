#!/usr/bin/env bash
set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRICT=0

if [[ "${1:-}" == "--strict" ]]; then
  STRICT=1
fi

pass_count=0
warn_count=0
fail_count=0

pass() {
  echo "[PASS] $1"
  pass_count=$((pass_count + 1))
}

warn() {
  echo "[WARN] $1"
  warn_count=$((warn_count + 1))
}

fail() {
  echo "[FAIL] $1"
  fail_count=$((fail_count + 1))
}

check_file_exists() {
  local file="$1"
  if [[ -f "$ROOT_DIR/$file" ]]; then
    pass "Arquivo presente: $file"
  else
    fail "Arquivo ausente: $file"
  fi
}

check_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"

  if grep -q "$pattern" "$ROOT_DIR/$file"; then
    pass "$label"
  else
    fail "$label"
  fi
}

echo "Green Camp smoke check"
echo "Workspace: $ROOT_DIR"

check_file_exists "index.html"
check_file_exists "admin/index.html"
check_file_exists "src/shared/runtimeConfig.js"
check_file_exists "supabase/schema.sql"
check_file_exists "supabase/seed.sql"
check_file_exists "supabase/storage.sql"
check_file_exists "supabase/rls_hardening.sql"
check_file_exists "DEPLOY.md"

check_contains "index.html" "src/shared/runtimeConfig.js" "index.html carrega runtimeConfig.js"
check_contains "admin/index.html" "../src/shared/runtimeConfig.js" "admin/index.html carrega runtimeConfig.js"
check_contains "admin/index.html" "newOrderAlert" "admin possui alerta de novo pedido"
check_contains "index.html" "setupMenuLiveUpdates" "cliente possui atualizacao live de cardapio"
check_contains "admin/index.html" "setupOrdersLiveUpdates" "admin possui atualizacao live de pedidos"

if grep -q "GREENCAMP_SUPABASE_URL = window.GREENCAMP_SUPABASE_URL || ''" "$ROOT_DIR/src/shared/runtimeConfig.js"; then
  if [[ "$STRICT" -eq 1 ]]; then
    fail "runtimeConfig ainda sem URL de producao (modo strict)"
  else
    warn "runtimeConfig ainda sem URL de producao"
  fi
else
  pass "runtimeConfig com URL definida"
fi

if grep -q "GREENCAMP_SUPABASE_ANON_KEY = window.GREENCAMP_SUPABASE_ANON_KEY || ''" "$ROOT_DIR/src/shared/runtimeConfig.js"; then
  if [[ "$STRICT" -eq 1 ]]; then
    fail "runtimeConfig ainda sem ANON KEY de producao (modo strict)"
  else
    warn "runtimeConfig ainda sem ANON KEY de producao"
  fi
else
  pass "runtimeConfig com ANON KEY definida"
fi

echo ""
echo "Resumo: PASS=$pass_count WARN=$warn_count FAIL=$fail_count"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi

exit 0
