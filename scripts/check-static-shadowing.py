#!/usr/bin/env python3
"""Guard against silently shadowing a static/ directory's Apache
directory listing with a Hugo content page. See README's "Static
Directories Consumed Directly by Apache" section for why this
matters - it broke the live billboard display in July 2026.
"""
import os
import sys

# Directories where a content page is known to coexist safely with
# the static/ directory of the same name - confirmed (or presumed,
# for long-standing pre-existing pages) that nothing external reads
# the raw directory listing there. Add to this list only after
# confirming with whoever manages the server that nothing depends on
# the raw directory listing at that path.
ALLOWED_SHADOWS = {"events", "paypal"}


def subdirs(base):
    return {
        d
        for d in os.listdir(base)
        if os.path.isdir(os.path.join(base, d)) and not d.startswith(".")
    }


static_dirs = subdirs("static")
content_dirs = {
    d
    for d in subdirs("content")
    if os.path.exists(os.path.join("content", d, "index.md"))
}

shadowed = static_dirs & content_dirs
unapproved = shadowed - ALLOWED_SHADOWS

if unapproved:
    print("Found content page(s) shadowing a static/ directory's Apache directory listing:")
    for d in sorted(unapproved):
        print(f"  - content/{d}/index.md shadows static/{d}/")
    print()
    print("This can silently break anything reading that directory listing directly")
    print("(it broke the live billboard display in July 2026 - see README's")
    print("'Static Directories Consumed Directly by Apache' section).")
    print()
    print("If you've confirmed with whoever manages the server that nothing external")
    print("depends on that directory listing, add it to ALLOWED_SHADOWS in this script.")
    sys.exit(1)

print("No unapproved content/static directory shadowing found.")
