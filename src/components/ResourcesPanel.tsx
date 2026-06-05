'use client'

import { useState, useCallback, useRef } from 'react'

export type ResourceType = 'scripture' | 'quote' | 'personal_story' | 'conference_talk' | 'note' | 'past_talk'

export type Resource = {
  id: string
  type: ResourceType
  text: string
  reference?: string
  attribution?: string
  title?: string
  source?: string
}

const TYPE_META: Record<ResourceType, { label: string; badge: string }> = {
  scripture:       { label: 'Scripture',       badge: 'bg-[#7776BC]/12 text-[#7776BC]' },
  quote:           { label: 'Quote',           badge: 'bg-[#7A82AB]/12 text-[#7A82AB]' },
  personal_story:  { label: 'Personal story',  badge: 'bg-[#3C3E3A]/10 text-[#3C3E3A]/70' },
  conference_talk: { label: 'Conf. talk',      badge: 'bg-[#7776BC]/8  text-[#7776BC]/70' },
  note:            { label: 'Note',            badge: 'bg-[#3C3E3A]/6  text-[#3C3E3A]/50' },
  past_talk:       { label: 'Past talk',       badge: 'bg-amber-100 text-amber-700' },
}

const BIBLE_VERSIONS = [
  { id: 'kjv', label: 'KJV' },
  { id: 'web', label: 'WEB' },
  { id: 'asv', label: 'ASV' },
  { id: 'ylt', label: 'YLT' },
] as const
type BibleVersion = (typeof BIBLE_VERSIONS)[number]['id']

// Detect LDS-specific scripture books that aren't in the Bible API
const LDS_BOOK = /^(1\s*ne|2\s*ne|1\s*nephi|2\s*nephi|jacob|enos|jarom|omni|words\s+of\s+mormon|mosiah|alma|helaman|3\s*ne|4\s*ne|3\s*nephi|4\s*nephi|4th\s*nephi|morm|mormon|ether|moroni|d\s*[&]?\s*c|doctrine\s+and|doctrine&|moses|abraham|js[-\s]m|js[-\s]h|articles\s+of|a\s*of\s*f)/i

function isBibleRef(ref: string): boolean {
  return ref.trim().length > 2 && !LDS_BOOK.test(ref.trim())
}

function versionFromSource(source?: string): BibleVersion {
  const s = (source ?? '').toLowerCase().trim()
  if (s === 'web') return 'web'
  if (s === 'asv') return 'asv'
  if (s === 'ylt') return 'ylt'
  return 'kjv'
}

function newResource(type: ResourceType): Resource {
  return { id: Math.random().toString(36).slice(2), type, text: '' }
}

