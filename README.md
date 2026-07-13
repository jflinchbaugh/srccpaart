# SRCC Web Site

https://srccpaart.org/

## Prerequisites

* Install and build the site with [Hugo](https://gohugo.io/).
  ```
  hugo server
  ```
* Scripts run in `bash` and [Babashka](https://babashka.org/).

## Events

Events are created
by adding a YAML file
to `data/events/`
and uploading the image to `static/events/`.

Billboard/marquee images are created
by adding a YAML file
to `data/billboard/`
and upload the image to `static/billboard/`.

There's a babashka script that runs periodically
to sync events from Venue Pilot to this site:
`./update-event-images.bb`

The page is rebuilt every 5 minutes
on the server
to show changes
and additionally once nightly
to remove expired events
from the main page.

## Static Directories Consumed Directly by Apache

A directory under `static/` with no matching Hugo content page
returns Apache's default directory listing (`mod_autoindex`) instead
of a 404. Some of these listings are depended on directly by systems
outside this site.

**Before adding a `content/<name>/index.md` that matches an existing
`static/<name>/` directory, confirm nothing depends on the raw
directory listing at that path.** Once Hugo generates an
`index.html` there, Apache serves that instead of the listing,
silently breaking anything that was reading the listing directly.
This happened in July 2026: a `content/billboard/` page was added to
give `static/billboard/` an actual web page, which broke the
physical billboard/marquee display reading that directory listing.
The page was reverted.

Known or suspected external dependents:
* `static/billboard/` - the physical billboard/marquee display.
  Confirmed.
* `static/vp/` - possibly consumed the same way. Unconfirmed, treat
  as sensitive until verified otherwise.
* `static/events/`, `static/paypal/` - both already have a matching
  content page (`content/events/`, `content/paypal/`), predating
  this note. Presumed safe since they've worked this way for the
  life of the project, but never explicitly verified with whoever
  manages the server.

If you're unsure whether a `static/` directory has an external
consumer, ask before adding a content page at that path.

(`static/venuepilot-embed/` is a different case, also allow-listed
in `scripts/check-static-shadowing.py` but not an external-dependency
risk: it holds only a page-scoped `.htaccess`, added in the same
change as `content/venuepilot-embed/`, and no directory listing ever
existed there to depend on. See `ARCHITECTURE.md`'s "The VenuePilot
widget" section.)
