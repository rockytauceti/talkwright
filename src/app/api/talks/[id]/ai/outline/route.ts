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

// POST /api/talks/[id]/ai/outline
// Body: { theme?, audience?, length?, personalNotes? }
// Streams back a structured outline as JSON
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

  // Credit check
  const credits = await checkAndResetCredits(user.id)
  if (credits.plan === 'free' && credits.used >= FREE_MONTHLY_LIMIT) {
    return new Response(
      JSON.stringify({ error: 'Monthly AI limit reached. Upgrade to Pro for unlimited.' }),
      { status: 402 }
    )
  }

  const body = await req.json()
  const { theme, audience, length = 5, personalNotes } = body

  const categoryDesc = CATEGORY_PROMPTS[talk.category] ?? 'a talk'
  const lengthDesc =
    length <= 3 ? '2–3 minutes' : length <= 7 ? '5–7 minutes' : '10–15 minutes'

  const prompt = `You are an expert talk writer specializing in ${categoryDesc}.

Create a structured outline for ${categoryDesc}.

Details:
- Theme/topic: ${theme || 'to be determined by the speaker'}
- Audience: ${audience || 'general congregation'}
- Target length: ${lengthDesc}
${personalNotes ? `- Speaker's notes: ${personalNotes}` : ''}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "title": "Suggested talk title",
  "theme": "Core theme in one sentence",
  "sections": [
    {
      "label": "Introduction",
      "summary": "Brief description of what to cover",
      "keyPoints": ["point 1", "point 2"]
    },
    {
      "label": "Main Point 1",
      "summary": "...",
      "keyPoints": ["..."]
    },
    {
      "label": "Conclusion",
      "summary": "...",
      "keyPoints": ["..."]
    }
  ],
  "scriptureOrQuote": "Optional relevant scripture or quote (or null)",
  "openingHook": "Suggested opening line or anecdote idea"
}`

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let fullText = ''
        let inputTokens = 0
        let outputTokens = 0

        const response = await anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 1024,
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

        // Track usage
        await trackAIInteraction({
          userId: user.id,
          talkId: talk.id,
          type: 'outline',
          promptTokens: inputTokens,
          completionTokens: outputTokens,
        })

        // Try to parse and save outline to DB
        try {
          const outline = JSON.parse(fullText)
          await prisma.talk.update({
            where: { id: talk.id },
            data: {
              outline,
              ...(outline.title && !talk.title ? { title: outline.title } : {}),
            },
          })
        } catch {
          // Outline parse failed — still streamed, user can retry
        }

        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: String(err) }))
        )
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
