#!/usr/bin/env bash
# Build the coopadocs API references for toyengine and its libraries into docs/<name>/.
#
#   scripts/build-docs.sh              # build everything
#   scripts/build-docs.sh mapcoopa caml   # build only these
#
# Expects coopadocs and toyengine cloned next to this repo (override with COOPADOCS_DIR /
# TOYENGINE_DIR), Doxygen, and a Python >= 3.12 from python.org or Homebrew. /usr/bin/python3 is
# deliberately never used: on macOS it is the Xcode developer-tools stub.
set -euo pipefail

SITE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENGINE="${TOYENGINE_DIR:-$SITE/../toyengine}"
COOPADOCS="${COOPADOCS_DIR:-$SITE/../coopadocs}"
VENV="$SITE/.venv-docs"
OUT="$SITE/docs"

die() { echo "build-docs: $*" >&2; exit 1; }

[[ -d "$ENGINE" ]] || die "toyengine not found at $ENGINE (set TOYENGINE_DIR)"
[[ -f "$COOPADOCS/pyproject.toml" ]] || die "coopadocs not found at $COOPADOCS (set COOPADOCS_DIR)"

# ── Doxygen: without it coopadocs silently skips C++ and writes empty docs ──
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
command -v doxygen >/dev/null || die "doxygen not found (brew install doxygen)"

# ── Python >= 3.12, never the /usr/bin stub ──
PY=""
for cand in /usr/local/bin/python3 /opt/homebrew/bin/python3 /usr/local/bin/python3.1[2-9] /opt/homebrew/bin/python3.1[2-9]; do
  [[ -x "$cand" ]] || continue
  if "$cand" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 12) else 1)' 2>/dev/null; then
    PY="$cand"; break
  fi
done
[[ -n "$PY" ]] || die "need Python >= 3.12 in /usr/local/bin or /opt/homebrew/bin"

# ── coopadocs in a private venv, created once ──
if [[ ! -x "$VENV/bin/coopadocs" ]]; then
  echo "Creating $VENV with $PY"
  "$PY" -m venv "$VENV"
  "$VENV/bin/pip" install --quiet --upgrade pip
  "$VENV/bin/pip" install --quiet -e "$COOPADOCS"
fi
COOPADOCS_BIN="$VENV/bin/coopadocs"

# ── What to build: name and source root (coopadocs reads <root>/.coopadocs) ──
# caml has no .coopadocs, so point at its own header dir to skip the vendored fkYAML.
TARGETS=(
  "toyengine:$ENGINE"
  "libcoopa:$ENGINE/libs/libcoopa"
  "gfxcoopa:$ENGINE/libs/gfxcoopa"
  "physxcoopa:$ENGINE/libs/physxcoopa"
  "uicoopa:$ENGINE/libs/uicoopa"
  "sfxcoopa:$ENGINE/libs/sfxcoopa"
  "mapcoopa:$ENGINE/libs/mapcoopa"
  "caml:$ENGINE/libs/caml/includes/caml"
)

for arg in "$@"; do
  printf '%s\n' "${TARGETS[@]}" | grep -q "^$arg:" || die "unknown repo '$arg'"
done
only=" $* "   # empty means build everything

mkdir -p "$OUT"
built=()
for t in "${TARGETS[@]}"; do
  name="${t%%:*}"; src="${t#*:}"
  if (( $# > 0 )) && [[ "$only" != *" $name "* ]]; then continue; fi
  [[ -d "$src" ]] || die "$name: source not found at $src"
  echo "── $name  ($src)"
  rm -rf "${OUT:?}/$name"
  "$COOPADOCS_BIN" build "$src" -o "$OUT/$name"
  [[ -f "$OUT/$name/index.html" ]] || die "$name: no index.html produced"
  built+=("$name")
done

echo
echo "Built into $OUT:"
for name in "${built[@]}"; do
  pages=$(find "$OUT/$name" -name '*.html' | wc -l | tr -d ' ')
  printf '  %-12s %4s pages\n' "$name" "$pages"
done
echo "Commit docs/ to publish."
