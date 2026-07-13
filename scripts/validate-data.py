#!/usr/bin/env python3
"""Validate data/events/**/*.yaml and data/billboard/*.yaml have the
required fields the templates depend on. A missing/malformed 'date'
in particular will break the Hugo build entirely (time.AsTime on a
nil value), so this catches that class of problem before it reaches
Hugo at all.
"""
import glob
import re
import sys

import yaml

errors = []


def check_file(path, required_fields):
    with open(path) as fh:
        try:
            data = yaml.safe_load(fh)
        except yaml.YAMLError as e:
            errors.append(f"{path}: invalid YAML: {e}")
            return
    if not isinstance(data, dict):
        errors.append(f"{path}: expected a mapping at the top level")
        return
    for field in required_fields:
        if not data.get(field):
            errors.append(f"{path}: missing required field '{field}'")
    date = data.get("date")
    if date is not None and not re.match(r"^\d{4}-\d{2}-\d{2}$", str(date)):
        errors.append(f"{path}: date '{date}' is not in YYYY-MM-DD format")


for f in glob.glob("data/events/**/*.yaml", recursive=True):
    check_file(f, ("title", "date", "image"))

for f in glob.glob("data/billboard/*.yaml"):
    check_file(f, ("href",))

if errors:
    print(f"Found {len(errors)} data validation error(s):")
    for e in errors:
        print(f"  - {e}")
    sys.exit(1)

print("All event/billboard data files valid.")
