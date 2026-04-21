#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pmt_ai_root="$(cd "${script_dir}/../../.." && pwd)"

resolve_frontend_root() {
  # Prefer explicit override via env var.
  if [[ -n "${PMT_FRONTEND_PATH:-}" && -d "${PMT_FRONTEND_PATH}" ]]; then
    printf '%s\n' "${PMT_FRONTEND_PATH}"
    return 0
  fi

  # Search common sibling locations for the Nx frontend workspace (nx.json marker).
  local candidate
  candidate="$(find "${pmt_ai_root}/.." -maxdepth 8 -type f -name "nx.json" 2>/dev/null | head -n 1 || true)"
  if [[ -n "${candidate}" ]]; then
    dirname "${candidate}"
    return 0
  fi

  return 1
}

frontend_root="$(resolve_frontend_root || true)"
if [[ -z "${frontend_root}" ]]; then
  printf '{"continue": true, "systemMessage": "Frontend build hook skipped: frontend root not found."}\n'
  exit 0
fi

if [[ ! -f "${frontend_root}/package.json" ]]; then
  printf '{"continue": true, "systemMessage": "Frontend build hook skipped: package.json not found."}\n'
  exit 0
fi

cd "${frontend_root}"

# Only run when frontend source files changed since HEAD (Nx monorepo: apps/ and libs/).
changed_files="$(git diff --name-only HEAD -- apps libs 2>/dev/null || true)"
if [[ -z "${changed_files}" ]]; then
  printf '{"continue": true, "systemMessage": "Frontend build hook skipped: no apps/libs changes detected."}\n'
  exit 0
fi

if ! command -v npm >/dev/null 2>&1; then
  printf '{"continue": true, "systemMessage": "Frontend build hook skipped: npm not available."}\n'
  exit 0
fi

if npm run build; then
  printf '{"continue": true, "systemMessage": "Frontend build hook passed."}\n'
  exit 0
fi

printf '{"stopReason": "Frontend build failed", "systemMessage": "Automatic frontend build failed in Stop hook. Fix build errors before finishing."}\n'
exit 2