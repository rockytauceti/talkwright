'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type TalkStatus = 'draft' | 'final'

type OutlineSection = {
  label: string
  summary: string
  keyPoints: string[]
}

type Outline = {
  title?: string
  theme?: string
  sections: OutlineSection[]
  scriptureOrQuote?: string | null
  openingHook?: string
}

type Talk = {
  id: string
  title: string
  category: string
  status: TalkStatus
  body: string | null
  outline: Outline | null
  wordCount: number
  estimatedMinutes: number
}

const CATEGORY_LABELS: Record<string, string> = {
  lds_sacrament: 'Sacrament Meeting',
  lds_primary: 'Primary Talk',
  lds_funeral: 'Funeral',
  lds_conference: 'Conference Style',
  christian_sermon: 'Sermon',
  wedding_toast: 'Wedding Toast',
  eulogy: 'Eulogy',
  graduation: 'Graduation',
  ted_style: 'TED-style',
  motivational: 'Motivational',
  other: 'Other',
}

const LENGTH_OPTIONS = [
  { value: 3, label: '2–3 min' },
  { value: 7, label: '5–7 min' },
  { value: 15, label: '10–15 min' },
]

const TONE_OPTIONS = [
  { value: 'warm', label: 'Warm & personal' },
  { value: 'formal', label: 'Formal' },
  { value: 'inspirational', label: 'Inspirational' },
]

