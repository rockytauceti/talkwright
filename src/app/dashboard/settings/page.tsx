'use client'

import { useState, useEffect, useRef } from 'react'

export default function SettingsPage() {
  const [voiceProfile, setVoiceProfile] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/user/voice-profile')
      .then(r => r.json())
      .then(d => {
        setVoiceProfile(d.voiceProfile ?? null)
        setDraft(d.voiceProfile ?? '')
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    await fetch('/api/user/voice-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voiceProfile: draft }),
    })
    setVoiceProfile(draft)
    setEditing(false)
    setSaving(false)
    setStatus('Saved.')
    setTimeout(() => setStatus(''), 2500)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    setStatus('Extracting text…')
    try {
      let text = ''
      if (file.name.endsWith('.txt')) {
        text = await file.text()
      } else {
        const form = new FormData()
        form.append('file', file)
        // Use a dummy talkId placeholder — upload route only needs the file
        const res = await fetch('/api/user/voice-profile/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Upload failed')
        text = data.text
      }
      setUploading(false)
      setStatus('Generating voice profile…')
      setGenerating(true)
      const res = await fetch('/api/user/voice-profile/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: [text] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')
      setVoiceProfile(data.voiceProfile)
      setDraft(data.voiceProfile)
      setStatus('Voice profile generated.')
      setTimeout(() => setStatus(''), 3000)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed')
    } finally {
      setUploading(false)
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl px-6 py-8">
      <h1 className="text-xl font-bold text-[#1E1E1E] mb-1">Settings</h1>
      <p className="text-sm text-[#1E1E1E]/40 mb-10">Manage your TalkWright preferences.</p>

      {/* Voice profile section */}
      <section>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#1E1E1E]">Your voice profile</h2>
            <p className="text-xs text-[#1E1E1E]/40 mt-0.5">
              Used when "Mirror my voice" is on during draft generation.
            </p>
          </div>
          {voiceProfile && !editing && (
            <button
              onClick={() => { setEditing(true); setDraft(voiceProfile) }}
              className="text-xs text-[#7776BC] hover:text-[#7A82AB] transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {loading ? (
          <div className="h-32 bg-[#3C3E3A]/5 rounded-xl animate-pulse" />
        ) : voiceProfile && !editing ? (
          <div className="bg-white border border-[#3C3E3A]/12 rounded-xl p-4">
            <pre className="text-xs text-[#1E1E1E]/70 whitespace-pre-wrap leading-relaxed font-sans">
              {voiceProfile}
            </pre>
          </div>
        ) : editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={16}
              className="w-full bg-white border border-[#3C3E3A]/15 rounded-xl p-4 text-xs text-[#1E1E1E]/80 font-mono leading-relaxed focus:outline-none focus:border-[#7A82AB]/40 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs bg-[#7776BC] hover:bg-[#7A82AB] text-[#E8F1F2] font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => { setEditing(false); setDraft(voiceProfile ?? '') }}
                className="text-xs border border-[#3C3E3A]/15 text-[#1E1E1E]/50 hover:text-[#1E1E1E]/70 rounded-lg px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#3C3E3A]/12 rounded-xl p-6 text-center">
            <p className="text-sm text-[#1E1E1E]/50 mb-1">No voice profile yet.</p>
            <p className="text-xs text-[#1E1E1E]/30 mb-4">
              Upload a past talk and TalkWright will learn your speaking style.
            </p>
          </div>
        )}

        {/* Upload / regenerate */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || generating}
            className="text-xs border border-[#3C3E3A]/15 text-[#1E1E1E]/50 hover:border-[#7776BC]/40 hover:text-[#7776BC] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
          >
            {uploading ? 'Reading file…' : generating ? 'Generating…' : voiceProfile ? '↑ Regenerate from file' : '↑ Upload a past talk'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx,.pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
          {status && <span className="text-xs text-[#1E1E1E]/35">{status}</span>}
        </div>
        <p className="text-[10px] text-[#1E1E1E]/25 mt-2">Accepts .txt, .docx, .pdf · The longer and more typical the talk, the better the profile.</p>
      </section>
    </div>
  )
}
