# Build args that can be passed from build.sh
# Usage: docker build --build-arg NEXT_PUBLIC_API_URL=<url> --build-arg NODE_ENV=production .

FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS deps

COPY package*.json ./
RUN npm ci --frozen-lockfile

FROM base AS builder

ARG NEXT_PUBLIC_API_URL
ARG NODE_ENV=production
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "ERROR: NEXT_PUBLIC_API_URL must be provided at build time." && exit 1)
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=$NODE_ENV

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build && \
    test -d ".next/standalone" || (echo "ERROR: .next/standalone directory not found. Build failed." && exit 1) && \
    test -d ".next/static" || (echo "ERROR: .next/static directory not found. Build failed." && exit 1)

FROM node:20-alpine AS runner

ARG NEXT_PUBLIC_API_URL

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "ERROR: NEXT_PUBLIC_API_URL must be provided at build time." && exit 1)
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

RUN test -f "server.js" || (echo "ERROR: server.js not found in build output." && exit 1)

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]