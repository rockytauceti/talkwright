import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// POST /api/user/voice-profile/upload
// Extracts plain text from a .docx or .pdf file for voice profile generation.
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
    const result = await pdfParse(buffer)
    text = result.text
  } else {
    return NextResponse.json({ error: 'Unsupported file type. Use .txt, .docx, or .pdf' }, { status: 400 })
  }

  text = text.replace(/\r\n/g, '\n').replace(/[ \t]{3,}/g, '  ').trim()

  return NextResponse.json({ text })
}
