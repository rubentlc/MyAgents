#!/bin/bash
set -e

echo "==> Instalar fzf..."
sudo apt-get update -qq && sudo apt-get install -y -qq fzf

# Garantir que o volume node_modules pertence ao utilizador correcto
sudo chown -R node:node /workspaces/pam-frontend/node_modules 2>/dev/null || true

# Activar pnpm via corepack se o lockfile existir, caso contrário usar npm
cd /workspaces/pam-frontend

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

rm -f /workspaces/pam-frontend/.npmrc

echo "Dev container ready!"
echo "To start: npm start  (or pnpm start)"
