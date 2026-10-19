#!/usr/bin/env python3
"""
Audit portable/app completeness: every file listed in .next/server/**/*.nft.json
must exist inside portable/app (or be provided by portable/app/node_modules).
On the build machine a missing file is silently rescued by the PARENT project's
node_modules (/home/z/my-project/node_modules) — on the user's Windows machine
there is no parent, so any missing file = "Cannot find module" = 500.
"""
import json, os, sys, glob

APP = "/home/z/my-project/portable/app"
nfts = glob.glob(os.path.join(APP, ".next/server/**/*.nft.json"), recursive=True)
missing = {}
checked = 0
for nft in nfts:
    try:
        data = json.load(open(nft))
    except Exception as e:
        print("cannot read", nft, e)
        continue
    base = os.path.dirname(nft)  # nft paths are relative to the nft file's dir
    for rel in data.get("files", []):
        p = os.path.normpath(os.path.join(base, rel))
        checked += 1
        if not os.path.exists(p):
            # record keyed by the node_modules package root (first 3-4 segments)
            norm = os.path.relpath(p, APP)
            parts = norm.split(os.sep)
            if "node_modules" in parts:
                i = parts.index("node_modules")
                pkg = "/".join(parts[i+1:i+3]) if parts[i+1].startswith("@") else parts[i+1]
            else:
                pkg = "(.next)"
            missing.setdefault(pkg, []).append(norm)

print(f"nft files scanned: {len(nfts)} | traced file refs checked: {checked}")
print(f"distinct missing packages: {len(missing)}")
for pkg in sorted(missing):
    files = missing[pkg]
    print(f"  MISSING {pkg}  ({len(files)} files)  e.g. {files[0]}")
if not missing:
    print("PORTABLE BUNDLE IS COMPLETE ✔ (no parent rescue needed)")
