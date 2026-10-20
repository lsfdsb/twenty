# Enki guides and startup optimization — 2026-10-20

## Change

The initial workspace route graph eagerly included authenticated layouts and the full command executor. These modules now load when their route or command is used. Existing providers, authorization gates and route definitions remain in place.

Initial HTML-referenced assets decreased from **571 / 10,581,508 bytes** to **246 / 5,029,461 bytes**, measured from the previous and new production build directories. These are uncompressed referenced assets, not a browser load-time benchmark. Deferred modules still load when used.

User-facing copy, import branding, example links, community documentation and MCP setup use Enki. ChatGPT points to manual Enki MCP guidance rather than another vendor's official app. Protocol/package identifiers, third-party legal agreements and required copyright notices remain unchanged. Informational Enki privacy/platform pages replace vendor legal links without claiming an executed Enki DPA.

`packages/enki-docs` publishes 32 Portuguese guides, search, responsive navigation, legacy section redirects and licensing/source links at `docs.enki.now`. This is an editorial adaptation to the deployed Enki product, not a complete literal translation of all upstream developer manuals. It requires no paid documentation service or model calls.

## Database

A read-only PostgreSQL audit found no deadlocks and healthy existing indexes. Five SELECT 1 round-trips measured 6 ms each from this machine; these are not Vercel-to-database measurements. After restoring examples and ANALYZE, representative company/person/opportunity queries executed in 0.512–0.588 ms. Buffer hit ratio was 99.916%. First connection measured 1.216 s in the later sample; compute startup/network can vary.

Restored 5 native example companies, 5 people and 6 opportunities from the existing private backup, with example labels and no assigned demo owner. Existing IDs were skipped, existing records preserved, generated columns excluded, references checked and authentication row count unchanged. Each table already contained 2 rows; none were overwritten or removed. Private evidence records exactly which IDs were inserted. No real user's password or roles were changed.

No arbitrary indexes, global memory settings, instance size upgrades or connection-pool changes were introduced: the evidence did not justify them. Paid AI evaluations remain deferred.

## Validation before promotion

- Frontend production build, direct TypeScript check and scoped lint passed.
- MCP/Enki links/deferred command execution: 15 tests passed.
- Workspace routing and side-panel behavior: 38 tests passed.
- Docs links, search coverage, legacy routes and license/deployment constraints: 4 tests passed.
- Documentation desktop 1366×900 and mobile 390×844: search, guide navigation and mobile menu verified; no captured console warnings/errors.
- `docs.enki.now`: DNS/project ownership verified and HTTPS 200.

App promotion and public verification are recorded after completion. Rollback target before this release: `dpl_8zTieUTq1sqbVdHzw9LfNpCafM5Q` (static delivery release).

## Published and checked

- App source commit: `de65ab1e`.
- App deployment: `dpl_ZiGG5sF3UVpdjfkoTUxjEnsvW85S`, `https://enki-24mg5xm0t-enki-team.vercel.app`; promoted and explicitly assigned to `https://app.enki.now`.
- Docs deployment: `dpl_GiwiJdreQ16QP4ZUG4eYF4M1z431`, `https://enki-docs-gxx0moxbp-enki-team.vercel.app`; live at `https://docs.enki.now`.
- Candidate checked using authenticated Vercel CLI requests; no new temporary public bypass links created. Health 200, root 200/no-store, anonymous companies API 403, entry SHA-256 matches release.
- Public app: 257 initial/changed deferred/brand files matched the local release byte-for-byte; health 200, anonymous companies API 403, missing asset 404. Cold CDN requests are not compared with the previous warm-cache benchmark.
- Public login renders in Portuguese on desktop and mobile; email step advances to the password form without errors. No password was entered or changed. Authenticated CRM operations were not manually re-tested with the real administrator's session.
- Mobile DOM width/scroll width both 390 px at 844 px height; no horizontal overflow on login. Browser warning/error capture empty. Deployment error logs for the sampled last 10 minutes empty.
- All 32 public documentation guides returned 200; legacy links resolved, private environment/project paths and missing pages returned 404. Search, desktop/mobile layouts and navigation verified.
