# ─── Stage 1: dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund --prefer-offline

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Browser API calls remain same-origin. These server-side URLs are compiled into
# Next rewrites and used by server routes such as the live proof fabric.
ARG BACKEND_URL="http://host.docker.internal:8088"
ARG LOCKERPHYCER_URL="http://host.docker.internal:8092"
ARG CAPI_URL="http://host.docker.internal:3003"
ARG CAPPO_URL="http://host.docker.internal:8002"
ARG CAPPO_BACKEND_URL="http://host.docker.internal:8002"
ARG PGL_URL="http://host.docker.internal:8001"
ARG NEXT_PUBLIC_API_BASE_URL=""

ENV BACKEND_URL=$BACKEND_URL
ENV LOCKERPHYCER_URL=$LOCKERPHYCER_URL
ENV CAPI_URL=$CAPI_URL
ENV CAPPO_URL=$CAPPO_URL
ENV CAPPO_BACKEND_URL=$CAPPO_BACKEND_URL
ENV PGL_URL=$PGL_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096

RUN npm run build

# ─── Stage 3: runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

LABEL org.opencontainers.image.source="veklom-control-plane"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3002/api/health >/dev/null || exit 1

CMD ["sh", "-c", "PORT=3002 node server.js"]