function ResourceCard({ resource, onChange, onDelete }: {
  resource: Resource
  onChange: (r: Resource) => void
  onDelete: () => void
}) {
  const meta = TYPE_META[resource.type]
  const [expanded, setExpanded] = useState(false)
  const [version, setVersion] = useState<BibleVersion>(() => versionFromSource(resource.source))
  const [fetchingText, setFetchingText] = useState(false)
  const refTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const set = (patch: Partial<Resource>) => onChange({ ...resource, ...patch })
  const isLong = resource.text.length > 300
  const isLds = !!resource.reference?.trim() && !isBibleRef(resource.reference)

  async function fetchBibleScripture(ref: string, ver: BibleVersion) {
    setFetchingText(true)
    try {
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(ref.trim())}?translation=${ver}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.text && !data.error) {
        onChange({ ...resource, reference: ref, text: data.text.trim(), source: ver.toUpperCase() })
      }
    } catch { /* silent */ } finally { setFetchingText(false) }
  }

  async function fetchLdsScripture(ref: string) {
    setFetchingText(true)
    try {
      const res = await fetch(`/api/scriptures/lookup?ref=${encodeURIComponent(ref.trim())}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.text) {
        onChange({ ...resource, reference: data.reference || ref, text: data.text, source: 'LDS Standard Works' })
      }
    } catch { /* silent */ } finally { setFetchingText(false) }
  }

  function handleRefChange(val: string) {
    set({ reference: val })
    if (refTimer.current) clearTimeout(refTimer.current)
    if (!val.trim()) return
    refTimer.current = setTimeout(() => {
      if (isBibleRef(val)) fetchBibleScripture(val, version)
      else fetchLdsScripture(val)
    }, 900)
  }

  function handleVersionChange(ver: BibleVersion) {
    setVersion(ver)
    if (resource.reference?.trim() && isBibleRef(resource.reference)) {
      fetchBibleScripture(resource.reference, ver)
    }
  }

  return (
    <div className="border border-[#3C3E3A]/12 rounded-xl p-3.5 bg-white group relative">
      {/* Type badge + delete */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${meta.badge}`}>
          {meta.label}
        </span>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-[#3C3E3A]/30 hover:text-red-400 transition-all text-xs"
          title="Remove"
        >✕</button>
      </div>

      {/* Scripture reference + version pills */}
      {resource.type === 'scripture' && (
        <div className="mb-1.5">
          <input
            placeholder="Reference (e.g. John 3:16 · Mosiah 3:19)"
            value={resource.reference ?? ''}
            onChange={e => handleRefChange(e.target.value)}
            className="w-full text-xs font-semibold text-[#1E1E1E] placeholder-[#1E1E1E]/25 bg-transparent border-0 outline-none mb-1"
          />
          {!isLds ? (
            <div className="flex items-center gap-1.5">
              {BIBLE_VERSIONS.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVersionChange(v.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    version === v.id
                      ? 'bg-[#7776BC]/15 text-[#7776BC] font-semibold'
                      : 'text-[#1E1E1E]/30 hover:text-[#7776BC]'
                  }`}
                >{v.label}</button>
              ))}
              {fetchingText && <span className="text-[10px] text-[#1E1E1E]/25 animate-pulse ml-1">fetching…</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#7776BC]/60 font-medium">LDS Standard Works</span>
              {fetchingText && <span className="text-[10px] text-[#1E1E1E]/25 animate-pulse">fetching…</span>}
            </div>
          )}
        </div>
      )}

      {/* Conference talk / past talk title */}
      {(resource.type === 'conference_talk' || resource.type === 'past_talk') && (
        <input
          placeholder={resource.type === 'past_talk' ? 'Talk title or occasion' : 'Talk title'}
          value={resource.title ?? ''}
          onChange={e => set({ title: e.target.value })}
          className="w-full text-xs font-semibold text-[#1E1E1E] placeholder-[#1E1E1E]/25 bg-transparent border-0 outline-none mb-1"
        />
      )}

      {/* Main text */}
      {resource.type === 'past_talk' && isLong && !expanded ? (
        <div>
          <p className="text-sm text-[#1E1E1E]/60 leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {resource.text.slice(0, 300)}…
          </p>
          <button onClick={() => setExpanded(true)} className="text-[11px] text-[#7776BC] hover:text-[#7A82AB] mt-1 transition-colors">
            Show full text
          </button>
        </div>
      ) : (
        <div>
          <textarea
            placeholder={
              fetchingText               ? 'Fetching scripture text…' :
              resource.type === 'scripture'       ? 'Scripture text…' :
              resource.type === 'quote'           ? 'Quote text…' :
              resource.type === 'personal_story'  ? 'Describe the story you want to tell…' :
              resource.type === 'conference_talk' ? 'Key passage or notes…' :
              resource.type === 'past_talk'       ? 'Paste a past talk or upload a file…' :
              'Notes…'
            }
            value={resource.text}
            onChange={e => set({ text: e.target.value })}
            rows={resource.type === 'past_talk' ? 5 : 2}
            disabled={fetchingText}
            className="w-full text-sm text-[#1E1E1E]/80 placeholder-[#1E1E1E]/25 bg-transparent border-0 outline-none resize-none leading-relaxed disabled:opacity-40"
          />
          {resource.type === 'past_talk' && isLong && expanded && (
            <button onClick={() => setExpanded(false)} className="text-[11px] text-[#7776BC] hover:text-[#7A82AB] mt-1 transition-colors">
              Collapse
            </button>
          )}
        </div>
      )}

      {/* Attribution */}
      {(resource.type === 'quote' || resource.type === 'conference_talk') && (
        <input
          placeholder={resource.type === 'quote' ? '— Attribution' : '— Speaker name'}
          value={resource.attribution ?? ''}
          onChange={e => set({ attribution: e.target.value })}
          className="w-full text-xs text-[#1E1E1E]/40 italic placeholder-[#1E1E1E]/20 bg-transparent border-0 outline-none mt-1"
        />
      )}
      {resource.type === 'past_talk' && resource.text.length > 0 && (
        <p className="text-[10px] text-[#1E1E1E]/25 mt-1.5">
          {resource.text.length.toLocaleString()} chars · AI will match your voice from this
        </p>
      )}
    </div>
  )
}

export default function ResourcesPanel({
  resources,
  onChange,
  talkId,
}: {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
  talkId?: string
}) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const add = useCallback((type: ResourceType) => {
    onChange([...resources, newResource(type)])
  }, [resources, onChange])

  const update = useCallback((id: string, updated: Resource) => {
    onChange(resources.map(r => r.id === id ? updated : r))
  }, [resources, onChange])

  const remove = useCallback((id: string) => {
    onChange(resources.filter(r => r.id !== id))
  }, [resources, onChange])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      let text = ''
      if (file.name.endsWith('.txt')) {
        text = await file.text()
      } else if (talkId) {
        const form = new FormData()
        form.append('file', file)
        const res = await fetch(`/api/talks/${talkId}/upload`, { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        text = data.text
      } else {
        throw new Error('Cannot upload this file type without a talk ID')
      }
      onChange([...resources, {
        id: Math.random().toString(36).slice(2),
        type: 'past_talk',
        text: text.slice(0, 8000),
        title: file.name.replace(/\.[^.]+$/, ''),
      }])
    } catch (err) {
      console.error('Upload failed:', err)
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const manualTypes: ResourceType[] = ['scripture', 'quote', 'personal_story', 'conference_talk', 'note']

  return (
    <div className="space-y-2.5">
      {resources.length > 0 && (
        <div className="space-y-2.5">
          {resources.map(r => (
            <ResourceCard
              key={r.id}
              resource={r}
              onChange={updated => update(r.id, updated)}
              onDelete={() => remove(r.id)}
            />
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {manualTypes.map(type => (
          <button
            key={type}
            onClick={() => add(type)}
            className="text-[11px] border border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-[#7776BC]/40 hover:text-[#7776BC] rounded-lg px-2.5 py-1 transition-colors"
          >+ {TYPE_META[type].label}</button>
        ))}
        <button
          onClick={() => add('past_talk')}
          className="text-[11px] border border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-amber-400 hover:text-amber-600 rounded-lg px-2.5 py-1 transition-colors"
        >+ Past talk</button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-[11px] border border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-amber-400 hover:text-amber-600 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-40"
        >{uploading ? 'Reading…' : '↑ Upload file'}</button>
        <input ref={fileInputRef} type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
      </div>
      {uploading && <p className="text-[11px] text-[#1E1E1E]/35 animate-pulse">Extracting text from file…</p>}
    </div>
  )
}

/** Convert resources array to a plain-text prompt block */
export function resourcesToPromptText(resources: Resource[]): string {
  if (!resources.length) return ''
  const lines = resources.map(r => {
    if (r.type === 'scripture') {
      const ref = r.reference ? `${r.reference}` : 'Scripture'
      const src = r.source ? ` (${r.source})` : ''
      return `[Scripture] ${ref}${src}: "${r.text}"`
    }
    if (r.type === 'quote') {
      const by = r.attribution ? ` — ${r.attribution}` : ''
      return `[Quote] "${r.text}"${by}`
    }
    if (r.type === 'personal_story') return `[Personal story] ${r.text}`
    if (r.type === 'conference_talk') {
      const title = r.title ? `"${r.title}"` : 'Conference talk'
      const by = r.attribution ? ` by ${r.attribution}` : ''
      return `[Conference talk] ${title}${by}: ${r.text}`
    }
    if (r.type === 'past_talk') {
      const title = r.title ? ` ("${r.title}")` : ''
      return `[Past talk by this speaker${title}]\n${r.text.slice(0, 1500)}`
    }
    return `[Note] ${r.text}`
  })
  return lines.filter(Boolean).join('\n')
}
