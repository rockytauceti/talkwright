import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

// GET /api/user/voice-profile
export async function GET() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const client = await clerkClient()
  const clerkUser = await client.users.getUser(clerkUserId)
  const voiceProfile = (clerkUser.privateMetadata?.voiceProfile as string) ?? null

  return NextResponse.json({ voiceProfile })
}

// PATCH /api/user/voice-profile — save profile directly (manual edit)
export async function PATCH(req: NextRequest) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { voiceProfile } = await req.json()

  const client = await clerkClient()
  await client.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { voiceProfile: voiceProfile ?? null },
  })

  return NextResponse.json({ success: true })
}
