import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { TalkCategory } from '@prisma/client'

// GET /api/talks — list user's talks
export async function GET() {
  try {
    const user = await requireUser()

    const talks = await prisma.talk.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        wordCount: true,
        estimatedMinutes: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ talks })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST /api/talks — create a new talk
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()

    const { title, category } = body

    if (!category || !Object.values(TalkCategory).includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const talk = await prisma.talk.create({
      data: {
        userId: user.id,
        title: title || 'Untitled talk',
        category,
        tags: [],
      },
    })

    return NextResponse.json({ talk }, { status: 201 })
  } catch (e) {
    if (e instanceof Response) return e
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