export default function TalkEditor({ initialTalk }: { initialTalk: Talk }) {
  const [title, setTitle] = useState(initialTalk.title)
  const [status, setStatus] = useState<TalkStatus>(initialTalk.status)
  const [outline, setOutline] = useState<Outline | null>(initialTalk.outline)
  const [draft, setDraft] = useState(initialTalk.body ?? '')
  const [wordCount, setWordCount] = useState(initialTalk.wordCount)
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialTalk.estimatedMinutes)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [outlineStreamText, setOutlineStreamText] = useState('')
  const [outlineError, setOutlineError] = useState('')
  const [outlineForm, setOutlineForm] = useState({
    theme: '',
    audience: '',
    length: 7,
    personalNotes: '',
  })

  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [draftStreamText, setDraftStreamText] = useState('')
  const [draftError, setDraftError] = useState('')
  const [tone, setTone] = useState('warm')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [draft])

  function scheduleSave(fields: Record<string, unknown>) {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await fetch(`/api/talks/${initialTalk.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      setSaveStatus('saved')
    }, 1000)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    scheduleSave({ title: val })
  }

  function handleDraftChange(val: string) {
    setDraft(val)
    const words = val.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    setEstimatedMinutes(Math.ceil(words / 130))
    scheduleSave({ body: val })
  }

  async function handleStatusToggle() {
    const next: TalkStatus = status === 'draft' ? 'final' : 'draft'
    setStatus(next)
    await fetch(`/api/talks/${initialTalk.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
  }

  async function generateOutline() {
    setIsGeneratingOutline(true)
    setOutlineError('')
    setOutlineStreamText('')

    try {
      const res = await fetch(`/api/talks/${initialTalk.id}/ai/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outlineForm),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        setOutlineStreamText(fullText)
      }

      const parsed: Outline = JSON.parse(fullText)
      setOutline(parsed)
      setOutlineStreamText('')

      if (parsed.title && (title === 'Untitled talk' || !title.trim())) {
        setTitle(parsed.title)
        scheduleSave({ title: parsed.title })
      }
    } catch (err) {
      setOutlineError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGeneratingOutline(false)
    }
  }

  async function generateDraft() {
    setIsGeneratingDraft(true)
    setDraftError('')
    setDraftStreamText('')

    try {
      const res = await fetch(`/api/talks/${initialTalk.id}/ai/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, personalNotes: outlineForm.personalNotes }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Generation failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        setDraftStreamText(fullText)
      }

      setDraft(fullText)
      setDraftStreamText('')
      const words = fullText.trim().split(/\s+/).filter(Boolean).length
      setWordCount(words)
      setEstimatedMinutes(Math.ceil(words / 130))
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGeneratingDraft(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-zinc-600 mb-4 inline-block"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-zinc-100 text-zinc-500 rounded-full px-2.5 py-1 font-medium">
            {CATEGORY_LABELS[initialTalk.category] ?? initialTalk.category}
          </span>
          <button
            onClick={handleStatusToggle}
            className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${
              status === 'final'
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}
          >
            {status}
          </button>
          {wordCount > 0 && (
            <span className="text-xs text-zinc-400">
              {wordCount} words · ~{estimatedMinutes}m
            </span>
          )}
          <span className="text-xs text-zinc-300 ml-auto">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? '●' : ''}
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          className="text-2xl font-bold text-zinc-900 w-full border-0 outline-none placeholder-zinc-300 bg-transparent"
          placeholder="Untitled talk"
        />
      </div>

      {/* Outline section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Outline
          </h2>
          {outline && !isGeneratingOutline && (
            <button
              onClick={() => setOutline(null)}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Regenerate
            </button>
          )}
        </div>

        {outline ? (
          <div className="space-y-3">
            {outline.openingHook && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">
                  Opening hook
                </p>
                <p className="text-sm text-zinc-700">{outline.openingHook}</p>
              </div>
            )}
            {outline.sections.map((section, i) => (
              <div key={i} className="border border-zinc-100 rounded-xl p-4">
                <p className="font-semibold text-zinc-900 text-sm mb-1">{section.label}</p>
                <p className="text-zinc-500 text-sm mb-2">{section.summary}</p>
                {section.keyPoints.length > 0 && (
                  <ul className="space-y-1">
                    {section.keyPoints.map((pt, j) => (
                      <li key={j} className="text-sm text-zinc-600 flex gap-2">
                        <span className="text-zinc-300 shrink-0 mt-0.5">–</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {outline.scriptureOrQuote && (
              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                  Scripture / Quote
                </p>
                <p className="text-sm text-zinc-600 italic">{outline.scriptureOrQuote}</p>
              </div>
            )}
          </div>
        ) : isGeneratingOutline ? (
          <div className="border border-zinc-100 rounded-xl p-8 text-center">
            <div className="animate-pulse text-amber-400 text-2xl mb-3">✦</div>
            <p className="text-sm text-zinc-500">Building your outline…</p>
            {outlineStreamText && (
              <p className="text-xs text-zinc-300 mt-2 font-mono truncate max-w-xs mx-auto">
                {outlineStreamText.slice(-50)}
              </p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1">
                  Theme / topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Faith in hard times"
                  value={outlineForm.theme}
                  onChange={e => setOutlineForm(f => ({ ...f, theme: e.target.value }))}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 block mb-1">Audience</label>
                <input
                  type="text"
                  placeholder="e.g. Young adults"
                  value={outlineForm.audience}
                  onChange={e => setOutlineForm(f => ({ ...f, audience: e.target.value }))}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-2">Length</label>
              <div className="flex gap-2">
                {LENGTH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setOutlineForm(f => ({ ...f, length: opt.value }))}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      outlineForm.length === opt.value
                        ? 'border-amber-400 bg-amber-50 text-amber-800 font-medium'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">
                Personal notes, stories, or scriptures
              </label>
              <textarea
                placeholder="Share anything personal you want woven in…"
                value={outlineForm.personalNotes}
                onChange={e => setOutlineForm(f => ({ ...f, personalNotes: e.target.value }))}
                rows={3}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>
            {outlineError && <p className="text-red-500 text-sm">{outlineError}</p>}
            <button
              onClick={generateOutline}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              Generate outline →
            </button>
          </div>
        )}
      </section>

      {/* Draft section */}
      <section className="pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Draft</h2>
          {draft && !isGeneratingDraft && (
            <button
              onClick={() => { setDraft(''); setWordCount(0); setEstimatedMinutes(0) }}
              className="text-xs text-zinc-400 hover:text-zinc-600"
            >
              Regenerate
            </button>
          )}
        </div>

        {!outline && !draft && !isGeneratingDraft ? (
          <div className="border-2 border-dashed border-zinc-100 rounded-xl p-8 text-center">
            <p className="text-sm text-zinc-400">
              Generate an outline first, then come back to write your draft.
            </p>
          </div>
        ) : isGeneratingDraft ? (
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-zinc-400">
              <span className="animate-pulse text-amber-400">✦</span>
              Writing your draft…
            </div>
            <div className="w-full min-h-96 border border-zinc-100 rounded-xl p-5 text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap">
              {draftStreamText}
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        ) : draft ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => handleDraftChange(e.target.value)}
            className="w-full min-h-96 border border-zinc-100 rounded-xl p-5 text-zinc-800 text-sm leading-relaxed focus:outline-none focus:border-zinc-200 resize-none"
            placeholder="Your draft will appear here…"
          />
        ) : (
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-2">Tone</label>
              <div className="flex gap-2 flex-wrap">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      tone === t.value
                        ? 'border-amber-400 bg-amber-50 text-amber-800 font-medium'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {draftError && <p className="text-red-500 text-sm">{draftError}</p>}
            <button
              onClick={generateDraft}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
              Generate draft from outline →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
