import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import {
  anthropic,
  AI_MODEL,
  FREE_MONTHLY_LIMIT,
  checkAndResetCredits,
  trackAIInteraction,
  CATEGORY_PROMPTS,
} from '@/lib/anthropic'

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
  const { personalNotes, tone } = body

  const categoryDesc = CATEGORY_PROMPTS[talk.category] ?? 'a talk'
  const outline = talk.outline as Record<string, unknown>

  const prompt = `You are an expert writer specializing in ${categoryDesc}. 

Write a complete, polished first draft based on this outline:

${JSON.stringify(outline, null, 2)}

${personalNotes ? `Speaker's personal notes and stories to weave in:\n${personalNotes}\n` : ''}
${tone ? `Tone: ${tone}` : ''}

Guidelines:
- Write in first person, warm and conversational
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
