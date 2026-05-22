import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { anthropic, AI_MODEL, CATEGORY_PROMPTS } from '@/lib/anthropic'

// POST /api/talks/[id]/ai/starter
// Body: { theme, audience, resources? }
// Returns: { starters: [{ title, hook, approach }] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const talk = await prisma.talk.findFirst({ where: { id, userId: user.id } })
  if (!talk) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { theme, audience, resources = [] } = body

  const categoryDesc = CATEGORY_PROMPTS[talk.category] ?? 'a talk'
  const resourceSummary = resources
    .filter((r: { text?: string }) => r.text)
    .slice(0, 5)
    .map((r: { type: string; text: string; reference?: string; attribution?: string }) => {
      if (r.type === 'scripture') return 'scripture: ' + (r.reference ?? '') + ' "' + r.text + '"'
      if (r.type === 'personal_story') return 'personal story: ' + r.text.slice(0, 80)
      if (r.type === 'quote') return 'quote: "' + r.text + '" ' + (r.attribution ? '— ' + r.attribution : '')
      return r.text.slice(0, 80)
    })
    .join('\n')

  const prompt = 'You are helping a speaker start writing ' + categoryDesc + '.\n\nTopic: ' + (theme || '(not specified yet)') + '\nAudience: ' + (audience || 'general congregation') + '\n' + (resourceSummary ? 'Available resources:\n' + resourceSummary + '\n' : '') + '\nSuggest 3 distinct ways to open and frame this talk. Each should have a different angle or approach.\n\nReturn ONLY valid JSON (no markdown):\n{\n  "starters": [\n    {\n      "title": "Short name for this approach (e.g. Start with a question)",\n      "hook": "The actual opening sentence or two the speaker could use",\n      "approach": "One sentence explaining how this angle develops through the talk"\n    },\n    { "title": "...", "hook": "...", "approach": "..." },\n    { "title": "...", "hook": "...", "approach": "..." }\n  ]\n}'

  try {
    const msg = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Failed to generate starters' }, { status: 500 })
  }
}