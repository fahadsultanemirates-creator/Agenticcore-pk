#!/usr/bin/env bash
# Database tests on a LOCAL throwaway Postgres (never production):
#   V1 production catalogue (from git) → V1 history → pk_0004 + V2 seed + pk_0005 (7-day due dates) → assertions.
# Usage: PGHOST=/tmp/pg PGPORT=55432 PGUSER=postgres tests/db/run.sh
# Needs psql and a server you can create databases on. Applying twice must also pass (idempotency).
set -euo pipefail
cd "$(dirname "$0")/../.."
V1_REF="${V1_REF:-441920b}"
DB="${PK_TEST_DB:-pk_dbtest}"
M=supabase/migrations
PGOPTIONS="-c client_min_messages=warning" psql -qX -d postgres -c "drop database if exists $DB" -c "create database $DB" >/dev/null
run() { PGOPTIONS="-c client_min_messages=warning" psql -qX -v ON_ERROR_STOP=1 -d "$DB" "$@" >/dev/null; }
run -f tests/db/stubs.sql
run -f $M/pk_0001_init.sql
git show "$V1_REF:$M/pk_0002_seed_catalog.sql" | run
run -f $M/pk_0003_estate_listing_ownership.sql
run -f tests/db/v1_history.sql
for pass in 1 2; do                     # second pass proves the upgrade is re-runnable
  run -f $M/pk_0004_catalogue_v2.sql
  run -f $M/pk_0002_seed_catalog.sql
  run -f $M/pk_0005_seven_day_due.sql
done
psql -qX -v ON_ERROR_STOP=1 -d "$DB" -f tests/db/catalogue_v2.test.sql 2>&1 | grep -o 'catalogue_v2: .*'
psql -qX -v ON_ERROR_STOP=1 -d "$DB" -f tests/db/seven_day_due.test.sql 2>&1 | grep -o 'seven_day_due: .*'
psql -qX -d postgres -c "drop database $DB" >/dev/null
echo "DB tests OK"
