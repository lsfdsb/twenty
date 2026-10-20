BEGIN;

CREATE SCHEMA IF NOT EXISTS enki_runtime;

CREATE TABLE IF NOT EXISTS enki_runtime.maintenance_schedule (
  key text PRIMARY KEY,
  pattern text NOT NULL,
  "lastSuccessAt" timestamptz NOT NULL,
  "lastStartedAt" timestamptz,
  "leaseToken" uuid,
  "leaseUntil" timestamptz,
  "consecutiveFailures" integer NOT NULL DEFAULT 0 CHECK ("consecutiveFailures" >= 0),
  "lastError" text,
  CHECK (("leaseToken" IS NULL) = ("leaseUntil" IS NULL))
);

CREATE TABLE IF NOT EXISTS enki_runtime.maintenance_health (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  "lastSuccessAt" timestamptz NOT NULL
);

REVOKE ALL ON SCHEMA enki_runtime FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA enki_runtime FROM PUBLIC;

COMMIT;
