#!/usr/bin/env bash
# Creates (first run) or updates the programme-30-jours waiting-list Apps Script web app and prints its /exec URL (clasp 2.5).
# Separate project from octave-checkout. Writes gas-programme-30-jours/.clasp.json and .deployment.json.
set -euo pipefail
cd "$(dirname "$0")/.."
CLASP="${CLASP_BIN:-$HOME/.local/share/octave-clasp/node_modules/.bin/clasp}"
if [[ ! -f .clasp.json ]]; then
  cp src/appsscript.json .appsscript.json.keep
  "$CLASP" create --type standalone --title "programme-30-jours-gas (READ FRANCE SAS)" --rootDir src
  mv .appsscript.json.keep src/appsscript.json
  [[ ! -f .clasp.json && -f src/.clasp.json ]] && mv src/.clasp.json .clasp.json
fi
"$CLASP" push --force
DESC="programme-30-jours $(date -u +%Y-%m-%dT%H:%MZ)"
if [[ -f .deployment.json ]]; then
  DEP=$(node -e "console.log(require('./.deployment.json').deploymentId)")
  "$CLASP" deploy -i "$DEP" -d "$DESC" >/dev/null
else
  OUT=$("$CLASP" deploy -d "$DESC")
  DEP=$(grep -oE 'AKfy[A-Za-z0-9_-]+' <<<"$OUT" | head -1)
  [[ -n "$DEP" ]] || { echo "no deployment id in: $OUT" >&2; exit 1; }
  printf '{ "deploymentId": "%s" }\n' "$DEP" > .deployment.json
fi
echo "WEB APP: https://script.google.com/macros/s/${DEP}/exec"
