#!/usr/bin/env bash
set -euo pipefail

# this_file: test.sh

# Simple static checks for the Illustrator scripts project
# - ES3 syntax checks (no const/let/arrow/class)
# - Presence of Illustrator target and warning suppression
# - this_file coverage summary and required files check

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
SRC_DIR="$ROOT_DIR/src"

echo "Running static checks in: $SRC_DIR"

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) not found. Please install rg to run checks." >&2
  exit 1
fi

cd "$SRC_DIR"

echo "--- ES3 syntax check (const|let|=>|class) [excluding Utilities/] ---"
ES6_MATCHES=$(rg -n "\\b(const|let)\\b|=>|\\bclass\\s" -g "**/*.jsx" -g "!Utilities/**" || true)
if [[ -n "$ES6_MATCHES" ]]; then
  echo "Found ES6+ usage (must fix):"
  echo "$ES6_MATCHES"
  exit 2
else
  echo "OK: No ES6+ usage detected"
fi

echo "--- Target directive check ---"
ALL_JSX=$(fd -e jsx || find . -type f -name "*.jsx")
WITH_TARGET=$(rg -l -n -g "**/*.jsx" -e "^//@target illustrator" | wc -l | awk '{print $1}')
TOTAL=$(echo "$ALL_JSX" | wc -l | awk '{print $1}')
if [[ "$WITH_TARGET" -ne "$TOTAL" ]]; then
  echo "Missing //@target illustrator in some files ($WITH_TARGET/$TOTAL)." >&2
  # List missing
  comm -23 <(echo "$ALL_JSX" | sort) <(rg -l -n -g "**/*.jsx" -e "^//@target illustrator" | sort) || true
  exit 3
else
  echo "OK: //@target illustrator present in all $TOTAL files"
fi

echo "--- Warning suppression check ---"
WITH_WARN=$(rg -l -n -g "**/*.jsx" -e "app\\.preferences\\.setBooleanPreference\('ShowExternalJSXWarning', false\)" | wc -l | awk '{print $1}')
if [[ "$WITH_WARN" -ne "$TOTAL" ]]; then
  echo "Missing ShowExternalJSXWarning preference in some files ($WITH_WARN/$TOTAL)." >&2
  comm -23 <(echo "$ALL_JSX" | sort) <(rg -l -n -g "**/*.jsx" -e "app\\.preferences\\.setBooleanPreference\('ShowExternalJSXWarning', false\)" | sort) || true
  exit 4
else
  echo "OK: Warning suppression present in all $TOTAL files"
fi

echo "--- this_file presence summary ---"
WITH_THIS=$(rg -l -n -g "**/*.jsx" -e "this_file:" | wc -l | awk '{print $1}')
echo "this_file present in $WITH_THIS / $TOTAL .jsx files"

echo "--- required files this_file check ---"
missing_required=0
for f in ".lib/core.jsx" ".lib/ui.jsx" "Transform/RoundCoordinates.jsx"; do
  if ! rg -n "^//\\s*this_file:|\* - this_file:" "$f" >/dev/null 2>&1; then
    echo "Missing this_file: $f" >&2
    missing_required=1
  fi
done
if [[ "$missing_required" -eq 0 ]]; then
  echo "OK: Required files have this_file markers"
else
  exit 5
fi

echo "All checks passed."
