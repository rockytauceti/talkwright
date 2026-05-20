import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'

// GET /api/talks/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const talk = await prisma.talk.findFirst({
      where: { id, userId: user.id },
    })

    if (!talk) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ talk })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/talks/[id] — update talk fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()

    // Verify ownership
    const existing = await prisma.talk.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { title, body: talkBody, outline, notes, tags, status, category } = body

    // Compute word count + estimated minutes if body is provided
    let wordCount = existing.wordCount
    let estimatedMinutes = existing.estimatedMinutes
    if (typeof talkBody === 'string') {
      const words = talkBody.trim().split(/\s+/).filter(Boolean).length
      wordCount = words
      estimatedMinutes = Math.ceil(words / 130) // ~130 wpm average speaking pace
    }

    const talk = await prisma.talk.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(talkBody !== undefined && { body: talkBody, wordCount, estimatedMinutes }),
        ...(outline !== undefined && { outline }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
      },
    })

    return NextResponse.json({ talk })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE /api/talks/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    const existing = await prisma.talk.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.talk.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
