import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'

interface Talk {
  id: string
  title: string
  category: string
  created_at: string
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  sacrament: 'Sacrament Meeting',
  primary: 'Primary Talk',
  funeral: 'Funeral / Eulogy',
  conference: 'Conference Style',
  graduation: 'Graduation Speech',
  motivational: 'Motivational',
  ted: 'TED-style',
  sermon: 'Sermon',
  other: 'Other',
}

export default async function DashboardPage() {
  const { userId } = await auth()

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  const talks: Talk[] = user
    ? (await supabaseAdmin
        .from('talks')
        .select('id, title, category, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
      ).data ?? []
    : []

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Your talks</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {talks.length} {talks.length === 1 ? 'talk' : 'talks'}
        </p>
      </div>

      {talks.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">✦</div>
          <h2 className="text-lg font-semibold text-zinc-900 mb-2">No talks yet</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Write your first talk — the AI will help you every step of the way.
          </p>
          <Link
            href="/dashboard/new"
            className="inline-flex bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
          >
            Write your first talk
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {talks.map((talk) => (
            <Link
              key={talk.id}
              href={`/dashboard/talks/${talk.id}`}
              className="group block bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl p-5 transition-all hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors truncate">
                    {talk.title || 'Untitled talk'}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-0.5">
                    {CATEGORY_LABELS[talk.category] ?? talk.category}
                  </p>
                </div>
                <span className="text-zinc-300 text-sm whitespace-nowrap">
                  {new Date(talk.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
