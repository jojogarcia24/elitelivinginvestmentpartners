#!/usr/bin/env bash
#
# Netlify build — an ALLOW-LIST of what this site serves.
#
# Previously netlify.toml used `publish = "."`, which serves the repository
# itself. That put the database schema, the Edge Function source and the
# internal README/TODO notes on the public web:
#
#   /supabase/schema.sql
#   /supabase/functions/submit-lead/index.ts
#   /supabase/README.md
#   /README.md
#   /OWNER-TODO.md
#
# None of those are credentials, and this repository is public, so the source was
# already readable on GitHub — but a marketing site has no reason to serve them,
# and a deny-list would fail open the next time a directory is added. This lists
# what the site serves; anything new stays unpublished until it is added here.

set -euo pipefail

OUT="${1:-dist}"
rm -rf "$OUT"
mkdir -p "$OUT"

# Web assets only, preserving directory structure so every existing URL keeps
# working: /css/styles.css, /js/main.js, /assets/hero.webp and the rest.
find . -path ./.git -prune -o -path "./$OUT" -prune -o -type f \
  \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.mjs' \
     -o -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.gif' \
     -o -name '*.webp' -o -name '*.svg' -o -name '*.ico' \
     -o -name '*.woff' -o -name '*.woff2' -o -name '*.ttf' \
     -o -name '*.xml' -o -name '*.txt' -o -name '*.webmanifest' -o -name '*.pdf' \) \
  -print0 |
while IFS= read -r -d '' f; do
  rel="${f#./}"
  mkdir -p "$OUT/$(dirname "$rel")"
  cp "$f" "$OUT/$rel"
done

# Fail the deploy rather than publish something that should not ship.
LEAKED="$(find "$OUT" -type f \( -name '*.sql' -o -name '*.ts' -o -name '*.md' -o -name '*.sh' -o -name '.env*' \) -print)"
if [ -n "$LEAKED" ]; then
  echo "BUILD FAILED — these must not be published:" >&2
  echo "$LEAKED" >&2
  exit 1
fi

echo "Published $(find "$OUT" -type f | wc -l | tr -d ' ') files to $OUT"
