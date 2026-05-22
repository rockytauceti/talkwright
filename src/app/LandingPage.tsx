'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-[#3C3E3A] border border-[#3C3E3A] rounded-2xl p-6 text-left">
      <div className="mb-4 text-[#7A82AB]">{icon}</div>
      <h3 className="text-[#E8F1F2] font-semibold text-base mb-2">{title}</h3>
      <p className="text-[#E8F1F2]/50 text-sm leading-relaxed">{body}</p>
    </div>
  )
}

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
    <main className="min-h-screen bg-[#1E1E1E] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <Logo size={26} theme="dark" />
          <span className="text-[#E8F1F2] font-semibold text-lg tracking-tight">TalkWright</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="text-sm text-[#E8F1F2]/40 hover:text-[#E8F1F2] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-sm bg-[#E8F1F2] hover:bg-white text-[#1E1E1E] font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-20 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#E8F1F2] leading-tight mb-6">
            Craft talks that{' '}
            <span className="text-[#7A82AB]">actually land.</span>
          </h1>
          <p className="text-[#E8F1F2]/55 text-lg sm:text-xl leading-relaxed mb-10">
            AI-powered outlines, scripture suggestions, and full drafts —
            for Sunday sermons, graduation speeches, and everything in between.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto bg-[#E8F1F2] hover:bg-white text-[#1E1E1E] font-semibold rounded-xl px-8 py-3.5 transition-colors text-base"
            >
              Start writing free
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto border border-[#3C3E3A] hover:border-[#7A82AB] text-[#E8F1F2]/50 hover:text-[#E8F1F2] font-medium rounded-xl px-8 py-3.5 transition-colors text-base"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto w-full px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h6M9 16h4M7 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/>
                <path d="M9 4h6a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2z"/>
              </svg>
            }
            title="Smart outlines in seconds"
            body="Tell us your theme, audience, and length. TalkWright builds a structured outline tailored to your talk — ready to edit or expand."
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            }
            title="Scripture & story suggestions"
            body="As you write your theme, relevant scripture passages and supporting resources surface automatically — no concordance required."
          />
          <FeatureCard
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
              </svg>
            }
            title="Full drafts from your notes"
            body="Add your personal stories and notes, then generate a complete draft in your voice. Edit, refine, and deliver with confidence."
          />
        </div>
      </div>

      {/* Email capture */}
      <div className="border-t border-[#3C3E3A] px-6 py-16 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-[#E8F1F2]/40 text-sm mb-6">
            Not ready to sign up? Stay in the loop.
          </p>
          {submitted ? (
            <div className="inline-flex items-center gap-2 bg-[#3C3E3A] border border-[#3C3E3A] rounded-xl px-6 py-4 text-[#E8F1F2]/70 text-sm">
              ✓ You&apos;re on the list.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-[#3C3E3A] border border-[#3C3E3A] rounded-xl px-4 py-3 text-[#E8F1F2] placeholder-[#E8F1F2]/25 focus:outline-none focus:border-[#7A82AB] transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#3C3E3A] hover:bg-[#7A82AB] text-[#E8F1F2] font-medium rounded-xl px-5 py-3 transition-colors disabled:opacity-50 whitespace-nowrap text-sm border border-[#7A82AB]/30"
              >
                {loading ? 'Joining…' : 'Notify me'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-[#E8F1F2]/20 text-xs">
        © {new Date().getFullYear()} TalkWright
      </footer>
    </main>
  )
}