#!/bin/bash
set -e

echo "==> Instalar fzf..."
sudo apt-get update -qq && sudo apt-get install -y -qq fzf

# Garantir que o volume node_modules pertence ao utilizador correcto
sudo chown -R node:node /workspaces/pam-frontend/node_modules 2>/dev/null || true

# Activar pnpm via corepack se o lockfile existir, caso contrário usar npm
cd /workspaces/pam-frontend

# In a worktree, .git is a pointer file; use git-path so the exclude is resolved correctly.
GIT_EXCLUDE_FILE="$(git rev-parse --git-path info/exclude)"
mkdir -p "$(dirname "$GIT_EXCLUDE_FILE")"
touch "$GIT_EXCLUDE_FILE"

for pattern in ".github/" "mcp-servers/"; do
    if ! grep -qxF "$pattern" "$GIT_EXCLUDE_FILE"; then
        echo "$pattern" >> "$GIT_EXCLUDE_FILE"
    fi
done

if [ -f "pnpm-lock.yaml" ]; then
    echo "==> Activating pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
    echo "==> Install dependencies (pnpm)..."
    pnpm install
else
    echo "==> Install dependencies (npm)..."
    npm install --verbose
fi

echo "Dev container ready!"
echo "To start: npm start  (or pnpm start)"
