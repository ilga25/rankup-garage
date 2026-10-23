# RankUp Garage

Multilingual Rocket League training planner and monthly community achievement wall.

## Runtime

The existing Sites deployment uses a dependency-free Cloudflare Worker with an R2 binding named `BUCKET`. Browser assets are authored under `web/`. API source is `worker/api.mjs`. Run `node scripts/build.mjs` to embed the assets and API into `dist/server/index.js`. The tracked hosting manifest owns the existing Site identity. The deployment archive must contain `.openai/hosting.json` and `dist/`.

The static site has been migrated to a Worker because shared achievements require server-side persistence. Moving the repository to GitHub remains possible; a Vercel-only static deployment would not provide these APIs or the R2 storage. Preserve or migrate that backend before moving hosting.

## Monthly community achievements

Players sign in through Sites and select “I ranked up” to publish a nickname, platform, playlist, previous rank, new rank, achieved-on date and optional short note. Publication requires an explicit checkbox. Posts are labelled as self-reported; no external account lookup, rank synchronization, editorial verification, MMR scoring or competitive leaderboard remains. Steam users can enter a nickname rather than a SteamID.

The API uses `achievements-v1/YYYY-MM/<hashed-site-user-id>.json` in R2. Each player's month is updated using conditional writes to avoid losing concurrent posts. Calendar months use the supplied achievement date, validated against UTC today and the October 2026 launch month. The wall sorts by achievement date, newest first, with independent playlist and month filters. Users can delete only their own posts; identity comes from dispatch-owned headers. Per-user duplicate checks and a 20-post monthly limit prevent accidental repeated submissions. Public API responses omit owner identifiers and expose only whether a post belongs to the current viewer. The latest 100 matching posts are displayed with totals.

Only the nickname/platform are reused from legacy profiles as form defaults. Old measurement data stays private and is not used or exposed by the new API. The review UI and old measurement/leaderboard endpoints have been removed, and the reviewer runtime secret is no longer needed.

## Checks

`node tests/community.test.mjs` covers input validation, publication consent, authentication, ownership, duplicate submissions, monthly limits, conditional-write retry, filters and removal of the old endpoints. `node scripts/build.mjs` builds the deployment.

The public frontend is hosted at https://rankup-garage.github.io/. Search Console ownership is verified. AdSense ownership metadata is present; review has been requested, with no approval claimed.

## Selected training resources

`web/lessons.js` contains eight specific video references and nineteen training packs, with creator names and source links. Each lesson includes practice instructions in Spanish, English, French and Portuguese. The curated videos are in English and are labelled accordingly. Videos open in an embedded YouTube privacy-enhanced player on click, with a direct original-video fallback. No generic YouTube searches remain. Training packs run inside Rocket League; they cannot be played inside a browser. Sources were consulted on 2026-10-23; in-game code availability and external player playback are not verified from this environment.

The Wall Shots lesson deliberately uses a pack and written drill instead of inventing a preview video. The pack summary is derived from the currently selected lessons, and 1v1 defense uses shadow-defense material rather than a teammate rotation tutorial.

## Library, account and practice journal

`web/growth.js` provides a searchable 19-pack library, skill and suggested-level filters, and browser-local favorites. The existing rank routes now include at least three packs per skill. Suggested levels are editorial guidance, not official requirements.

The account panel uses dispatch-owned ChatGPT sign-in and displays the authenticated account email only to that visitor. It does not implement an independent email/password or email-magic-link service. Email is not stored with public posts or practice sessions.

The practice journal stores timestamped sessions in `progress-v1/YYYY-MM/<hashed-site-user-id>.json`, with minutes, attempts, successes, playlist, skill and notes. Sessions are private by default; publication requires an explicit checkbox. `/api/progress` returns only the current visitor’s private sessions and the community’s explicitly shared sessions. Deletion is owner-scoped. Totals describe self-reported practice, not verified game results.

Three promotional carousels and the competitor review are separate export artifacts in `/workspace/promo-rankup-garage`. They are not bundled into the Worker. Public access is enabled. Independent email authentication is not implemented; sign-in remains with Sites.

## GitHub Pages and the community server

The branded frontend is generated in `docs/` and deployed by the Publish RankUp Garage workflow in `rankup-garage/rankup-garage.github.io`. That workflow checks out this public personal source repository and runs `RANKUP_PAGES_ORIGIN=https://rankup-garage.github.io RANKUP_PAGES_PREFIX='' node scripts/build-pages.mjs`. Trigger that workflow after source updates. The previous personal Pages address redirects to the branded hostname. The Sites Worker remains the account and data server. Pages makes credential-free, read-only requests through `/api/public/`; that gateway strips identity headers and cannot return private journal entries or accept writes. Signing in or publishing a listing opens the original authenticated Sites application.

Run `node --test tests/community.test.mjs tests/teammates.test.mjs`, `node scripts/build.mjs` and `node scripts/build-pages.mjs` after edits. Deploy the brand workflow after source changes. Do not replace the redirect documents at the old personal Pages address with duplicate content. Repositories contain source and public media only; player records remain in R2 and are never committed.

## Find teammates

The four-language teammate board filters by playlist, rank, region and language. Listings require sign-in and explicit consent to publish a game handle, platform, availability and goal. Each account has one listing, expiring after seven days. Only the owner can replace or withdraw it. Rank is self-reported. The public gateway does not disclose owner hashes or account email.

## Search and monetization status

The canonical public site is https://rankup-garage.github.io/. It has a separate verified Search Console URL-prefix property and its own sitemap.xml submission. Google live inspection confirms the home page is accessible and indexable; indexing was requested, not confirmed. The sitemap report initially says could not fetch and requires follow-up. AdSense ca-pub-2632653491273997 has a separate verified entry for rankup-garage.github.io with review requested. ads.txt and ownership metadata are generated; no advertising approval is claimed. The original Sites backend remains independent and live.
