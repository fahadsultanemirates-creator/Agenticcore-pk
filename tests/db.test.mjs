// Database tests (local throwaway Postgres only). Skipped unless PK_TEST_PG=1 and
// PGHOST/PGPORT/PGUSER point at a server you may create databases on:
//   PK_TEST_PG=1 PGHOST=/tmp/pg PGPORT=55432 PGUSER=postgres node --test tests/*.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('V1 → V2 upgrade, service-74 id, pricing, ownership and 7-day due dates (Postgres)', { skip: process.env.PK_TEST_PG !== '1' && 'set PK_TEST_PG=1 to run against a local Postgres' }, () => {
  const out = execFileSync('bash', ['tests/db/run.sh'], { cwd: new URL('..', import.meta.url).pathname, encoding: 'utf8' });
  assert.match(out, /catalogue_v2: all checks passed/);
  assert.match(out, /seven_day_due: all checks passed/);
});
