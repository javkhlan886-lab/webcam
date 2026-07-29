# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# JWT_SECRET/DB vars aren't needed at build time (no page does DB/JWT work
# during static generation — see src/lib/session.ts, src/lib/auth.ts), only
# at runtime.
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# The platform's HOSTNAME env var (a container ID/name, not "0.0.0.0") would
# otherwise make the standalone server.js bind to that specific hostname
# instead of all interfaces, which external traffic can't reach.
ENV HOSTNAME=0.0.0.0

# Next.js "standalone" output: a minimal server.js plus only the node_modules
# actually needed at runtime.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
