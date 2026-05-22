'use client'

import { useState, useCallback } from 'react'

export type ResourceType = 'scripture' | 'quote' | 'personal_story' | 'conference_talk' | 'note'

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
}

function newResource(type: ResourceType): Resource {
  return { id: Math.random().toString(36).slice(2), type, text: '' }
}

function ResourceCard({
  resource,
  onChange,
  onDelete,
}: {
  resource: Resource
  onChange: (r: Resource) => void
  onDelete: () => void
}) {
  const meta = TYPE_META[resource.type]

  const set = (patch: Partial<Resource>) => onChange({ ...resource, ...patch })

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
        >
          ✕
        </button>
      </div>

      {/* Reference/title row */}
      {resource.type === 'scripture' && (
        <input
          placeholder="Reference (e.g. John 3:16 · Mosiah 3:19)"
          value={resource.reference ?? ''}
          onChange={e => set({ reference: e.target.value })}
          className="w-full text-xs font-semibold text-[#1E1E1E] placeholder-[#1E1E1E]/25 bg-transparent border-0 outline-none mb-1"
        />
      )}
      {resource.type === 'conference_talk' && (
        <input
          placeholder="Talk title"
          value={resource.title ?? ''}
          onChange={e => set({ title: e.target.value })}
          className="w-full text-xs font-semibold text-[#1E1E1E] placeholder-[#1E1E1E]/25 bg-transparent border-0 outline-none mb-1"
        />
      )}

      {/* Main text */}
      <textarea
        placeholder={
          resource.type === 'scripture'       ? 'Scripture text…' :
          resource.type === 'quote'           ? 'Quote text…' :
          resource.type === 'personal_story'  ? 'Describe the story you want to tell…' :
          resource.type === 'conference_talk' ? 'Key passage or notes…' :
          'Notes…'
        }
        value={resource.text}
        onChange={e => set({ text: e.target.value })}
        rows={2}
        className="w-full text-sm text-[#1E1E1E]/80 placeholder-[#1E1E1E]/25 bg-transparent border-0 outline-none resize-none leading-relaxed"
      />

      {/* Attribution row */}
      {(resource.type === 'quote' || resource.type === 'conference_talk') && (
        <input
          placeholder={resource.type === 'quote' ? '— Attribution' : '— Speaker name'}
          value={resource.attribution ?? ''}
          onChange={e => set({ attribution: e.target.value })}
          className="w-full text-xs text-[#1E1E1E]/40 italic placeholder-[#1E1E1E]/20 bg-transparent border-0 outline-none mt-1"
        />
      )}
      {resource.type === 'scripture' && (
        <input
          placeholder="Source (Bible · Book of Mormon · D&C · Pearl of Great Price)"
          value={resource.source ?? ''}
          onChange={e => set({ source: e.target.value })}
          className="w-full text-[10px] text-[#1E1E1E]/35 placeholder-[#1E1E1E]/20 bg-transparent border-0 outline-none mt-1"
        />
      )}
    </div>
  )
}

export default function ResourcesPanel({
  resources,
  onChange,
}: {
  resources: Resource[]
  onChange: (resources: Resource[]) => void
}) {
  const add = useCallback((type: ResourceType) => {
    onChange([...resources, newResource(type)])
  }, [resources, onChange])

  const update = useCallback((id: string, updated: Resource) => {
    onChange(resources.map(r => r.id === id ? updated : r))
  }, [resources, onChange])

  const remove = useCallback((id: string) => {
    onChange(resources.filter(r => r.id !== id))
  }, [resources, onChange])

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

      {/* Add buttons */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {(Object.keys(TYPE_META) as ResourceType[]).map(type => (
          <button
            key={type}
            onClick={() => add(type)}
            className="text-[11px] border border-[#3C3E3A]/15 text-[#1E1E1E]/45 hover:border-[#7776BC]/40 hover:text-[#7776BC] rounded-lg px-2.5 py-1 transition-colors"
          >
            + {TYPE_META[type].label}
          </button>
        ))}
      </div>
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
    if (r.type === 'personal_story') {
      return `[Personal story] ${r.text}`
    }
    if (r.type === 'conference_talk') {
      const title = r.title ? `"${r.title}"` : 'Conference talk'
      const by = r.attribution ? ` by ${r.attribution}` : ''
      return `[Conference talk] ${title}${by}: ${r.text}`
    }
    return `[Note] ${r.text}`
  })
  return lines.filter(Boolean).join('\n')
}