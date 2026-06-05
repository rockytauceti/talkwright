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
// Body: { theme?, audience?, length?, resources? }
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

  const credits = await checkAndResetCredits(user.id)
  if (credits.plan === 'free' && credits.used >= FREE_MONTHLY_LIMIT) {
    return new Response(
      JSON.stringify({ error: 'Monthly AI limit reached. Upgrade to Pro for unlimited.' }),
      { status: 402 }
    )
  }

  const body = await req.json()
  const { theme, audience, length = 5, resources = [], personalNotes } = body

  const categoryDesc = CATEGORY_PROMPTS[talk.category] ?? 'a talk'
  const mins = Number(length)
  const lengthDesc =
    mins <= 3  ? `${mins} minutes` :
    mins <= 7  ? `${mins} minutes` :
    mins <= 15 ? `${mins} minutes` :
    `${mins} minutes`

  // Format resources for prompt
  const resourceLines: string[] = []
  for (const r of resources) {
    if (!r.text && !r.reference && !r.title) continue
    if (r.type === 'scripture') {
      const ref = r.reference ? `${r.reference}` : 'Scripture'
      const src = r.source ? ` (${r.source})` : ''
      resourceLines.push(`[Scripture] ${ref}${src}: "${r.text}"`)
    } else if (r.type === 'quote') {
      const by = r.attribution ? ` — ${r.attribution}` : ''
      resourceLines.push(`[Quote] "${r.text}"${by}`)
    } else if (r.type === 'personal_story') {
      resourceLines.push(`[Personal story] ${r.text}`)
    } else if (r.type === 'conference_talk') {
      const title = r.title ? `"${r.title}"` : 'Conference talk'
      const by = r.attribution ? ` by ${r.attribution}` : ''
      resourceLines.push(`[Conference talk] ${title}${by}: ${r.text}`)
    } else {
      resourceLines.push(`[Note] ${r.text}`)
    }
  }
  if (personalNotes) resourceLines.push(`[Speaker notes] ${personalNotes}`)

  const resourceBlock = resourceLines.length
    ? `\nResources the speaker wants to weave in:\n${resourceLines.join('\n')}`
    : ''

  const prompt = `You are an expert talk writer specializing in ${categoryDesc}.

Create a structured outline for ${categoryDesc}.

Details:
- Theme/topic: ${theme || 'to be determined by the speaker'}
- Audience: ${audience || 'general congregation'}
- Target length: ${lengthDesc}
${resourceBlock}

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

        await trackAIInteraction({
          userId: user.id,
          talkId: talk.id,
          type: 'outline',
          promptTokens: inputTokens,
          completionTokens: outputTokens,
        })

        try {
          const jStart = fullText.indexOf('{')
          const jEnd = fullText.lastIndexOf('}')
          const cleanFull = (jStart !== -1 && jEnd > jStart) ? fullText.slice(jStart, jEnd + 1) : fullText
          const outline = JSON.parse(cleanFull)
          await prisma.talk.update({
            where: { id: talk.id },
            data: {
              outline,
              ...(outline.title && !talk.title ? { title: outline.title } : {}),
            },
          })
        } catch {
          // Outline parse failed — still streamed
        }

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