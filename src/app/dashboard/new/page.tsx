'use client'

import { useRouter } from 'next/navigation'

const CATEGORIES = [
  {
    value: 'lds_sacrament', label: 'Sacrament Meeting', desc: 'Sunday sacrament talk',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M8 22c0-4.4 3.6-8 8-8s8 3.6 8 8" /><path d="M16 14V8" /><path d="M12 8h8" />
        <rect x="10" y="22" width="12" height="4" rx="1" />
      </svg>
    ),
  },
  {
    value: 'lds_primary', label: 'Primary Talk', desc: 'Talk for children',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="16" cy="10" r="4" /><path d="M10 26v-4a6 6 0 0 1 12 0v4" />
        <path d="M16 2l1.2 2.4L20 5l-2 1.9.5 2.6L16 8.2l-2.5 1.3.5-2.6L12 5l2.8-.6z" />
      </svg>
    ),
  },
  {
    value: 'lds_funeral', label: 'Funeral / Eulogy', desc: 'LDS funeral service',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M16 4c-3 0-6 2.5-6 7 0 3 1.5 5.5 3 7l3 3 3-3c1.5-1.5 3-4 3-7 0-4.5-3-7-6-7z" />
        <path d="M10 26h12" /><path d="M13 26v-5" /><path d="M19 26v-5" />
      </svg>
    ),
  },
  {
    value: 'lds_conference', label: 'Conference Style', desc: 'Formal doctrinal talk',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <rect x="6" y="6" width="20" height="14" rx="2" />
        <path d="M6 12h20" /><path d="M11 6v6" /><path d="M16 20v6" /><path d="M12 26h8" />
      </svg>
    ),
  },
  {
    value: 'christian_sermon', label: 'Sermon', desc: 'Christian sermon',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M16 4v16" /><path d="M10 10h12" />
        <path d="M8 26h16" /><path d="M10 22l6 4 6-4" />
      </svg>
    ),
  },
  {
    value: 'wedding_toast', label: 'Wedding Toast', desc: 'Reception speech',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M11 6h4l2 10H9z" /><path d="M21 6h4l-4 10" /><path d="M13 16v6" /><path d="M19 16v6" />
        <path d="M10 22h12" /><path d="M16 4l.5-2" /><path d="M20 5l1-2" />
      </svg>
    ),
  },
  {
    value: 'eulogy', label: 'Eulogy', desc: 'Memorial tribute',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M16 6c-2 0-4 1.5-4 5 0 3 2 5 4 7 2-2 4-4 4-7 0-3.5-2-5-4-5z" />
        <path d="M16 18v4" /><ellipse cx="16" cy="25" rx="4" ry="1.5" /><path d="M12 28h8" />
      </svg>
    ),
  },
  {
    value: 'graduation', label: 'Graduation', desc: 'Graduation speech',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M16 8L4 14l12 6 12-6z" /><path d="M8 17v6c0 2 3.6 4 8 4s8-2 8-4v-6" />
        <path d="M28 14v6" /><circle cx="28" cy="21" r="1.5" />
      </svg>
    ),
  },
  {
    value: 'ted_style', label: 'TED-style', desc: 'Ideas-driven talk',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <circle cx="16" cy="13" r="5" />
        <path d="M16 18v3" /><path d="M13 24h6" />
        <path d="M10 8.5A8 8 0 0 1 22 8" /><path d="M8 13H6" /><path d="M26 13h-2" />
      </svg>
    ),
  },
  {
    value: 'motivational', label: 'Motivational', desc: 'Inspire and energize',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M18 4l-6 12h8l-6 12" />
      </svg>
    ),
  },
  {
    value: 'other', label: 'Other', desc: 'Custom talk type',
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
        <path d="M16 4l2 6h6l-5 4 2 6-5-3.5L11 20l2-6-5-4h6z" />
      </svg>
    ),
  },
]

export default function NewTalkPage() {
  const router = useRouter()

  async function createTalk(category: string) {
    const res = await fetch('/api/talks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title: 'Untitled talk' }),
    })
    if (res.ok) {
      const { talk } = await res.json()
      router.push(`/dashboard/talks/${talk.id}`)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E]">What kind of talk?</h1>
        <p className="text-[#1E1E1E]/40 text-sm mt-1">Pick a category to get started.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => createTalk(cat.value)}
            className="group text-left p-4 rounded-xl bg-[#E8F1F2] border border-[#3C3E3A]/15 hover:border-[#7A82AB]/50 hover:shadow-sm transition-all"
          >
            <div className="text-[#1E1E1E]/35 group-hover:text-[#7776BC] transition-colors mb-2.5">
              {cat.icon}
            </div>
            <div className="font-semibold text-[#1E1E1E] text-sm">{cat.label}</div>
            <div className="text-[#1E1E1E]/40 text-xs mt-0.5">{cat.desc}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
