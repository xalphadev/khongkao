#!/bin/sh
set -e

echo "================================================"
echo "  มือสองของเก่า — Starting up"
echo "================================================"

# ── 1. Run database migrations ──────────────────
echo ""
echo "[1/3] Running database migrations..."
npx prisma migrate deploy
echo "      ✓ Migrations complete"

# ── 2. Seed initial data (idempotent — safe to re-run) ──
echo ""
echo "[2/3] Seeding initial data (skipped if already exists)..."
npx prisma db seed
echo "      ✓ Seed complete"

# ── 3. Start Next.js server ─────────────────────
echo ""
echo "[3/3] Starting Next.js server on port ${PORT:-3000}..."
echo ""
exec npx next start -p "${PORT:-3000}"
