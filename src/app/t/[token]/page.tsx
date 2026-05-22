import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

const CATEGORY_LABELS: Record<string, string> = {
  lds_sacrament: 'Sacrament Meeting', lds_primary: 'Primary Talk', lds_funeral: 'Funeral',
  lds_conference: 'Conference Style', christian_sermon: 'Sermon', wedding_toast: 'Wedding Toast',
  eulogy: 'Eulogy', graduation: 'Graduation', ted_style: 'TED-style', motivational: 'Motivational', other: 'Other',
}

type Resource = {
  id: string; type: string; text: string
  reference?: string; attribution?: string; title?: string; source?: string
}

export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params
  const talk = await prisma.talk.findFirst({ where: { shareToken: token, isPublic: true } })
  if (!talk) return { title: 'Talk not found' }
  return {
    title: `${talk.title} — TalkWright`,
    description: `A ${CATEGORY_LABELS[talk.category] ?? talk.category} written with TalkWright`,
  }
}

export default async function PublicTalkPage(
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const talk = await prisma.talk.findFirst({
    where: { shareToken: token, isPublic: true },
    include: { user: { select: { email: true } } },
  })

  if (!talk) notFound()

  const resources = ((talk.metadata as { resources?: Resource[] } | null)?.resources ?? [])
  const scriptures = resources.filter(r => r.type === 'scripture')
  const quotes = resources.filter(r => r.type === 'quote')
  const conferenceRefs = resources.filter(r => r.type === 'conference_talk')

  return (
    <div className="min-h-screen bg-[#E8F1F2]">
      {/* Nav */}
      <header className="border-b border-[#3C3E3A]/10 bg-[#E8F1F2]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="https://talkwright.com" className="text-sm font-semibold text-[#1E1E1E]/50 hover:text-[#1E1E1E] transition-colors">
            TalkWright
          </a>
          <a
            href="https://talkwright.com"
            className="text-xs bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-medium rounded-lg px-3 py-1.5 transition-colors"
          >
            Write your own
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs bg-[#3C3E3A]/10 text-[#3C3E3A]/60 rounded-full px-2.5 py-1 font-medium">
            {CATEGORY_LABELS[talk.category] ?? talk.category}
          </span>
          {talk.estimatedMinutes > 0 && (
            <span className="text-xs text-[#1E1E1E]/35">~{talk.estimatedMinutes} min read</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-[#1E1E1E] mb-10 leading-tight">{talk.title}</h1>

        {/* Body */}
        {talk.body ? (
          <div className="prose prose-stone max-w-none text-[#1E1E1E]/80 leading-relaxed text-base whitespace-pre-wrap mb-12">
            {talk.body}
          </div>
        ) : (
          <p className="text-[#1E1E1E]/30 italic mb-12">No content yet.</p>
        )}

        {/* Sources */}
        {(scriptures.length > 0 || quotes.length > 0 || conferenceRefs.length > 0) && (
          <div className="border-t border-[#3C3E3A]/10 pt-8 space-y-6">
            <h2 className="text-xs font-semibold text-[#1E1E1E]/35 uppercase tracking-wider">Sources</h2>

            {scriptures.length > 0 && (
              <div className="space-y-2">
                {scriptures.map(r => (
                  <div key={r.id} className="flex gap-3">
                    <span className="text-xs font-semibold text-[#7776BC] min-w-[120px] pt-0.5">{r.reference}</span>
                    <p className="text-sm text-[#1E1E1E]/60 italic">{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {quotes.length > 0 && (
              <div className="space-y-3">
                {quotes.map(r => (
                  <div key={r.id} className="bg-[#3C3E3A]/5 rounded-xl p-4">
                    <p className="text-sm text-[#1E1E1E]/70 italic mb-1">&ldquo;{r.text}&rdquo;</p>
                    {r.attribution && <p className="text-xs text-[#1E1E1E]/40">— {r.attribution}</p>}
                  </div>
                ))}
              </div>
            )}

            {conferenceRefs.length > 0 && (
              <div className="space-y-2">
                {conferenceRefs.map(r => (
                  <div key={r.id}>
                    {r.title && <p className="text-sm font-medium text-[#1E1E1E]/65">{r.title}</p>}
                    {r.source && <p className="text-xs text-[#1E1E1E]/35">{r.source}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-16 border border-[#7776BC]/20 bg-[#7776BC]/5 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-[#1E1E1E]/70 mb-1">Written with TalkWright</p>
          <p className="text-xs text-[#1E1E1E]/40 mb-4">AI-assisted talk writing for speakers who want to actually land.</p>
          <a
            href="https://talkwright.com"
            className="inline-block text-sm bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-semibold rounded-lg px-5 py-2.5 transition-colors"
          >
            Write your own talk
          </a>
        </div>
      </main>
    </div>
  )
}
