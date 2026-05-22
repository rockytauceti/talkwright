'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <Logo size={28} theme="dark" />
          <span className="text-white font-semibold text-lg tracking-tight">TalkWright</span>
        </div>
        <Link
          href="/sign-in"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest mb-6">
            Coming soon
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Craft talks that{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              actually land.
            </span>
          </h1>
          <p className="text-zinc-400 text-lg sm:text-xl leading-relaxed mb-10">
            A better way to write, organize, and deliver your talks —
            from Sunday sermons to graduation speeches.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-xl px-6 py-4 text-zinc-300">
              <span className="text-amber-400">✓</span>
              You&apos;re on the list. We&apos;ll be in touch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl px-6 py-3 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Joining…' : 'Get early access'}
              </button>
            </form>
          )}

          <p className="text-zinc-600 text-xs mt-4">No spam. Ever.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-zinc-600 text-xs">
        © {new Date().getFullYear()} TalkWright
      </footer>
    </main>
  )
}
