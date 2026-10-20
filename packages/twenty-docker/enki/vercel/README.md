# Enki on Vercel — Twenty 2.49.0

The native application and database are pinned to Twenty 2.49.0 (`6d04b32aa97522fcfadb65b1ff5361287a13f2b3`). The release branch is `enki/production-2.49`. Preserve AGPL notices and publish the corresponding source before assigning the public domain. See `../DEPLOYMENT-STATUS.md` for the release decision and `../qualification.json` for measured evidence.

## Runtime and routing

The deployment has five explicitly declared services: the native web container, a private worker container, a queue callback, a maintenance endpoint and a recovery endpoint. Every Node service needs an explicit entrypoint; a successful container build alone does not prove the queue functions exist. The queue consumer uses the SDK's Web Request/Response handler, compatible with a standalone Node entrypoint.

Only the web service and authenticated cron endpoints have public rewrites. The worker is invoked over a service binding, with a short-lived HMAC signature, a fixed path and an allowlisted queue name. No HTTP endpoint accepts arbitrary job code or payloads. Cron endpoints require `CRON_SECRET`. Queue callbacks use the Vercel Queue SDK protocol. Keep deployment protection enabled while qualifying candidates.

The official Twenty image and Node dependency stage are pinned by digest. Build the matching frontend and server, then run `scripts/prepare-vercel-bundle.mjs` with a new destination outside the source tree. Its allowlist excludes environment files, backups, local users, secrets, node_modules and source maps. Apply the additive `schema/001-on-demand-maintenance.sql` migration explicitly; application startup never runs database migrations.

## Durable business jobs

BullMQ remains the job store and preserves native processors, priorities, progress, retries and delays. A durable job is committed before a Vercel Queues wake notification containing only its queue name. Immediate jobs normalize BullMQ's absent delay to zero. Workers fetch for at most 30 seconds, await active work and schedule another notification if necessary. Recovery scans every five minutes for waiting, prioritized, due delayed and abandoned active work.

Notifications are delivered at least once; native business operations still need their existing idempotency controls. Container and callback requests are bounded at 800 seconds. Work lasting longer, interrupted external side effects and workloads beyond the tested CRM/email flows require separate qualification.

Production notifications follow the current deployment. `ENKI_QUEUE_PIN_CURRENT=true` is reserved for protected qualification candidates and must not be present in the final release. Redis jobs remain recoverable after a deployment changes. Retire failed qualification deployments after the new worker has drained their durable jobs so obsolete pinned callbacks do not keep retrying.

## Native maintenance without permanent polling

The adapter registers native cron definitions and executes their existing handlers with PostgreSQL leases and per-schedule success cursors. It adds two tables under `enki_runtime`, without changing native entity schemas. Failed executions retain their cursor for retry; concurrent ticks cannot claim an active lease. Registration fails closed if a native schedule is unsupported. Marketplace registration does not enqueue another initial sync on every worker cold start; its native hourly schedule remains active.

A lightweight Redis check runs each minute. User activity keeps maintenance at native minute-level frequency for 15 minutes. Connected accounts, scheduled workflows/functions/agents and pending wake-ups keep it continuous even without users online. An installation without those workloads coalesces housekeeping into a 30-minute sweep, allowing Neon to suspend. Missing, malformed or expired policy state causes maintenance to run. Business jobs still wake immediately, independently of this idle policy. Health checks distinguish active and idle maintenance freshness and require recovery plus queue progress.

## Cost boundaries

The owner authorized existing Vercel Pro resources and free Neon, Upstash and Resend plans; no additional paid Redis plan or automatic upgrade is authorized. Upstash eviction and automatic upgrades are disabled.

Measured isolated Redis results:

- 26 registered on-demand queue drivers: zero commands over 35 seconds without work.
- Empty recovery: two server commands, projecting to 17,280 per 30 days at five-minute intervals.
- A no-op business task: 80 commands; ten tasks in one drain: 443. These are not provider invoices and exclude startup/application work.
- Native maintenance was exercised with real PostgreSQL and Redis; all 31 enabled registrations executed in the probe. The earlier BullMQ recurring-task estimate (82 commands per execution) motivated moving static maintenance to PostgreSQL and does not describe the new scheduler.

There is no guarantee that arbitrary customer workloads fit free quotas. Connected accounts and scheduled automations can keep Neon awake. Vercel containers/Queues and S3 are usage-billed; existing Pro credits do not make all usage free. Monitor provider usage before enabling intensive sync, bulk imports or long-running automation. Free email is currently limited to 3,000/month and 100/day.

## Identity, files and email

Vercel supplies fresh OIDC identity on each request. AsyncLocalStorage isolates concurrent web and worker identities; the gateway forwards its current identity over the authenticated binding. AWS credentials are exchanged per request. Never store a pulled development OIDC token or permanent AWS keys in production.

Native upload and completion mutations, S3 write/read and the application's signed download route were verified on Vercel. Direct S3 presigned URLs are not enabled. The seven native bootstrap logic/dependency artifacts were migrated to the same workspace/application paths with SHA-256 verification. The one-off migration handler and its assets must never be included in the final bundle.

Resend Free is provisioned through Vercel Marketplace. `mail.enki.now` is verified. Native SMTP uses TLS on port 465 with `Enki <conta@mail.enki.now>`. Provider test recipients proved SMTP delivery and a full native invitation through durable Redis, Vercel Queue, private worker and SMTP. No customer addresses are used for qualification. Password reset and invitation permissions continue to use native Twenty guards and tokens.

## Release checks

Run native server types, lint, queue/scheduler/context/health regression tests, runtime mapping tests and the real-Redis recovery tests. Validate the new deployment's entrypoints, unauthorized cron rejection, signed private binding, queue delivery and recovery. Test login, CRM writes/relations, file upload/download and desktop/mobile. Remove only identified test fixtures, preserve the real administrator, then set `SERVER_URL=https://app.enki.now` and switch the domain after the gates pass. Record the previous deployment for rollback.

The `enki.now` website widget and paid model evaluations remain outside this release.

## Primary references

- https://vercel.com/docs/services/config-reference
- https://vercel.com/docs/services/bindings
- https://vercel.com/docs/queues/sdk
- https://vercel.com/docs/functions/runtimes/container
- https://upstash.com/pricing/redis
- https://neon.com/pricing
- https://resend.com/pricing
