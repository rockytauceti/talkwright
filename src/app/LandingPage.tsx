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
    <main className="min-h-screen bg-[#1c1917] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <Logo size={26} theme="dark" />
          <span className="text-stone-100 font-semibold text-lg tracking-tight">TalkWright</span>
        </div>
        <Link
          href="/sign-in"
          className="text-sm text-stone-500 hover:text-stone-300 transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-stone-500 text-sm font-medium uppercase tracking-widest mb-6">
            Coming soon
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-stone-100 leading-tight mb-6">
            Craft talks that{' '}
            <span className="text-stone-300">actually land.</span>
          </h1>
          <p className="text-stone-400 text-lg sm:text-xl leading-relaxed mb-10">
            A better way to write, organize, and deliver your talks —
            from Sunday sermons to graduation speeches.
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-xl px-6 py-4 text-stone-300">
              <span className="text-stone-300">✓</span>
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
                className="flex-1 bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-stone-100 hover:bg-white text-stone-900 font-semibold rounded-xl px-6 py-3 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Joining…' : 'Get early access'}
              </button>
            </form>
          )}

          <p className="text-stone-700 text-xs mt-4">No spam. Ever.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-stone-700 text-xs">
        © {new Date().getFullYear()} TalkWright
      </footer>
    </main>
  )
}
