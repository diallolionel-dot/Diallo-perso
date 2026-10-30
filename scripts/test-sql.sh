#!/usr/bin/env bash
# Applique la migration sur une base Postgres jetable puis exécute les tests de sécurité.
# Usage : PGURL=postgres://postgres@localhost:5432/postgres ./scripts/test-sql.sh
set -euo pipefail

PGURL="${PGURL:?Définir PGURL vers un serveur Postgres local (une base temporaire y sera créée)}"
DB="diallo_sql_test_$$"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

psql "$PGURL" -v ON_ERROR_STOP=1 -q -c "create database $DB"
trap 'psql "$PGURL" -q -c "drop database if exists $DB" >/dev/null' EXIT

# \connect réutilise l'hôte, le port et l'utilisateur de PGURL.
{
  echo "\\connect $DB"
  cat "$ROOT/supabase/tests/00_supabase_stubs.sql" \
    "$ROOT"/supabase/migrations/*.sql \
    "$ROOT"/supabase/tests/0[1-9]_*.sql
} | psql "$PGURL" -v ON_ERROR_STOP=1 -q -t 2>&1 | grep -E "OK|ÉCHEC|RÉUSSI|ERROR" | sed "s/^.*NOTICE:  //"
