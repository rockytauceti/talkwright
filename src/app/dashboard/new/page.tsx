'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { value: 'lds_sacrament', label: 'Sacrament Meeting', icon: '🕊️', desc: 'Sunday sacrament talk' },
  { value: 'lds_primary', label: 'Primary Talk', icon: '⭐', desc: 'Talk for children' },
  { value: 'lds_funeral', label: 'Funeral / Eulogy', icon: '🌿', desc: 'LDS funeral service' },
  { value: 'lds_conference', label: 'Conference Style', icon: '📖', desc: 'Formal doctrinal talk' },
  { value: 'christian_sermon', label: 'Sermon', icon: '✝️', desc: 'Christian sermon' },
  { value: 'wedding_toast', label: 'Wedding Toast', icon: '🥂', desc: 'Reception speech' },
  { value: 'eulogy', label: 'Eulogy', icon: '🕯️', desc: 'Memorial tribute' },
  { value: 'graduation', label: 'Graduation', icon: '🎓', desc: 'Graduation speech' },
  { value: 'ted_style', label: 'TED-style', icon: '💡', desc: 'Ideas-driven talk' },
  { value: 'motivational', label: 'Motivational', icon: '🔥', desc: 'Inspire and energize' },
  { value: 'other', label: 'Other', icon: '✦', desc: 'Custom talk type' },
]

export default function NewTalkPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createTalk() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/talks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title: title.trim() || 'Untitled talk' }),
      })
      if (!res.ok) throw new Error('Failed to create talk')
      const { talk } = await res.json()
      router.push(`/dashboard/talks/${talk.id}`)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const selected = CATEGORIES.find(c => c.value === category)

  return (
    <div className="max-w-2xl">
      {step === 1 ? (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900">What kind of talk?</h1>
            <p className="text-zinc-500 text-sm mt-1">Pick a category to get started.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setStep(2) }}
                className="text-left p-4 rounded-xl border-2 border-zinc-200 hover:border-amber-400 hover:bg-amber-50 transition-all"
              >
                <div className="text-2xl mb-2">{cat.icon}</div>
                <div className="font-semibold text-zinc-900 text-sm">{cat.label}</div>
                <div className="text-zinc-400 text-xs mt-0.5">{cat.desc}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setStep(1)}
            className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 flex items-center gap-1"
          >
            ← Back
          </button>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg px-3 py-1.5 text-sm font-medium mb-4">
              {selected?.icon} {selected?.label}
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Give it a title</h1>
            <p className="text-zinc-500 text-sm mt-1">You can always change this later.</p>
          </div>
          <input
            type="text"
            autoFocus
            placeholder="e.g. Faith in Hard Times"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && createTalk()}
            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-lg placeholder-zinc-300 focus:outline-none focus:border-amber-400 transition-colors mb-4"
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={createTalk}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl px-6 py-3 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create talk →'}
          </button>
        </>
      )}
    </div>
  )
}
