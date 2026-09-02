#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

export NEXT_TELEMETRY_DISABLED=1

declare -a RESULTS=()

print_summary() {
  printf '\nCI gate summary\n'
  printf '%-12s %s\n' "Step" "Result"
  printf '%-12s %s\n' "------------" "------"
  for result in "${RESULTS[@]}"; do
    IFS='|' read -r step status <<< "$result"
    printf '%-12s %s\n' "$step" "$status"
  done
}

run_step() {
  local step="$1"
  shift

  printf '\n==> %s\n' "$step"
  if "$@"; then
    RESULTS+=("$step|PASS")
    printf 'PASS %s\n' "$step"
  else
    RESULTS+=("$step|FAIL")
    printf 'FAIL %s\n' "$step"
    print_summary
    exit 1
  fi
}

run_build() {
  local backend_url="${BACKEND_URL:-http://127.0.0.1:8088}"
  local cappo_backend_url="${CAPPO_BACKEND_URL:-http://127.0.0.1:8002}"
  local cappo_url="${CAPPO_URL:-$cappo_backend_url}"
  local pgl_url="${PGL_URL:-http://127.0.0.1:8001}"

  BACKEND_URL="$backend_url" \
    CAPPO_BACKEND_URL="$cappo_backend_url" \
    CAPPO_URL="$cappo_url" \
    PGL_URL="$pgl_url" \
    npm run build
}

run_step lint npm run lint
run_step typecheck npm run typecheck
run_step test npm test -- --ci

if [[ "${CI_GATE_SKIP_BUILD:-0}" == "1" ]]; then
  RESULTS+=("build|SKIP")
  printf '\nSKIP build (CI_GATE_SKIP_BUILD=1)\n'
else
  run_step build run_build
fi

print_summary
