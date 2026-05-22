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

type Scripture = {
  reference: string
  text: string
  matchWords: string[]
}

type Resource = {
  title: string
  description: string
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

const AUDIENCE_PRESETS = [
  'General congregation',
  'Youth',
  'Young adults',
  'Adults',
  'Children',
  'Families',
]

const TONE_OPTIONS = [
  { value: 'warm', label: 'Warm & personal' },
  { value: 'formal', label: 'Formal' },
  { value: 'inspirational', label: 'Inspirational' },
]

function HighlightedText({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'))
  const lowerWords = words.map(w => w.toLowerCase())
  return (
    <>
      {parts.map((part, i) =>
        lowerWords.some(w => part.toLowerCase() === w) ? (
          <mark key={i} className="bg-stone-200 text-[#1E1E1E] not-italic rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export default function TalkEditor({ initialTalk }: { initialTalk: Talk }) {
  const [title, setTitle] = useState(initialTalk.title)
  const [status, setStatus] = useState<TalkStatus>(initialTalk.status)
  const [outline, setOutline] = useState<Outline | null>(initialTalk.outline)
  const [draft, setDraft] = useState(initialTalk.body ?? '')
  const [wordCount, setWordCount] = useState(initialTalk.wordCount)
  const [estimatedMinutes, setEstimatedMinutes] = useState(initialTalk.estimatedMinutes)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')

  // Outline form
  const [outlineForm, setOutlineForm] = useState({
    theme: '',
    audience: 'General congregation',
    customAudience: '',
    length: 7,
    personalNotes: '',
  })
  const [useCustomAudience, setUseCustomAudience] = useState(false)

  // Scripture suggestions
  const [scriptures, setScriptures] = useState<Scripture[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loadingScriptures, setLoadingScriptures] = useState(false)
  const scriptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Outline generation
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)
  const [outlineStreamText, setOutlineStreamText] = useState('')
  const [outlineError, setOutlineError] = useState('')

  // Draft generation
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

  function handleThemeChange(val: string) {
    setOutlineForm(f => ({ ...f, theme: val }))
    if (scriptureTimer.current) clearTimeout(scriptureTimer.current)
    if (!val.trim()) {
      setScriptures([])
      setResources([])
      return
    }
    scriptureTimer.current = setTimeout(async () => {
      setLoadingScriptures(true)
      try {
        const res = await fetch(`/api/talks/${initialTalk.id}/ai/scriptures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: val }),
        })
        if (res.ok) {
          const data = await res.json()
          setScriptures(data.scriptures ?? [])
          setResources(data.resources ?? [])
        }
      } finally {
        setLoadingScriptures(false)
      }
    }, 800)
  }

  function addScriptureToNotes(reference: string, text: string) {
    const entry = `${reference}\n${text}`
    const current = outlineForm.personalNotes.trim()
    setOutlineForm(f => ({
      ...f,
      personalNotes: current ? `${current}\n\n${entry}` : entry,
    }))
  }

  async function generateOutline() {
    setIsGeneratingOutline(true)
    setOutlineError('')
    setOutlineStreamText('')

    const audience = useCustomAudience
      ? outlineForm.customAudience
      : outlineForm.audience

    try {
      const res = await fetch(`/api/talks/${initialTalk.id}/ai/outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...outlineForm, audience }),
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
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">Outline</h2>
          {outline && !isGeneratingOutline && (
            <button onClick={() => setOutline(null)} className="text-xs text-zinc-400 hover:text-zinc-600">
              Regenerate
            </button>
          )}
        </div>

        {outline ? (
          <div className="space-y-3">
            {outline.openingHook && (
              <div className="bg-[#E8F1F2] border border-[#3C3E3A]/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-[#1E1E1E]/65 uppercase tracking-wide mb-1">Opening hook</p>
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
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Scripture / Quote</p>
                <p className="text-sm text-zinc-600 italic">{outline.scriptureOrQuote}</p>
              </div>
            )}
          </div>
        ) : isGeneratingOutline ? (
          <div className="border border-zinc-100 rounded-xl p-8 text-center">
            <div className="animate-pulse text-[#1E1E1E]/45 text-2xl mb-3">✦</div>
            <p className="text-sm text-zinc-500">Building your outline…</p>
            {outlineStreamText && (
              <p className="text-xs text-zinc-300 mt-2 font-mono truncate max-w-xs mx-auto">
                {outlineStreamText.slice(-50)}
              </p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-6 space-y-5">
            {/* Theme */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Theme / topic</label>
              <input
                type="text"
                placeholder="e.g. Faith in hard times"
                value={outlineForm.theme}
                onChange={e => handleThemeChange(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#1E1E1E]"
              />
            </div>

            {/* Audience */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-2">Audience</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_PRESETS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setUseCustomAudience(false)
                      setOutlineForm(f => ({ ...f, audience: opt }))
                    }}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      !useCustomAudience && outlineForm.audience === opt
                        ? 'border-[#1E1E1E] bg-[#E8F1F2] text-[#1E1E1E] font-medium'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  onClick={() => setUseCustomAudience(true)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    useCustomAudience
                      ? 'border-[#1E1E1E] bg-[#E8F1F2] text-[#1E1E1E] font-medium'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300'
                  }`}
                >
                  Custom…
                </button>
              </div>
              {useCustomAudience && (
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. High school seniors"
                  value={outlineForm.customAudience}
                  onChange={e => setOutlineForm(f => ({ ...f, customAudience: e.target.value }))}
                  className="mt-2 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#1E1E1E]"
                />
              )}
            </div>

            {/* Length slider */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-2">
                Length —{' '}
                <span className="text-zinc-900 font-semibold">{outlineForm.length} min</span>
              </label>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={outlineForm.length}
                onChange={e => setOutlineForm(f => ({ ...f, length: Number(e.target.value) }))}
                className="w-full accent-[#7776BC]"
              />
              <div className="flex justify-between text-xs text-zinc-300 mt-1 select-none">
                <span>2m</span><span>10m</span><span>20m</span><span>30m</span>
              </div>
            </div>

            {/* Personal notes */}
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">
                Personal notes, stories, or scriptures
              </label>
              <textarea
                placeholder="Share anything personal you want woven in…"
                value={outlineForm.personalNotes}
                onChange={e => setOutlineForm(f => ({ ...f, personalNotes: e.target.value }))}
                rows={3}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-300 focus:outline-none focus:border-[#1E1E1E] resize-none"
              />
            </div>

            {/* Scripture suggestions */}
            {(loadingScriptures || scriptures.length > 0) && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Suggested scriptures
                  <span className="normal-case font-normal ml-1 text-zinc-300">
                    — click to add to notes
                  </span>
                </p>
                {loadingScriptures ? (
                  <div className="text-xs text-zinc-400 animate-pulse py-2">
                    Finding relevant scriptures…
                  </div>
                ) : (
                  scriptures.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addScriptureToNotes(s.reference, s.text)}
                      className="w-full text-left border border-zinc-100 hover:border-[#3C3E3A]/25 hover:bg-[#E8F1F2]/60 rounded-lg p-3 transition-colors group"
                    >
                      <p className="text-xs font-semibold text-zinc-700 group-hover:text-[#1E1E1E] mb-1">
                        {s.reference}
                      </p>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        <HighlightedText text={s.text} words={s.matchWords} />
                      </p>
                    </button>
                  ))
                )}

                {resources.length > 0 && !loadingScriptures && (
                  <>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide pt-2">
                      Related resources
                    </p>
                    {resources.map((r, i) => (
                      <div key={i} className="border border-zinc-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-zinc-700 mb-0.5">{r.title}</p>
                        <p className="text-xs text-zinc-400">{r.description}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {outlineError && <p className="text-red-500 text-sm">{outlineError}</p>}
            <button
              onClick={generateOutline} disabled={isGeneratingOutline}
              className="bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors"
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
              <span className="animate-pulse text-[#1E1E1E]/45">✦</span>
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
                        ? 'border-[#1E1E1E] bg-[#E8F1F2] text-[#1E1E1E] font-medium'
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

