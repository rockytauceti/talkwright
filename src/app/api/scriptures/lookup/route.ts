import { NextRequest, NextResponse } from 'next/server'

const RAW = 'https://raw.githubusercontent.com/bcbooks/scriptures-json/master'

// Volume detection
const BOM_BOOKS = new Set([
  '1 nephi','2 nephi','jacob','enos','jarom','omni','words of mormon',
  'mosiah','alma','helaman','3 nephi','4 nephi','mormon','ether','moroni',
  '1ne','2ne','3ne','4ne','wom','morm',
])
const DC_PREFIXES = ['d&c','doctrine and covenants','doctrine&covenants','section']
const PGP_BOOKS = new Set(['moses','abraham','joseph smith—matthew','joseph smith—history','articles of faith','js-m','js-h','a of f','aof'])

type Volume = 'bom' | 'dc' | 'pgp'

function detectVolume(book: string): Volume | null {
  const b = book.toLowerCase().replace(/\s+/g, ' ').trim()
  if (BOM_BOOKS.has(b)) return 'bom'
  if (DC_PREFIXES.some(p => b.startsWith(p) || b === p)) return 'dc'
  if (PGP_BOOKS.has(b)) return 'pgp'
  return null
}

// Parse "Mosiah 3:19", "Alma 7:11-12", "D&C 76:22-24", "Moses 1:4"
function parseRef(ref: string) {
  const m = ref.trim().match(/^(.*?)\s+(\d+):(\d+)(?:[–\-](\d+))?$/i)
  if (!m) return null
  return {
    book: m[1].trim(),
    chapter: parseInt(m[2]),
    verseStart: parseInt(m[3]),
    verseEnd: m[4] ? parseInt(m[4]) : parseInt(m[3]),
  }
}

// Module-level cache (warm Lambda instances)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const volumeCache: Record<string, any> = {}

async function fetchVolume(volume: Volume) {
  if (volumeCache[volume]) return volumeCache[volume]
  const fileMap: Record<Volume, string> = {
    bom: 'book-of-mormon.json',
    dc:  'doctrine-and-covenants.json',
    pgp: 'pearl-of-great-price.json',
  }
  const res = await fetch(`${RAW}/${fileMap[volume]}`, { next: { revalidate: 86400 } })
  if (!res.ok) throw new Error(`Failed to fetch ${volume} data`)
  const data = await res.json()
  volumeCache[volume] = data
  return data
}

function normalizeBook(b: string) {
  return b.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findVerses(data: any, volume: Volume, book: string, chapter: number, verseStart: number, verseEnd: number) {
  if (volume === 'dc') {
    // D&C: sections array, chapter = section number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const section = data.sections.find((s: any) => s.section === chapter)
    if (!section) return null
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return section.verses.filter((v: any) => v.verse >= verseStart && v.verse <= verseEnd)
  }

  // BoM / PGP: books → chapters → verses
  const normBook = normalizeBook(book)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookData = data.books.find((b: any) => normalizeBook(b.book) === normBook)
  if (!bookData) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chapterData = bookData.chapters.find((c: any) => c.chapter === chapter)
  if (!chapterData) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return chapterData.verses.filter((v: any) => v.verse >= verseStart && v.verse <= verseEnd)
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')?.trim()
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  const parsed = parseRef(ref)
  if (!parsed) return NextResponse.json({ error: 'Could not parse reference' }, { status: 400 })

  const { book, chapter, verseStart, verseEnd } = parsed
  const volume = detectVolume(book)
  if (!volume) return NextResponse.json({ error: 'Not an LDS scripture reference' }, { status: 400 })

  try {
    const data = await fetchVolume(volume)
    const verses = findVerses(data, volume, book, chapter, verseStart, verseEnd)

    if (!verses || verses.length === 0) {
      return NextResponse.json({ error: `Verses not found: ${ref}` }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = verses.map((v: any) => v.text).join(' ')
    const canonicalRef = verses[0].reference + (verses.length > 1 ? `–${verseEnd}` : '')

    return NextResponse.json({ reference: canonicalRef, text, source: 'LDS Standard Works' })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
