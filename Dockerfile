# Dockerfile for نظام نشاطات والمؤتمرات
# Supports SQLite (default) and PostgreSQL

FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json bun.lock* package-lock.json* ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps
RUN npx prisma generate

FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create directories for SQLite database and uploads
RUN mkdir -p /app/db /app/public/uploads

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "server.js"]
