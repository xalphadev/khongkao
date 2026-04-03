# ─────────────────────────────────────────────
# Stage 1: Install ALL dependencies (incl. dev)
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

# ─────────────────────────────────────────────
# Stage 2: Build the Next.js application
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (custom output: src/generated/prisma)
RUN npx prisma generate

# Build Next.js
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Production runner
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# OpenSSL required by Prisma on Alpine (musl)
RUN apk add --no-cache openssl

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Application build output
COPY --from=builder --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public       ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# All node_modules (needed for prisma CLI, ts-node for seed, and next start)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma schema, migrations, generated client, seed script
COPY --from=builder --chown=nextjs:nodejs /app/prisma         ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated  ./src/generated
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json  ./tsconfig.json

# Persistent data directory for SQLite
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Startup script
COPY --chown=nextjs:nodejs entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
