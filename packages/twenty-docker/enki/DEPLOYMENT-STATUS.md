# Enki release status — 2026-10-20

Published at https://app.enki.now on 2026-10-20. The current production deployment is `dpl_78jjEcZehPB8BkKqy5G9kgNxQZ3t`, built from application source commit `d0108162`. The preceding release, `dpl_6Qh31Fjgi5EZD1XRsGyXJLTN5yJu` (`1709d676`), remains the rollback target. Native authentication, CRM writes/relations, S3 upload/read, bootstrap artifact checksums, SMTP, invitations, password-reset delivery and public desktop/mobile browser checks passed during the initial release. Its native admin health check reported database, Redis, worker, connected-account infrastructure and application as operational; no external mailbox has been connected.

## Access and email follow-up

The follow-up fixes expired password-link handling, visible startup progress and an initial locale-activation race. It applies Enki's shared logo, palette, buttons and footer to all 13 transactional email templates, preserving actual workspace and sender names. The five-minute, single-use password-reset policy is unchanged. An expired or rejected link now offers a new-link form rather than redirecting to an unrelated permission warning.

- Fourteen targeted frontend tests passed, including first render with no active locale and slow-loading recovery; frontend types and changed-file lint passed.
- Thirty-six backend cache/routing checks passed. Only content-hashed public frontend assets receive immutable caching; HTML remains `no-store`.
- Twenty-nine email rendering/branding checks passed across English and Brazilian Portuguese. The native worker delivered a branded password email to the provider test sink; its link was validated, consumed by the disposable test identity and then rejected on reuse. The temporary identity was removed. The real administrator's password was not changed.
- The email compilation output is explicitly included in both deployment allowlists and runtime images. The backend and email artifacts in the final candidate match the artifacts qualified by the delivery and password-lifecycle checks.
- Candidate `dpl_2AXZjA7UZk3C2QQx5eYNP3CAM98Z` was temporarily published, then rolled back after public cold-load verification exposed translation before locale activation. Regression coverage now reproduces that state; the final candidate passed initial loading without that console error.
- After final promotion and explicit domain assignment, public root and health returned 200, the HTML referenced the expected `index-IDqoCpIJ.js`, the email logo matched its source SHA-256, and unauthenticated CRM access returned 403.
- Public login and expired-link recovery rendered at 1280-pixel desktop and 390 × 844 mobile viewport widths. Browser checks showed no console errors in these flows and no horizontal overflow in the mobile login. These are viewport checks, not physical-device Safari certification.
- Screenshots and redacted operational evidence are retained outside the source repository. Temporary candidate share links are revoked after verification. The administrator's fresh access email is requested only after final publication checks; provider delivery is recorded privately.

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
- Server regressions: 61 passing tests plus two cold-start registration tests and two push-publication tests. Runtime/idle-policy/startup checks: eleven passing tests. Redis recovery: two passing tests. Server types, changed-file lint and matching frontend/backend builds passed.
- Startup ingress regression checks cover queued requests during native boot, preserved identity/host/body/cookies, native startup failure and process exit. The ingress binds before Nest initialization and never reports healthy until the native endpoint answers.
- Public HTTPS, authenticated companies and settings were checked at desktop and 390 × 844 mobile viewport sizes. These are browser viewport checks, not physical-device Safari certification.
- After the final promotion, native sign-in and CRM create/read/relationships/delete passed again. The provider confirmed delivery of a new native invitation. A new S3 upload and signed download matched the original 1,698,580-byte asset by SHA-256, and the temporary logo/invitation were removed.
- Automatic maintenance and queue recovery returned 204/200; worker drains returned 204. The identified disposable QA workflow failure was archived using metadata only and removed from the failed queue; historical native metrics were retained. No customer job was removed.
- Six obsolete qualification deployments were retired, including the temporary bootstrap-file migration route. The prior application deployment remains available for rollback.

## Explicit limitations

Native Twenty disables logic-function and code-interpreter execution in production unless an isolated executor is configured. The supplied automatic “Create company when adding a new person” example hit this restriction during qualification and was deactivated through the native API. The failure remains recorded in qualification evidence. Do not enable unsafe local code execution to hide this restriction. Ordinary CRM and email functionality is verified; workflows containing code require a separately configured isolated executor. Paid model evaluations and AI-provider enablement remain deferred.

On-demand processing uses at-least-once notifications, not exactly-once execution. Required business idempotency still applies. Arbitrary imports, connected inbox workloads and jobs exceeding the 800-second request bound are not certified by these checks. Free-tier suitability depends on actual usage; the idle policy reduces baseline consumption but does not guarantee all customer workloads fit free quotas. Native cold initialization can still take tens of seconds; the startup ingress prevents the platform's short TCP-listen timeout from aborting it but does not eliminate that latency.

## Release procedure

Publish `enki/production-2.49` with corresponding source, set the final SERVER_URL, deploy without the migration handler, validate the final deployment, then move app.enki.now while retaining the old deployment as a rollback target. Push notifications remain deployment-scoped; durable Redis jobs are recovered on the current deployment. Verify public HTTPS, login, desktop/mobile, queue recovery, maintenance and runtime logs after promotion.

Keep environment files, bootstrap passwords, private logs, SQL backups and tokens outside Git and the deployment bundle. No temporary test identity should remain at handoff.
