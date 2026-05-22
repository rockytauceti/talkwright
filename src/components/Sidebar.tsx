'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Logo from '@/components/Logo'

type Talk = {
  id: string
  title: string
  category: string
  status: string
  updatedAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  lds_sacrament: 'Sacrament',
  lds_primary: 'Primary',
  lds_funeral: 'Funeral',
  lds_conference: 'Conference',
  christian_sermon: 'Sermon',
  wedding_toast: 'Wedding Toast',
  eulogy: 'Eulogy',
  graduation: 'Graduation',
  ted_style: 'TED-style',
  motivational: 'Motivational',
  other: 'Other',
}

function TalkLink({ talk, active }: { talk: Talk; active: boolean }) {
  return (
    <Link
      href={`/dashboard/talks/${talk.id}`}
      className={`group flex flex-col px-2.5 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-[#7776BC]/12 text-[#7776BC]'
          : 'text-[#1E1E1E]/60 hover:bg-[#3C3E3A]/6 hover:text-[#1E1E1E]'
      }`}
    >
      <span className="text-sm font-medium truncate leading-snug">
        {talk.title || 'Untitled talk'}
      </span>
      <span className={`text-[10px] truncate mt-0.5 ${active ? 'text-[#7776BC]/60' : 'text-[#1E1E1E]/30'}`}>
        {CATEGORY_LABELS[talk.category] ?? talk.category}
      </span>
    </Link>
  )
}

export default function Sidebar() {
  const [talks, setTalks] = useState<Talk[]>([])
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/talks')
      .then(r => r.ok ? r.json() : { talks: [] })
      .then(d => setTalks(d.talks ?? []))
  }, [pathname])

  const inProgress = talks.filter(t => t.status !== 'final')
  const finished = talks.filter(t => t.status === 'final')

  return (
    <aside className="hidden sm:flex flex-col w-56 shrink-0 border-r border-[#3C3E3A]/10 bg-[#E8F1F2] h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <Logo size={20} theme="light" />
          <span className="font-bold text-[#1E1E1E] text-sm tracking-tight">TalkWright</span>
        </Link>
      </div>

      {/* New talk */}
      <div className="px-3 pb-4">
        <Link
          href="/dashboard/new"
          className="flex items-center justify-center gap-1.5 w-full bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] text-sm font-semibold rounded-lg px-3 py-2 transition-colors"
        >
          <span className="text-base leading-none font-light">+</span>
          New talk
        </Link>
      </div>

      {/* Talk list */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 pb-4">
        {inProgress.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-[#1E1E1E]/30 uppercase tracking-wider px-2.5 mb-1.5">
              In Progress
            </p>
            <div className="space-y-0.5">
              {inProgress.map(t => (
                <TalkLink key={t.id} talk={t} active={pathname === `/dashboard/talks/${t.id}`} />
              ))}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section>
            <p className="text-[10px] font-semibold text-[#1E1E1E]/30 uppercase tracking-wider px-2.5 mb-1.5">
              Finished
            </p>
            <div className="space-y-0.5">
              {finished.map(t => (
                <TalkLink key={t.id} talk={t} active={pathname === `/dashboard/talks/${t.id}`} />
              ))}
            </div>
          </section>
        )}

        {talks.length === 0 && (
          <p className="text-xs text-[#1E1E1E]/25 px-2.5 pt-2">No talks yet.</p>
        )}
      </nav>

      {/* Settings + User */}
      <div className="border-t border-[#3C3E3A]/10">
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-2.5 px-4 py-3 text-xs transition-colors ${
            pathname === '/dashboard/settings'
              ? 'text-[#7776BC] bg-[#7776BC]/6'
              : 'text-[#1E1E1E]/40 hover:text-[#1E1E1E]/70 hover:bg-[#3C3E3A]/5'
          }`}
        >
          <span>⚙</span>
          <span>Settings</span>
        </Link>
        <div className="px-4 py-3 flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-[#1E1E1E]/40 truncate">Account</span>
        </div>
      </div>
    </aside>
  )
}