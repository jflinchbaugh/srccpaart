# Contributing

See `README.md` for prerequisites and `ARCHITECTURE.md` for
non-obvious design decisions - read that one before touching
anything under `static/` or the VenuePilot widget integration.

## Before pushing

There's no staging environment - a merge to `main` goes live via the
next 5-minute cron cycle (see `ARCHITECTURE.md`). CI catches build
failures and a few specific known regression classes, but it can't
catch everything (it wouldn't have caught the July 2026 billboard
incident on its own - that needed a human to actually look at the
page). Before pushing something non-trivial:

1. **Run the site locally and actually look at it**: `hugo server -D`,
   then open the pages you touched in a browser. Don't just trust
   that the build succeeded.
2. **Run the validation scripts** the same way CI does:
   ```
   pip install -r scripts/requirements.txt
   python3 scripts/validate-data.py
   python3 scripts/test_check_static_shadowing.py
   python3 scripts/check-static-shadowing.py
   python3 scripts/check-security-txt-freshness.py
   ```
3. **If you're adding a `content/<name>/index.md`**, check whether
   `static/<name>/` already exists. If it does, read the README's
   "Static Directories Consumed Directly by Apache" section and
   confirm with whoever manages the server before proceeding -
   `scripts/check-static-shadowing.py` will fail CI on this anyway,
   but it's better to know why before you hit that wall.
4. **If you're touching the VenuePilot widget integration or the CSP
   header**, re-check the live site's browser console for new CSP
   violations after deploying - the policy is report-only
   specifically so this doesn't break anything, but violations are
   currently only visible by manually checking (see
   `ARCHITECTURE.md`'s open questions).

## What CI actually checks

- `data/events/**/*.yaml` and `data/billboard/*.yaml` have their
  required fields and a parseable date.
- No new `content/<name>/index.md` shadows a `static/<name>/`
  directory without being explicitly allow-listed.
- `security.txt`'s `Expires` date isn't stale or approaching (weekly
  check, independent of pushes).
- The Hugo build succeeds, references no missing images, and
  produces a sane amount of output (page count, event count,
  non-empty stylesheet).
- External links get checked weekly, separately from the build (see
  `.github/workflows/link-check.yml`).

CI does **not** deploy anything, verify the live site actually
updated, or catch every possible regression - see point 1 above.
