import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const CATEGORY_LABELS: Record<string, string> = {
  lds_sacrament: 'Sacrament Meeting',
  lds_primary: 'Primary Talk',
  lds_funeral: 'Funeral / Eulogy',
  lds_conference: 'Conference Style',
  christian_sermon: 'Sermon',
  wedding_toast: 'Wedding Toast',
  eulogy: 'Eulogy',
  graduation: 'Graduation Speech',
  ted_style: 'TED-style',
  motivational: 'Motivational',
  other: 'Other',
}

export default async function DashboardPage() {
  const { userId: clerkUserId } = await auth()

  const user = await prisma.user.findUnique({
    where: { clerkUserId: clerkUserId! },
    include: {
      talks: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          wordCount: true,
          estimatedMinutes: true,
          updatedAt: true,
        },
      },
    },
  })

  const talks = user?.talks ?? []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">Your talks</h1>
        <p className="text-[#1E1E1E]/40 text-sm mt-1">
          {talks.length} {talks.length === 1 ? 'talk' : 'talks'}
        </p>
      </div>

      {talks.length === 0 ? (
        <div className="border-2 border-dashed border-[#3C3E3A]/20 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4 text-[#7A82AB]">✦</div>
          <h2 className="text-lg font-semibold text-[#1E1E1E] mb-2">No talks yet</h2>
          <p className="text-[#1E1E1E]/40 text-sm mb-6">
            Write your first talk — the AI will help you every step of the way.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Write your first talk
          </Link>
        </div>
      ) : (
        <div className="grid gap-2">
          {talks.map((talk) => (
            <Link
              key={talk.id}
              href={`/dashboard/talks/${talk.id}`}
              className="group block bg-white border border-[#3C3E3A]/15 hover:border-[#7A82AB]/40 rounded-xl p-5 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#1E1E1E] group-hover:text-[#3C3E3A] transition-colors truncate">
                    {talk.title || 'Untitled talk'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[#1E1E1E]/40 text-sm">
                      {CATEGORY_LABELS[talk.category] ?? talk.category}
                    </p>
                    {talk.wordCount > 0 && (
                      <>
                        <span className="text-[#3C3E3A]/30">·</span>
                        <p className="text-[#1E1E1E]/40 text-sm">
                          {talk.wordCount} words · ~{talk.estimatedMinutes}m
                        </p>
                      </>
                    )}
                    <span className="text-[#3C3E3A]/30">·</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      talk.status === 'final'
                        ? 'bg-[#7776BC]/15 text-[#7776BC]'
                        : 'bg-[#3C3E3A]/10 text-[#3C3E3A]/50'
                    }`}>
                      {talk.status}
                    </span>
                  </div>
                </div>
                <span className="text-[#1E1E1E]/25 text-sm whitespace-nowrap shrink-0">
                  {new Date(talk.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}