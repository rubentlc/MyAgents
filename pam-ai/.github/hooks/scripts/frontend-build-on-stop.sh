#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pam_ai_root="$(cd "${script_dir}/../../.." && pwd)"

resolve_frontend_root() {
  if [[ -n "${PAM_FRONTEND_PATH:-}" && -d "${PAM_FRONTEND_PATH}" ]]; then
    printf '%s\n' "${PAM_FRONTEND_PATH}"
    return 0
  fi

  # Search common sibling locations for the frontend workspace.
  local candidate
  candidate="$(find "${pam_ai_root}/.." -maxdepth 6 -type f -name "pam-frontend.sln" 2>/dev/null | head -n 1 || true)"
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

if [[ ! -f "${frontend_root}/package.json" || ! -d "${frontend_root}/.git" ]]; then
  printf '{"continue": true, "systemMessage": "Frontend build hook skipped: package or git metadata not found."}\n'
  exit 0
fi

cd "${frontend_root}"

# Only run when src files changed since HEAD.
changed_files="$(git diff --name-only HEAD -- src 2>/dev/null || true)"
if [[ -z "${changed_files}" ]]; then
  printf '{"continue": true, "systemMessage": "Frontend build hook skipped: no src changes detected."}\n'
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