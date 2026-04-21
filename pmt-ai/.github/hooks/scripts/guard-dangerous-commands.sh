#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
import json
import re
import sys

raw = sys.stdin.read().strip()
if not raw:
    print('{"continue": true}')
    raise SystemExit(0)

try:
    payload = json.loads(raw)
except Exception:
    print('{"continue": true}')
    raise SystemExit(0)

tool_name = (
    payload.get("toolName")
    or payload.get("tool_name")
    or payload.get("name")
    or ""
)

tool_input = payload.get("toolInput") or payload.get("tool_input") or {}
command = ""
if isinstance(tool_input, dict):
    command = str(tool_input.get("command") or "")

# Only inspect terminal commands.
if "terminal" not in tool_name.lower():
    print('{"continue": true}')
    raise SystemExit(0)

dangerous_patterns = [
    r"\bgit\s+reset\s+--hard\b",
    r"\bgit\s+checkout\s+--\b",
    r"\brm\s+-rf\s+(/|~|\$HOME)\b",
    r"\brm\s+-rf\s+\.\s*$",
]

for pattern in dangerous_patterns:
    if re.search(pattern, command):
        response = {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": "Blocked by workspace hook: destructive command policy."
            },
            "systemMessage": "Destructive command blocked by hook policy."
        }
        print(json.dumps(response))
        raise SystemExit(0)

print('{"continue": true}')
PY