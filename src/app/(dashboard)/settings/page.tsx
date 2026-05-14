'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store'
import { Topbar } from '@/components/shared/topbar'
import { Card } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const EXPERTISE_SUGGESTIONS = [
  'Machine Learning', 'Natural Language Processing', 'Computer Vision',
  'Bioinformatics', 'Epidemiology', 'Clinical Trials', 'Neuroscience',
  'Behavioral Economics', 'Peer Review', 'Bibliometrics', 'Genomics',
  'Immunology', 'Materials Science', 'Astrophysics', 'Ecology',
]

export default function SettingsPage() {
  const profile = useAppStore(s => s.profile)
  const setProfile = useAppStore(s => s.setProfile)
  const [form, setForm] = useState({
    full_name: '',
    institution: '',
    field: '',
    bio: '',
    orcid_id: '',
    semantic_scholar_id: '',
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        institution: profile.institution || '',
        field: profile.field || '',
        bio: profile.bio || '',
        orcid_id: profile.orcid_id || '',
        semantic_scholar_id: (profile as unknown as { semantic_scholar_id?: string }).semantic_scholar_id || '',
      })
      setTags((profile as unknown as { expertise_tags?: string[] }).expertise_tags || [])
    }
  }, [profile])

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...form, expertise_tags: tags })
      .eq('id', profile?.id)
      .select()
      .single()
    if (error) toast.error(error.message)
    else {
      setProfile(data)
      toast.success('Profile saved')
    }
    setSaving(false)
  }

  function addTag(tag: string) {
    const t = tag.trim()
    if (t && !tags.includes(t)) setTags(p => [...p, t])
    setTagInput('')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Settings" subtitle="Manage your profile and preferences." />

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-6">
          {/* Profile */}
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={profile?.full_name || 'U'} size="xl" />
              <div>
                <div className="font-serif text-lg font-bold text-slate-900">{profile?.full_name}</div>
                <div className="text-sm text-slate-400">{profile?.email}</div>
                <Badge variant={profile?.role === 'reviewer' ? 'info' : 'default'} className="mt-1">
                  {profile?.role}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full name"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="col-span-2"
              />
              <Input
                label="Institution"
                value={form.institution}
                onChange={e => setForm(p => ({ ...p, institution: e.target.value }))}
                placeholder="Your university or institution"
              />
              <Input
                label="Primary field"
                value={form.field}
                onChange={e => setForm(p => ({ ...p, field: e.target.value }))}
                placeholder="e.g. Computational Biology"
              />
              <Textarea
                label="Bio"
                value={form.bio}
                onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                placeholder="Brief academic biography…"
                rows={3}
                className="col-span-2"
              />
            </div>
          </Card>

          {/* Reviewer-specific */}
          {profile?.role === 'reviewer' && (
            <Card>
              <div className="font-serif text-base font-bold text-slate-900 mb-4">Reviewer Profile</div>
              <div className="space-y-4">
                <Input
                  label="ORCID ID"
                  value={form.orcid_id}
                  onChange={e => setForm(p => ({ ...p, orcid_id: e.target.value }))}
                  placeholder="0000-0000-0000-0000"
                  hint="Link your ORCID to verify publications"
                />
                <Input
                  label="Semantic Scholar Author ID"
                  value={form.semantic_scholar_id}
                  onChange={e => setForm(p => ({ ...p, semantic_scholar_id: e.target.value }))}
                  placeholder="e.g. 1741101"
                  hint="Find your ID at semanticscholar.org"
                />

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Expertise Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map(t => (
                      <div key={t} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full">
                        {t}
                        <button onClick={() => setTags(p => p.filter(x => x !== t))} className="text-slate-400 hover:text-red-500 ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
                      placeholder="Add expertise tag…"
                      className="flex-1 h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    <Button size="sm" variant="outline" onClick={() => addTag(tagInput)}>
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {EXPERTISE_SUGGESTIONS.filter(s => !tags.includes(s)).slice(0, 8).map(s => (
                      <button
                        key={s}
                        onClick={() => addTag(s)}
                        className="text-xs px-2.5 py-1 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-slate-700 hover:border-slate-400 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={save} loading={saving} size="lg">Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
