'use client'

import { useState, useRef, useEffect } from 'react'
import ResourcesPanel, { Resource as TalkResource } from '@/components/ResourcesPanel'

type TalkStatus = 'draft' | 'final'

type OutlineSection = { label: string; summary: string; keyPoints: string[] }
type Outline = { title?: string; theme?: string; sections: OutlineSection[]; scriptureOrQuote?: string | null; openingHook?: string }
type Scripture = { reference: string; text: string; matchWords: string[] }
type WebResource = { title: string; description: string }
type Starter = { title: string; hook: string; approach: string }

type Talk = {
  id: string; title: string; category: string; status: TalkStatus
  body: string | null; outline: Outline | null
  wordCount: number; estimatedMinutes: number
  metadata?: { resources?: TalkResource[] } | null
  isPublic: boolean; shareToken: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  lds_sacrament: 'Sacrament Meeting', lds_primary: 'Primary Talk', lds_funeral: 'Funeral',
  lds_conference: 'Conference Style', christian_sermon: 'Sermon', wedding_toast: 'Wedding Toast',
  eulogy: 'Eulogy', graduation: 'Graduation', ted_style: 'TED-style', motivational: 'Motivational', other: 'Other',
}

const AUDIENCE_PRESETS = ['General congregation', 'Youth', 'Young adults', 'Adults', 'Children', 'Families']
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
        lowerWords.some(w => part.toLowerCase() === w)
          ? <mark key={i} className="bg-[#7A82AB]/20 text-[#1E1E1E] not-italic rounded px-0.5">{part}</mark>
          : part
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
  const [isPublic, setIsPublic] = useState(initialTalk.isPublic)
  const [shareToken, setShareToken] = useState<string | null>(initialTalk.shareToken)
  const [copied, setCopied] = useState(false)
  const [outlineCopied, setOutlineCopied] = useState(false)

  // User resources
  const [talkResources, setTalkResources] = useState<TalkResource[]>(
    (initialTalk.metadata?.resources ?? []) as TalkResource[]
  )

  // Outline form
  const [outlineForm, setOutlineForm] = useState({ theme: '', audience: 'General congregation', customAudience: '', length: 7 })
  const [useCustomAudience, setUseCustomAudience] = useState(false)

  // Scripture / web suggestions
  const [scriptures, setScriptures] = useState<Scripture[]>([])
  const [suggestedResources, setSuggestedResources] = useState<WebResource[]>([])
  const [loadingScriptures, setLoadingScriptures] = useState(false)
  const scriptureTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Getting started suggestions
  const [starters, setStarters] = useState<Starter[] | null>(null)
  const [loadingStarters, setLoadingStarters] = useState(false)

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

  function handleResourcesChange(updated: TalkResource[]) {
    setTalkResources(updated)
    scheduleSave({ metadata: { resources: updated } })
  }

  function handleTitleChange(val: string) { setTitle(val); scheduleSave({ title: val }) }

  function handleDraftChange(val: string) {
    setDraft(val)
    const words = val.trim().split(/\s+/).filter(Boolean).length
    setWordCount(words)
    setEstimatedMinutes(Math.ceil(words / 120))
    scheduleSave({ body: val })
  }

  async function handleStatusToggle() {
    const next: TalkStatus = status === 'draft' ? 'final' : 'draft'
    setStatus(next)
    await fetch(`/api/talks/${initialTalk.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
  }

  async function handlePublishToggle() {
    const next = !isPublic
    setIsPublic(next)
    const res = await fetch(`/api/talks/${initialTalk.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: next }),
    })
    const data = await res.json()
    if (data.talk?.shareToken) setShareToken(data.talk.shareToken)
  }

  function copyPublicLink() {
    if (!shareToken) return
    navigator.clipboard.writeText(`${window.location.origin}/t/${shareToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }


  function handleThemeChange(val: string) {
    setOutlineForm(f => ({ ...f, theme: val }))
    setStarters(null)
    if (scriptureTimer.current) clearTimeout(scriptureTimer.current)
    if (!val.trim()) { setScriptures([]); setSuggestedResources([]); return }
    scriptureTimer.current = setTimeout(async () => {
      setLoadingScriptures(true)
      try {
        const res = await fetch(`/api/talks/${initialTalk.id}/ai/scriptures`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: val }),
        })
        if (res.ok) {
          const data = await res.json()
          setScriptures(data.scriptures ?? [])
          setSuggestedResources(data.resources ?? [])
        }
      } finally { setLoadingScriptures(false) }
    }, 800)
  }

  function addScriptureAsResource(reference: string, text: string) {
    const newRes: TalkResource = {
      id: Math.random().toString(36).slice(2),
      type: 'scripture',
      text,
      reference,
    }
    const updated = [...talkResources, newRes]
    setTalkResources(updated)
    scheduleSave({ metadata: { resources: updated } })
  }

  async function getStarters() {
    setLoadingStarters(true)
    setStarters(null)
    try {
      const audience = useCustomAudience ? outlineForm.customAudience : outlineForm.audience
      const res = await fetch(`/api/talks/${initialTalk.id}/ai/starter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: outlineForm.theme, audience, resources: talkResources }),
      })
      const data = await res.json()
      setStarters(data.starters ?? [])
    } finally { setLoadingStarters(false) }
  }

  function applyStarter(s: Starter) {
    const newRes: TalkResource = {
      id: Math.random().toString(36).slice(2),
      type: 'note',
      text: `Opening: ${s.hook}\n\nApproach: ${s.approach}`,
    }
    const updated = [...talkResources, newRes]
    setTalkResources(updated)
    scheduleSave({ metadata: { resources: updated } })
    setStarters(null)
  }

  function copyOutline() {
    if (!outline) return
    const parts: string[] = []
    if (outline.title) parts.push(`# ${outline.title}`)
    if (outline.theme) parts.push(`Theme: ${outline.theme}`)
    if (outline.openingHook) parts.push(`\nOpening hook:\n${outline.openingHook}`)
    parts.push('')
    for (const s of (outline.sections ?? [])) {
      parts.push(`## ${s.label}`)
      parts.push(s.summary)
      for (const pt of s.keyPoints) parts.push(`- ${pt}`)
      parts.push('')
    }
    if (outline.scriptureOrQuote) parts.push(`"${outline.scriptureOrQuote}"`)
    navigator.clipboard.writeText(parts.join('\n'))
    setOutlineCopied(true)
    setTimeout(() => setOutlineCopied(false), 2000)
  }

  async function generateOutline() {
    setIsGeneratingOutline(true)
    setOutlineError('')
    setOutlineStreamText('')
    const audience = useCustomAudience ? outlineForm.customAudience : outlineForm.audience
    try {
      const res = await fetch(`/api/talks/${initialTalk.id}/ai/outline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...outlineForm, audience, resources: talkResources }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Generation failed') }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        setOutlineStreamText(fullText)
      }
      const jsonStart = fullText.indexOf('{')
      const jsonEnd = fullText.lastIndexOf('}')
      const cleanText = (jsonStart !== -1 && jsonEnd > jsonStart) ? fullText.slice(jsonStart, jsonEnd + 1) : fullText
      const parsed = JSON.parse(cleanText)
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error(parsed.error || 'Failed to generate outline — please try again')
      }
      setOutline(parsed as Outline)
      setOutlineStreamText('')
      if (parsed.title && (title === 'Untitled talk' || !title.trim())) {
        setTitle(parsed.title)
        scheduleSave({ title: parsed.title })
      }
    } catch (err) {
      setOutlineError(err instanceof Error ? err.message : 'Generation failed')
    } finally { setIsGeneratingOutline(false) }
  }

  async function generateDraft() {
    setIsGeneratingDraft(true)
    setDraftError('')
    setDraftStreamText('')
    try {
      const res = await fetch(`/api/talks/${initialTalk.id}/ai/draft`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, resources: talkResources }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Generation failed') }
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
      setEstimatedMinutes(Math.ceil(words / 120))
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Generation failed')
    } finally { setIsGeneratingDraft(false) }
  }

  return (
    <div className="max-w-2xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-[#3C3E3A]/10 text-[#3C3E3A]/60 rounded-full px-2.5 py-1 font-medium">
            {CATEGORY_LABELS[initialTalk.category] ?? initialTalk.category}
          </span>
          <button
            onClick={handleStatusToggle}
            className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${
              status === 'final'
                ? 'bg-[#7776BC]/15 text-[#7776BC]'
                : 'bg-[#3C3E3A]/8 text-[#3C3E3A]/50 hover:bg-[#3C3E3A]/15'
            }`}
          >
            {status === 'final' ? 'Finished' : 'In progress'}
          </button>
          {wordCount > 0 && (
            <span className="text-xs text-[#1E1E1E]/35">{wordCount} words · ~{estimatedMinutes}m</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#1E1E1E]/20">
              {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? '●' : ''}
            </span>
            <button
              onClick={handlePublishToggle}
              className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${
                isPublic
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-[#3C3E3A]/8 text-[#3C3E3A]/50 hover:bg-[#3C3E3A]/15'
              }`}
            >
              {isPublic ? 'Published' : 'Share'}
            </button>
            {isPublic && shareToken && (
              <button
                onClick={copyPublicLink}
                className="text-xs text-[#7776BC] hover:text-[#7A82AB] transition-colors"
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            )}
          </div>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          className="text-2xl font-bold text-[#1E1E1E] w-full border-0 outline-none placeholder-[#1E1E1E]/20 bg-transparent"
          placeholder="Untitled talk"
        />
      </div>

      {/* Outline section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-[#1E1E1E]/35 uppercase tracking-wider">Outline</h2>
          {outline && !isGeneratingOutline && (
            <div className="flex items-center gap-3">
              <button
                onClick={copyOutline}
                className="text-xs text-[#7776BC] hover:text-[#7A82AB] transition-colors"
              >
                {outlineCopied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={() => setOutline(null)} className="text-xs text-[#1E1E1E]/30 hover:text-[#1E1E1E]/60">
                Regenerate
              </button>
            </div>
          )}
        </div>

        {outline ? (
          <div className="space-y-3">
            {outline.openingHook && (
              <div className="bg-[#7776BC]/6 border border-[#7776BC]/15 rounded-xl p-4">
                <p className="text-[10px] font-semibold text-[#7776BC]/60 uppercase tracking-wide mb-1">Opening hook</p>
                <p className="text-sm text-[#1E1E1E]/70">{outline.openingHook}</p>
              </div>
            )}
            {(outline.sections ?? []).map((section, i) => (
              <div key={i} className="border border-[#3C3E3A]/12 rounded-xl p-4 bg-white">
                <p className="font-semibold text-[#1E1E1E] text-sm mb-1">{section.label}</p>
                <p className="text-[#1E1E1E]/55 text-sm mb-2">{section.summary}</p>
                {section.keyPoints.length > 0 && (
                  <ul className="space-y-1">
                    {section.keyPoints.map((pt, j) => (
                      <li key={j} className="text-sm text-[#1E1E1E]/60 flex gap-2">
                        <span className="text-[#1E1E1E]/20 shrink-0 mt-0.5">–</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {outline.scriptureOrQuote && (
              <div className="bg-[#E8F1F2] rounded-xl p-4">
                <p className="text-[10px] font-semibold text-[#1E1E1E]/35 uppercase tracking-wide mb-1">Scripture / Quote</p>
                <p className="text-sm text-[#1E1E1E]/60 italic">{outline.scriptureOrQuote}</p>
              </div>
            )}
          </div>
        ) : isGeneratingOutline ? (
          <div className="border border-[#3C3E3A]/12 rounded-xl p-8 text-center bg-white">
            <div className="animate-pulse text-[#7776BC]/50 text-2xl mb-3">✦</div>
            <p className="text-sm text-[#1E1E1E]/45">Building your outline…</p>
            {outlineStreamText && (
              <p className="text-xs text-[#1E1E1E]/20 mt-2 font-mono truncate max-w-xs mx-auto">
                {outlineStreamText.slice(-50)}
              </p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#3C3E3A]/15 rounded-xl p-6 space-y-5">

            {/* Theme */}
            <div>
              <label className="text-xs font-medium text-[#1E1E1E]/45 block mb-1">Theme / topic</label>
              <input
                type="text"
                placeholder="e.g. Faith in hard times"
                value={outlineForm.theme}
                onChange={e => handleThemeChange(e.target.value)}
                className="w-full border border-[#3C3E3A]/15 rounded-lg px-3 py-2 text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/25 focus:outline-none focus:border-[#7A82AB] bg-white"
              />
            </div>

            {/* Getting started */}
            <div>
              <button
                onClick={getStarters}
                disabled={loadingStarters}
                className="text-xs text-[#7776BC] hover:text-[#7A82AB] transition-colors disabled:opacity-40"
              >
                {loadingStarters ? 'Thinking of angles…' : 'Not sure where to start? Get 3 opening approaches →'}
              </button>
              {starters && starters.length > 0 && (
                <div className="mt-3 space-y-2">
                  {starters.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => applyStarter(s)}
                      className="w-full text-left border border-[#7776BC]/20 hover:border-[#7776BC]/50 hover:bg-[#7776BC]/4 rounded-lg p-3 transition-colors"
                    >
                      <p className="text-xs font-semibold text-[#7776BC] mb-1">{s.title}</p>
                      <p className="text-xs text-[#1E1E1E]/65 italic mb-1">&ldquo;{s.hook}&rdquo;</p>
                      <p className="text-[10px] text-[#1E1E1E]/40">{s.approach}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audience */}
            <div>
              <label className="text-xs font-medium text-[#1E1E1E]/45 block mb-2">Audience</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_PRESETS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setUseCustomAudience(false); setOutlineForm(f => ({ ...f, audience: opt })) }}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      !useCustomAudience && outlineForm.audience === opt
                        ? 'border-[#7776BC]/50 bg-[#7776BC]/8 text-[#7776BC] font-medium'
                        : 'border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-[#3C3E3A]/30'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  onClick={() => setUseCustomAudience(true)}
                  className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                    useCustomAudience
                      ? 'border-[#7776BC]/50 bg-[#7776BC]/8 text-[#7776BC] font-medium'
                      : 'border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-[#3C3E3A]/30'
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
                  className="mt-2 w-full border border-[#3C3E3A]/15 rounded-lg px-3 py-2 text-sm text-[#1E1E1E] placeholder-[#1E1E1E]/25 focus:outline-none focus:border-[#7A82AB] bg-white"
                />
              )}
            </div>

            {/* Length slider */}
            <div>
              <label className="text-xs font-medium text-[#1E1E1E]/45 block mb-2">
                Length — <span className="text-[#1E1E1E] font-semibold">{outlineForm.length} min</span>
              </label>
              <input
                type="range" min={2} max={30} step={1}
                value={outlineForm.length}
                onChange={e => setOutlineForm(f => ({ ...f, length: Number(e.target.value) }))}
                className="w-full accent-[#7776BC]"
              />
              <div className="flex justify-between text-[10px] text-[#1E1E1E]/20 mt-1 select-none">
                <span>2m</span><span>10m</span><span>20m</span><span>30m</span>
              </div>
            </div>

            {/* Resources */}
            <div>
              <label className="text-xs font-medium text-[#1E1E1E]/45 block mb-2">
                Resources
                <span className="font-normal text-[#1E1E1E]/30 ml-1">— scriptures, quotes, stories</span>
              </label>
              <ResourcesPanel resources={talkResources} onChange={handleResourcesChange} talkId={initialTalk.id} />
            </div>

            {/* Scripture suggestions */}
            {(loadingScriptures || scriptures.length > 0) && (
              <div className="space-y-2 pt-1 border-t border-[#3C3E3A]/8">
                <p className="text-[10px] font-semibold text-[#1E1E1E]/30 uppercase tracking-wide pt-2">
                  Suggested scriptures
                </p>
                {loadingScriptures ? (
                  <div className="text-xs text-[#1E1E1E]/30 animate-pulse py-2">Finding relevant scriptures…</div>
                ) : (
                  scriptures.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addScriptureAsResource(s.reference, s.text)}
                      className="w-full text-left border border-[#3C3E3A]/10 hover:border-[#7776BC]/30 hover:bg-[#7776BC]/4 rounded-lg p-3 transition-colors group"
                    >
                      <p className="text-xs font-semibold text-[#1E1E1E]/60 group-hover:text-[#7776BC] mb-1">{s.reference}</p>
                      <p className="text-xs text-[#1E1E1E]/45 leading-relaxed">
                        <HighlightedText text={s.text} words={s.matchWords} />
                      </p>
                      <p className="text-[10px] text-[#7776BC]/50 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Add as resource
                      </p>
                    </button>
                  ))
                )}
                {suggestedResources.length > 0 && !loadingScriptures && (
                  <>
                    <p className="text-[10px] font-semibold text-[#1E1E1E]/30 uppercase tracking-wide pt-2">Related resources</p>
                    {suggestedResources.map((r, i) => (
                      <div key={i} className="border border-[#3C3E3A]/10 rounded-lg p-3">
                        <p className="text-xs font-semibold text-[#1E1E1E]/55 mb-0.5">{r.title}</p>
                        <p className="text-xs text-[#1E1E1E]/35">{r.description}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {outlineError && <p className="text-red-500 text-sm">{outlineError}</p>}
            <button
              onClick={generateOutline}
              disabled={isGeneratingOutline}
              className="bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              Generate outline →
            </button>
          </div>
        )}
      </section>

      {/* Draft section */}
      <section className="pb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-[#1E1E1E]/35 uppercase tracking-wider">Draft</h2>
          {draft && !isGeneratingDraft && (
            <button
              onClick={() => { setDraft(''); setWordCount(0); setEstimatedMinutes(0) }}
              className="text-xs text-[#1E1E1E]/30 hover:text-[#1E1E1E]/60"
            >
              Regenerate
            </button>
          )}
        </div>

        {!outline && !draft && !isGeneratingDraft ? (
          <div className="border-2 border-dashed border-[#3C3E3A]/10 rounded-xl p-8 text-center">
            <p className="text-sm text-[#1E1E1E]/30">Generate an outline first, then come back to write your draft.</p>
          </div>
        ) : isGeneratingDraft ? (
          <div>
            <div className="flex items-center gap-2 mb-3 text-sm text-[#1E1E1E]/35">
              <span className="animate-pulse text-[#7776BC]">✦</span>
              Writing your draft…
            </div>
            <div className="w-full min-h-96 border border-[#3C3E3A]/12 rounded-xl p-5 text-[#1E1E1E]/70 text-sm leading-relaxed whitespace-pre-wrap bg-white">
              {draftStreamText}
              <span className="animate-pulse">▌</span>
            </div>
          </div>
        ) : draft ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={e => handleDraftChange(e.target.value)}
            className="w-full min-h-96 border border-[#3C3E3A]/12 rounded-xl p-5 text-[#1E1E1E]/75 text-sm leading-relaxed focus:outline-none focus:border-[#7A82AB]/30 resize-none bg-white"
            placeholder="Your draft will appear here…"
          />
        ) : (
          <div className="border-2 border-dashed border-[#3C3E3A]/15 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-[#1E1E1E]/45 block mb-2">Tone</label>
              <div className="flex gap-2 flex-wrap">
                {TONE_OPTIONS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                      tone === t.value
                        ? 'border-[#7776BC]/50 bg-[#7776BC]/8 text-[#7776BC] font-medium'
                        : 'border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-[#3C3E3A]/30'
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
              disabled={isGeneratingDraft}
              className="bg-[#1E1E1E] hover:bg-[#3C3E3A] text-[#E8F1F2] font-semibold rounded-lg px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              Generate draft from outline →
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
