import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'

/**
 * Get the current authenticated user's DB record.
 * Returns null if unauthenticated or user not yet synced.
 */
export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  return prisma.user.findUnique({
    where: { clerkUserId },
  })
}

/**
 * Like getCurrentUser but throws a 401 response if not authenticated.
 * Use inside API route handlers.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return user
}
