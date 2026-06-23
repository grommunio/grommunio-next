#!/usr/bin/env python3
"""Collects translation keys used in the sources and adds missing ones to every
locale file. English gets the key itself as value, other locales an empty string
(i18next falls back to the key for empty strings). Existing translations are kept.

Usage: python3 scripts/extractTranslations.py [--prune]
  --prune   also remove keys that are no longer used in the sources
"""
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "src")
I18N = os.path.join(SRC, "i18n")

KEY_RE = re.compile(r"""(?:(?<![A-Za-z0-9_.])t|i18n\.t)\(\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')""")

def collect_keys():
    keys = set()
    for dirpath, _dirs, files in os.walk(SRC):
        if dirpath.startswith(I18N):
            continue
        for name in files:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx")):
                continue
            with open(os.path.join(dirpath, name), encoding="utf-8") as fh:
                content = fh.read()
            for match in KEY_RE.finditer(content):
                key = match.group(1) if match.group(1) is not None else match.group(2)
                key = key.replace('\\"', '"').replace("\\'", "'")
                if key:
                    keys.add(key)
    return keys

def main():
    prune = "--prune" in sys.argv
    keys = collect_keys()
    for name in sorted(os.listdir(I18N)):
        if not name.endswith(".json"):
            continue
        path = os.path.join(I18N, name)
        with open(path, encoding="utf-8") as fh:
            data = json.load(fh)
        added = 0
        for key in keys:
            if key not in data:
                data[key] = re.sub(r"_(zero|one|two|few|many|other)$", "", key) if name == "en-US.json" else ""
                added += 1
        removed = 0
        if prune:
            for key in list(data.keys()):
                if key not in keys:
                    del data[key]
                    removed += 1
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=4, sort_keys=True, ensure_ascii=False)
            fh.write("\n")
        print(f"{name}: {len(data)} keys, {added} added, {removed} removed")

if __name__ == "__main__":
    main()
