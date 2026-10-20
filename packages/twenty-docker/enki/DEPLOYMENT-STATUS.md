# Enki release status — 2026-10-20

The release candidate passed native authentication, CRM writes/relations, S3 upload/read, bootstrap artifact checksums, SMTP, native invitations and password-reset delivery. Public domain promotion and browser validation of the final domain are the remaining release gates.

## Scope and resources

The release pins Twenty 2.49.0 and applies Enki branding. It runs on the existing Enki Vercel Pro team with Neon Free, Upstash Free and Resend Free plus the configured AWS/S3 bucket. No new paid Redis plan or automatic upgrade was enabled. Vercel and S3 remain usage-billed. The website widget and paid AI evaluations are not part of this release.

Schema parity matched 116 tables and 3,094 normalized definitions, including the two additive maintenance tables. Local PostgreSQL is 16.13 and Neon is 18.6; schema parity does not imply identical database engines or server parameters. The designated initial administrator is configured privately. Native example companies/people/opportunities were removed with a private backup. Temporary email accounts and invitations were removed after verification.

## Verified evidence

- Native sign-in and workspace token exchange succeeded; unauthenticated CRM access was rejected.
- Company, person and opportunity creation/read/relationships/deletion succeeded through the native API.
- Native file creation, upload, workspace-logo completion and signed download succeeded against S3 using current request OIDC credentials.
- Seven standard logic/dependency artifacts were migrated with SHA-256 verification. The migration route is omitted from the final deployment template.
- SMTP, native invitation and password-reset emails reached Resend's provider test sink with delivered events. Invitation recovery and immediate notification were both exercised.
- The private service binding executed native maintenance; unauthenticated recovery returned 401. The 31 enabled native schedules have PostgreSQL cursors and leases.
- Server regressions: 61 passing tests plus two cold-start registration tests. Runtime/idle-policy checks: eight passing tests. Redis recovery: two passing tests. Server types, changed-file lint and matching frontend/backend builds passed.
- Startup ingress regression checks cover queued requests during native boot, preserved identity/host/body/cookies, native startup failure and process exit. The ingress binds before Nest initialization and never reports healthy until the native endpoint answers.
- Desktop and mobile local screenshots were captured; public-domain screenshots remain a post-promotion gate.

## Explicit limitations

Native Twenty disables logic-function and code-interpreter execution in production unless an isolated executor is configured. The supplied automatic “Create company when adding a new person” example hit this restriction during qualification and was deactivated through the native API. The failure remains recorded in qualification evidence. Do not enable unsafe local code execution to hide this restriction. Ordinary CRM and email functionality is verified; workflows containing code require a separately configured isolated executor. Paid model evaluations and AI-provider enablement remain deferred.

On-demand processing uses at-least-once notifications, not exactly-once execution. Required business idempotency still applies. Arbitrary imports, connected inbox workloads and jobs exceeding the 800-second request bound are not certified by these checks. Free-tier suitability depends on actual usage; the idle policy reduces baseline consumption but does not guarantee all customer workloads fit free quotas.

## Release procedure

Publish `enki/production-2.49` with corresponding source, set the final SERVER_URL, deploy without ENKI_QUEUE_PIN_CURRENT and without the migration handler, validate the final deployment, then move app.enki.now while retaining the old deployment as a rollback target. Verify public HTTPS, login, desktop/mobile, queue recovery, maintenance and runtime logs after promotion.

Keep environment files, bootstrap passwords, private logs, SQL backups and tokens outside Git and the deployment bundle. No temporary test identity should remain at handoff.
