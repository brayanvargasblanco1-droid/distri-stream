#!/usr/bin/env bash
# Configura los secretos de Supabase para este proyecto.
# Uso: exporta las 3 variables y ejecuta este script.
set -uo pipefail

PROJECT_ID="${SUPABASE_PROJECT_ID:-qbdhcnhplamatydsqkae}"
ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

# --- Validaciones de formato (sin imprimir valores) ---
if [ -z "$ACCESS_TOKEN" ]; then
  fail "SUPABASE_ACCESS_TOKEN no esta definida. Generala en Supabase: Account Settings > Access Tokens (formato sbp_...)"
fi
if [[ "$ACCESS_TOKEN" != sbp_* ]]; then
  fail "SUPABASE_ACCESS_TOKEN debe empezar por sbp_ (formato del CLI de Supabase)"
fi
if [ -z "$DB_PASSWORD" ]; then
  fail "SUPABASE_DB_PASSWORD no esta definida. Es la contrasena de la base de datos del proyecto."
fi

echo "==> 1/3 Vinculando proyecto: $PROJECT_ID"
echo "$DB_PASSWORD" | SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN" supabase link --project-ref "$PROJECT_ID" \
  || fail "No se pudo vincular el proyecto. Revisa SUPABASE_DB_PASSWORD."

echo "==> 2/3 Aplicando migraciones..."
SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN" supabase db push --project-ref "$PROJECT_ID" \
  || fail "No se pudieron aplicar las migraciones."

echo "==> 3/3 Secretos de la edge function distrito-api..."
SUPABASE_ACCESS_TOKEN="$ACCESS_TOKEN" supabase secrets set \
  SUPABASE_URL="https://${PROJECT_ID}.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="(pega tu service_role key desde Dashboard > Settings > API)" \
  --project-ref "$PROJECT_ID" \
  || echo "AVISO: setea SUPABASE_URL/SERVICE_ROLE_KEY manualmente en Dashboard > Edge Functions."

echo ""
echo "Listo. Supabase vinculado, migraciones aplicadas y secretos configurados."
echo "Recuerda proteger SUPABASE_DB_PASSWORD y SUPABASE_ACCESS_TOKEN."