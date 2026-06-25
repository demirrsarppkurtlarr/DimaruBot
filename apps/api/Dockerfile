FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json .
COPY apps/api/package*.json ./apps/api/
COPY packages/*/package*.json ./packages/*/
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@dmb/shared --workspace=@dmb/config --workspace=@dmb/logger --workspace=@dmb/prisma
RUN npm run build --workspace=@dmb/api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/*/dist ./packages/*/dist
COPY --from=builder /app/packages/prisma/prisma/client ./packages/prisma/prisma/client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json .
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
