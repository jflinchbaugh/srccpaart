# Architecture & Institutional Knowledge

This document captures non-obvious decisions and known quirks that
aren't visible just from reading the code - mostly learned the hard
way. See `README.md` for basic setup/usage.

## Stack

- **Hugo** (extended) generates a static site from `content/`,
  `data/`, and `layouts/`.
- **Apache** serves the built `public/` output. See "Static
  Directories Consumed Directly by Apache" in the README - this is
  load-bearing, not incidental.
- **Deployment**: an external cron job rebuilds the site every 5
  minutes and does a fuller rebuild nightly (to expire old events).
  There is no push-triggered deploy - merging to `main` does not
  immediately update the live site, only the next cron cycle does.
  CI (GitHub Actions) validates the build but does not deploy it.

## Content model

- **Events** come from three sources merged together:
  `data/events/art/`, `data/events/music/` (both manually curated),
  and `data/events/venuepilot/` (synced by `update-event-images.bb`
  from VenuePilot's API). All three use the same YAML shape
  (`title`, `date`, `image`, ...). `image` should be a path relative
  to `static/` with no leading slash (`events/foo.jpg`, not
  `/events/foo.jpg`) - the leading-slash form works by accident
  (Hugo tolerates the resulting double slash) but is inconsistent
  with the rest of the data.
- **`/events/`** ("Past Events") filters to `date < now` only -
  upcoming events are shown live by the VenuePilot widget on the
  homepage instead, not duplicated here. The filter result is
  independently re-validated at build time (see
  `layouts/partials/all-events.html`) - if a future-dated event ever
  renders there, the build fails loudly rather than silently
  shipping stale-looking content.
- **Billboard/marquee images** (`data/billboard/`,
  `static/billboard/`) are synced the same way but have **no Hugo
  page** - see the External Integrations section below. Most
  billboard YAML records point to already-pruned images (the
  billboard rotates; old images get deleted, the YAML records don't
  always get cleaned up with them). This is expected, not a bug -
  nothing renders this data, so a dangling record is inert.
- **Membership tiers** are four separate content pages
  (`content/membership-*/`) each with their own PayPal
  subscription/one-time URLs in front matter. They used to have
  opaque hash slugs (`/01544d/` etc.) - renamed to readable ones with
  `aliases` pointing back to the old slugs, so old shared links still
  resolve.

## Static Directories Consumed Directly by Apache

**Read the README section with this title before adding any
`content/<name>/index.md` that matches an existing
`static/<name>/` directory.** In short: Apache serves a plain
directory listing for any `static/` path with no matching Hugo page,
and at least one external system (the physical billboard/marquee
display) depends on that listing directly. Adding a Hugo page at
that path breaks it. This happened once (July 2026, reverted same
day) and there's now a CI check (`scripts/check-static-shadowing.py`)
that fails the build if it happens again to an unapproved path.

## The VenuePilot widget

The homepage embeds VenuePilot's ticketing widget, but not directly -
it's sandboxed in an iframe (as of July 2026) to stop the widget's
third-party code from contaminating the main document:

- `layouts/partials/venue-pilot.html` is just an `<iframe>` pointing
  at `/venuepilot-embed/`, plus a small script
  (`assets/js/venuepilot-iframe-resize.js`) that listens for a
  `postMessage` from that iframe and resizes it to fit.
- `/venuepilot-embed/` (`content/venuepilot-embed/index.md` +
  `layouts/_default/venuepilot-embed.html`) is a standalone page that
  actually hosts the widget's `<script>` tag. It's a real Hugo page,
  not `static/` content, so it's excluded from the sitemap and
  `noindex`ed - it's an implementation detail, not content. It's
  allow-listed in `scripts/check-static-shadowing.py`'s
  `ALLOWED_SHADOWS` for an unrelated reason: `static/venuepilot-embed/`
  holds only that page's scoped `.htaccess` (see below), not a
  directory listing anything depends on.
  `assets/js/venuepilot-embed.js` hides the skeleton loader once the
  widget populates its grid, and reports the embed page's height to
  the parent via `postMessage` on load and on `ResizeObserver`
  changes, since the widget's real height isn't known in advance.
- The iframe is same-origin (`/venuepilot-embed/` is served from this
  site's own domain, not a separate one) - it stops CSS bleed and
  lets the widget's `eval()` calls and CSP needs be scoped to just
  that one page instead of the whole site (see below), but it is
  **not** a full security boundary. A same-origin iframe can still
  read this site's cookies/localStorage and, without a `sandbox`
  attribute (none is set), isn't restricted from navigating the
  parent. If VenuePilot's widget is ever compromised, this still
  contains CSS/CSP blast radius but not a determined same-origin XSS.
  True isolation would need the embed page on a different origin -
  not done, since it'd need real infrastructure (a subdomain, CORS
  for the resize `postMessage`) for a third-party widget that hasn't
  shown signs of actually being compromised.
- The widget injects a global CSS reset (Tailwind-preflight-style)
  including an unscoped `body { font-family: ...; line-height: ...;
  margin: 0 }`. This used to require `!important` overrides on the
  main page's `body` rule and `overflow-x: hidden` to contain a
  ~10px horizontal overflow the widget's content caused - both
  removed once the widget moved to its own document, since neither
  can reach the main page anymore. (The `overflow-x: hidden` removal
  also exposed a real, unrelated, pre-existing bug: `body` had
  `width: 100%` plus non-zero `padding-left`/`padding-right` without
  `box-sizing: border-box`, which overflows by design in the standard
  CSS box model - that was the actual root cause of the ~10px, not
  the widget. Fixed by adding `box-sizing: border-box` to `body`.)
- It calls `eval()` internally (confirmed via the live site's
  console with the CSP in report-only mode) and loads an icon font
  via a `data:` URI. Because the widget now lives only on
  `/venuepilot-embed/`, `'unsafe-eval'` and the widget's third-party
  script/style/image/font sources are scoped to that one page's own
  policy (`static/venuepilot-embed/.htaccess`) instead of applying
  site-wide - see the comment there for why. The main site's CSP
  (`.htaccess` / `static/.htaccess`) no longer needs any
  VenuePilot-specific allowances at all. Don't add `'unsafe-eval'` to
  the *main* policy without reading the comment in
  `static/venuepilot-embed/.htaccess` first - the whole point of the
  iframe was to avoid needing that site-wide.
- Both CSPs are report-only and have no reporting endpoint configured
  - checking for new violations currently means manually opening the
  live site in a browser and reading the DevTools console, on both
  the homepage and `/venuepilot-embed/` directly.

## `screens.html`

A LAN-scanning tool (`/screens/`) used at the physical venue to find
Chromecast-like display devices on the local network. It's
intentional functionality, not a bug, despite scanning 255 IPs on a
hardcoded-by-convention subnet and hitting a real network. Its
backup-device IPs/labels live in `data/screens.yaml`, not hardcoded
in the JS, so updating them doesn't require a code change.

## Known open questions

These came up during a long improvement pass and were deliberately
left as open questions rather than guessed at:

- Does anything else depend on `static/vp/`'s directory listing the
  way the billboard display does? Unconfirmed either way - treat it
  as sensitive.
- Does anything embed this site in an iframe? `X-Frame-Options:
  SAMEORIGIN` was added assuming not, based only on a codebase
  search (the same kind of search that missed the billboard
  dependency) - not independently confirmed with whoever manages the
  server.
- Does the production server's Hugo resource cache
  (`resources/_gen`) persist between the 5-minute cron rebuilds? A
  cold build takes ~20s versus ~200ms warm - if the cache doesn't
  persist, every single cron cycle is paying the full cost
  unnecessarily.
- `data/billboard/`'s ~76 orphaned YAML records (pointing to
  already-deleted images) have never been pruned. Harmless since
  nothing renders them, but nobody's made a call on whether to clean
  them up.
