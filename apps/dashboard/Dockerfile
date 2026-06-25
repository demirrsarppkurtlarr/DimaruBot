FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json .
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY packages/*/package*.json ./packages/*/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@dmb/shared
RUN npm run build --workspace=@dmb/dashboard

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/dashboard/.next/standalone ./
COPY --from=builder /app/apps/dashboard/.next/static ./.next/static
COPY --from=builder /app/apps/dashboard/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json .
EXPOSE 3000
CMD ["node", "apps/dashboard/server.js"]
