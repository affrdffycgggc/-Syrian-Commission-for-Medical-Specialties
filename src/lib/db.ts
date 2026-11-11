import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SECURITY: Only log queries in development (avoid leaking schema info in production)
const logLevel = process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel as any,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
