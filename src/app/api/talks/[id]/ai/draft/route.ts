import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { clerkClient } from '@clerk/nextjs/server'
import {
  anthropic,
  AI_MODEL,
  FREE_MONTHLY_LIMIT,
  checkAndResetCredits,
  trackAIInteraction,
  CATEGORY_PROMPTS,
} from '@/lib/anthropic'

type Resource = {
  type: string; text: string
  reference?: string; attribution?: string; title?: string; source?: string
}

function formatResources(resources: Resource[]): { styleRef: string; contentResources: string } {
  const past = resources.filter(r => r.type === 'past_talk')
  const rest = resources.filter(r => r.type !== 'past_talk')

  const styleRef = past.map(r => {
    const title = r.title ? ` ("${r.title}")` : ''
    return `--- Past talk by this speaker${title} ---\n${r.text.slice(0, 1500)}\n--- End style reference ---`
  }).join('\n\n')

  const contentResources = rest.map(r => {
    if (r.type === 'scripture') {
      const ref = r.reference ?? 'Scripture'
      const src = r.source ? ` (${r.source})` : ''
      return `[Scripture] ${ref}${src}: "${r.text}"`
    }
    if (r.type === 'quote') {
      const by = r.attribution ? ` — ${r.attribution}` : ''
      return `[Quote] "${r.text}"${by}`
    }
    if (r.type === 'personal_story') return `[Personal story] ${r.text}`
    if (r.type === 'conference_talk') {
      const title = r.title ? `"${r.title}"` : 'Conference talk'
      const by = r.attribution ? ` by ${r.attribution}` : ''
      return `[Conference talk] ${title}${by}: ${r.text}`
    }
    return `[Note] ${r.text}`
  }).filter(Boolean).join('\n')

  return { styleRef, contentResources }
}

// POST /api/talks/[id]/ai/draft
// Generates a full draft from the saved outline. Streams prose back.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser().catch(() => null)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const { id } = await params
  const talk = await prisma.talk.findFirst({ where: { id, userId: user.id } })
  if (!talk) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  if (!talk.outline) {
    return new Response(JSON.stringify({ error: 'Generate an outline first' }), { status: 400 })
  }

  // Credit check
  const credits = await checkAndResetCredits(user.id)
  if (credits.plan === 'free' && credits.used >= FREE_MONTHLY_LIMIT) {
    return new Response(
      JSON.stringify({ error: 'Monthly AI limit reached. Upgrade to Pro for unlimited.' }),
      { status: 402 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { tone, resources = [], mirrorVoice = false } = body

  // Fetch voice profile if mirror mode is on
  let voiceProfile: string | null = null
  if (mirrorVoice) {
    try {
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(user.clerkUserId)
      voiceProfile = (clerkUser.privateMetadata?.voiceProfile as string) ?? null
    } catch {
      // Non-fatal — proceed without voice profile
    }
  }

  const categoryDesc = CATEGORY_PROMPTS[talk.category] ?? 'a talk'
  const outline = talk.outline as Record<string, unknown>
  const { styleRef, contentResources } = formatResources(resources)

  const prompt = `You are an expert writer specializing in ${categoryDesc}.${voiceProfile ? `

The speaker has provided their voice profile. Mirror it closely in the draft — their vocabulary, sentence rhythm, storytelling approach, and tone.

${voiceProfile}` : ''}${styleRef ? `\n\n${voiceProfile ? 'Additionally, they have provided a specific past talk as a style reference:' : 'The speaker has provided a past talk as a voice/style reference. Study it and mirror their writing voice in the new draft.'}

${styleRef}` : ''}

Write a complete, polished first draft based on this outline:

${JSON.stringify(outline, null, 2)}
${contentResources ? `\nResources to weave in:\n${contentResources}\n` : ''}${tone ? `\nTone: ${tone}` : ''}

Guidelines:
- Write in first person, warm and conversational${(voiceProfile || styleRef) ? '\n- Match the speaker\'s natural voice from the profile above' : ''}
- Use natural transitions between sections
- Keep it authentic — avoid clichés and hollow filler phrases
- For LDS talks: appropriate doctrinal references are welcome, but don't overload
- Format with clear paragraph breaks (use \\n\\n between paragraphs)
- Do NOT include section headers — write flowing prose only
- End with a genuine, heartfelt conclusion

Write the full draft now:`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = ''
        let inputTokens = 0
        let outputTokens = 0

        const response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        })

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text
            controller.enqueue(encoder.encode(event.delta.text))
          }
          if (event.type === 'message_delta' && event.usage) {
            outputTokens = event.usage.output_tokens
          }
          if (event.type === 'message_start' && event.message.usage) {
            inputTokens = event.message.usage.input_tokens
          }
        }

        // Track usage + save draft
        await Promise.all([
          trackAIInteraction({
            userId: user.id,
            talkId: talk.id,
            type: 'draft',
            promptTokens: inputTokens,
            completionTokens: outputTokens,
          }),
          (() => {
            const words = fullText.trim().split(/\s+/).filter(Boolean).length
            return prisma.talk.update({
              where: { id: talk.id },
              data: {
                body: fullText,
                wordCount: words,
                estimatedMinutes: Math.ceil(words / 130),
              },
            })
          })(),
        ])

        controller.close()
      } catch (err) {
        controller.enqueue(encoder.encode(JSON.stringify({ error: String(err) })))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'X-Credits-Used': String(credits.used + 1),
      'X-Credits-Limit': String(FREE_MONTHLY_LIMIT),
    },
  })
}
