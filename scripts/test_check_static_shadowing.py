#!/usr/bin/env python3
"""Regression test for check-static-shadowing.py - verifies it still
catches the exact billboard-style regression from July 2026, and
still passes both the current repo's known-safe shadows (events,
paypal) and the no-shadowing case.

Run with: python3 scripts/test_check_static_shadowing.py
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPT = os.path.join(os.path.dirname(__file__), "check-static-shadowing.py")


def run_check(cwd):
    result = subprocess.run(
        [sys.executable, SCRIPT], cwd=cwd, capture_output=True, text=True
    )
    return result.returncode, result.stdout


class TestStaticShadowing(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.tmp, "static"))
        os.makedirs(os.path.join(self.tmp, "content"))

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def make_static_dir(self, name):
        os.makedirs(os.path.join(self.tmp, "static", name))

    def make_content_page(self, name):
        d = os.path.join(self.tmp, "content", name)
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.md"), "w").close()

    def test_unapproved_shadow_fails(self):
        """The exact billboard regression: a new content page shadowing
        a static/ directory not on the allow-list must fail the check."""
        self.make_static_dir("billboard")
        self.make_content_page("billboard")
        code, out = run_check(self.tmp)
        self.assertEqual(code, 1)
        self.assertIn("billboard", out)

    def test_allowed_shadow_passes(self):
        """events and paypal are pre-approved and must not fail."""
        self.make_static_dir("events")
        self.make_content_page("events")
        self.make_static_dir("paypal")
        self.make_content_page("paypal")
        code, _ = run_check(self.tmp)
        self.assertEqual(code, 0)

    def test_no_shadowing_passes(self):
        self.make_static_dir("fonts")
        code, _ = run_check(self.tmp)
        self.assertEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
