import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { anthropic, AI_MODEL } from '@/lib/anthropic'

// POST /api/user/voice-profile/generate
// Body: { texts: string[] }  — one or more past talk texts to analyze
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { texts } = await req.json()
  if (!texts?.length) return NextResponse.json({ error: 'No text provided' }, { status: 400 })

  const combined = (texts as string[])
    .map((t, i) => `--- Talk ${i + 1} ---\n${t.slice(0, 3000)}`)
    .join('\n\n')

  const prompt = `Analyze the following talk(s) written by the same speaker and produce a concise voice profile in markdown. This profile will be used to guide an AI writing assistant to match the speaker's style in future talks.

${combined}

Write the voice profile using this structure:

## Voice profile

**Speaking style** (1–2 sentences summarizing overall tone and approach)

**Sentence patterns**
- (bullet points with specific observations, e.g. "Short declarative sentences when landing a point")

**Vocabulary & signature phrases**
- (bullet points with direct examples from the text)

**Structure preferences**
- (bullet points, e.g. "Opens with a personal story before doctrine")

**What to avoid**
- (any patterns NOT present — e.g. "Does not use rhetorical questions", "Avoids formal ecclesiastical language")

Keep the total profile under 450 words. Use specific examples pulled directly from the text. Do not add preamble or commentary — just the profile.`

  const message = await anthropic.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const voiceProfile = message.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim()

  // Save to Clerk metadata
  const client = await clerkClient()
  await client.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { voiceProfile },
  })

  return NextResponse.json({ voiceProfile })
}
