import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { anthropic, AI_MODEL } from '@/lib/anthropic'

const SCRIPTURE_SOURCES: Record<string, string> = {
  lds_sacrament: 'Bible (KJV), Book of Mormon, Doctrine & Covenants, and Pearl of Great Price',
  lds_primary: 'Bible (KJV), Book of Mormon, and Primary songs',
  lds_funeral: 'Bible (KJV), Book of Mormon, and Doctrine & Covenants',
  lds_conference: 'Bible (KJV), Book of Mormon, Doctrine & Covenants, and Pearl of Great Price',
  christian_sermon: 'Bible (KJV and NIV)',
  wedding_toast: 'Bible (KJV), poetry, and literature',
  eulogy: 'Bible (KJV) and inspirational literature',
  graduation: 'Bible (KJV), inspirational literature, and poetry',
  ted_style: 'Relevant quotes from thought leaders, science, and philosophy',
  motivational: 'Inspiring quotes from leaders, athletes, and philosophers',
  other: 'Relevant scriptures and quotes',
}

// POST /api/talks/[id]/ai/scriptures
// body: { theme: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser().catch(() => null)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const talk = await prisma.talk.findFirst({ where: { id, userId: user.id } })
  if (!talk) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { theme } = await req.json()
  if (!theme?.trim()) return NextResponse.json({ scriptures: [], resources: [] })

  const sources = SCRIPTURE_SOURCES[talk.category] ?? 'Relevant scriptures and quotes'

  const prompt = `You are a knowledgeable scholar of ${sources}.

Given this talk theme: "${theme}"
Talk category: ${talk.category}

Return a JSON object with exactly this shape:
{
  "scriptures": [
    {
      "reference": "Book Chapter:Verse",
      "text": "The exact verse text",
      "matchWords": ["word1", "word2"]
    }
  ],
  "resources": [
    {
      "title": "Article or talk title",
      "description": "One sentence description"
    }
  ]
}

Rules:
- Include 5-7 scriptures directly relevant to the theme
- Scripture text must be accurate (KJV for Bible, standard LDS text for other volumes)
- matchWords: 1-3 words or short phrases from the verse that connect to the theme (for highlighting)
- Include 3-4 resources (general conference talks, church articles, or well-known sermons)
- Return ONLY valid JSON, no markdown, no explanation`

  try {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ scriptures: [], resources: [] })
  }
}
