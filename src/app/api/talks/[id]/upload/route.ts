import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/talks/[id]/upload
// Accepts a .txt, .docx, or .pdf file and returns extracted plain text.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    // Verify talk ownership
    const talk = await prisma.talk.findFirst({ where: { id, userId: user.id } })
    if (!talk) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const fileName = file.name.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    let text = ''

    if (fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8')
    } else if (fileName.endsWith('.docx')) {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (fileName.endsWith('.pdf')) {
      // Use direct path import to avoid Next.js module resolution issues with pdf-parse
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const result = await pdfParse(buffer)
      text = result.text
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use .txt, .docx, or .pdf' }, { status: 400 })
    }

    // Normalize whitespace
    text = text.replace(/\r\n/g, '\n').replace(/[ \t]{3,}/g, '  ').trim()

    return NextResponse.json({ text })
  } catch (e) {
    if (e instanceof Response) return e
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 })
  }
}
