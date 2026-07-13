#!/usr/bin/env python3
"""Fail CI once static/.well-known/security.txt's Expires date is
getting close, so it doesn't silently lapse. RFC 9116 recommends
keeping this file's Expires date current and not too far in the
future (a year out is typical).
"""
import re
import sys
from datetime import datetime, timedelta, timezone

WARNING_WINDOW_DAYS = 30
PATH = "static/.well-known/security.txt"

with open(PATH) as fh:
    content = fh.read()

match = re.search(r"^Expires:\s*(.+)$", content, re.MULTILINE)
if not match:
    print(f"{PATH}: no Expires field found")
    sys.exit(1)

raw = match.group(1).strip()
try:
    expires = datetime.strptime(raw, "%Y-%m-%dT%H:%M:%S.%fZ").replace(tzinfo=timezone.utc)
except ValueError:
    print(f"{PATH}: could not parse Expires date '{raw}' (expected RFC 3339, e.g. 2027-07-13T00:00:00.000Z)")
    sys.exit(1)

now = datetime.now(timezone.utc)
days_left = (expires - now).days

if expires <= now:
    print(f"{PATH}: Expires date {raw} is in the past - update it.")
    sys.exit(1)

if days_left <= WARNING_WINDOW_DAYS:
    print(f"{PATH}: Expires date {raw} is only {days_left} day(s) away - update it soon.")
    sys.exit(1)

print(f"{PATH}: Expires date {raw} is {days_left} day(s) away, OK.")
