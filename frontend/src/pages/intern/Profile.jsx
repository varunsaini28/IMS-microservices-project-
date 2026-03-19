import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { internApi } from '../../services/internApi'
import { useAuth } from '../../hooks/useAuth'

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  dob: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'documents', label: 'Documents' },
  { id: 'skills', label: 'Skills' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'evaluations', label: 'Evaluations' },
]

export default function Profile() {
  const { isAdmin } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState('profile')

  const profile = useQuery({ queryKey: ['intern', 'profile'], queryFn: internApi.getProfile })
  const documents = useQuery({ queryKey: ['intern', 'documents'], queryFn: internApi.documents })
  const skills = useQuery({ queryKey: ['intern', 'skills'], queryFn: internApi.skills })
  const certificates = useQuery({ queryKey: ['intern', 'certificates'], queryFn: internApi.certificates })
  const evaluations = useQuery({ queryKey: ['intern', 'evaluations'], queryFn: internApi.evaluations })

  const profileDefaults = useMemo(() => {
    const p = profile.data?.profile ?? profile.data ?? {}
    return {
      firstName: p.firstName ?? '',
      lastName: p.lastName ?? '',
      dob: p.dob ? String(p.dob).slice(0, 10) : '',
      phone: p.phone ?? '',
      address: p.address ?? '',
    }
  }, [profile.data])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(profileSchema), values: profileDefaults })

  const updateProfile = useMutation({
    mutationFn: internApi.updateProfile,
    onSuccess: () => {
      toast.success('Profile updated')
      qc.invalidateQueries({ queryKey: ['intern', 'profile'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Update failed'),
  })

  const onSubmit = async (values) => updateProfile.mutateAsync(values)

  const [uploading, setUploading] = useState(false)
  const onUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      await internApi.uploadDocument(file)
      toast.success('Uploaded')
      qc.invalidateQueries({ queryKey: ['intern', 'documents'] })
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const [skillModal, setSkillModal] = useState(false)
  const [skillName, setSkillName] = useState('')
  const addSkill = useMutation({
    mutationFn: () => internApi.createSkill({ name: skillName }),
    onSuccess: () => {
      toast.success('Skill added')
      setSkillModal(false)
      setSkillName('')
      qc.invalidateQueries({ queryKey: ['intern', 'skills'] })
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Add failed'),
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your details and assets.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white'
                : 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Profile details</div>
            <Button variant="outline" onClick={() => reset(profileDefaults)}>
              Reset
            </Button>
          </div>

          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-sm font-medium">First name</label>
              <Input {...register('firstName')} />
              {errors.firstName ? <div className="mt-1 text-sm text-rose-600">{errors.firstName.message}</div> : null}
            </div>
            <div>
              <label className="text-sm font-medium">Last name</label>
              <Input {...register('lastName')} />
              {errors.lastName ? <div className="mt-1 text-sm text-rose-600">{errors.lastName.message}</div> : null}
            </div>
            <div>
              <label className="text-sm font-medium">DOB</label>
              <Input type="date" {...register('dob')} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input {...register('phone')} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Input {...register('address')} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isSubmitting || updateProfile.isPending}>
                {isSubmitting || updateProfile.isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {tab === 'documents' ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Documents</div>
            <label className="inline-flex items-center gap-2">
              <input
                type="file"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
              <Button variant="outline" disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload'}
              </Button>
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {(documents.data ?? []).map((d) => (
              <div key={d.id || d._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                <div className="truncate font-medium">{d.name || d.originalName || d.filename || 'Document'}</div>
              </div>
            ))}
            {documents.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
            {!documents.isLoading && (documents.data ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">No documents yet.</div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === 'skills' ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Skills</div>
            <Button onClick={() => setSkillModal(true)}>Add Skill</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(skills.data ?? []).map((s) => (
              <span key={s.id || s._id || s.name} className="rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-800">
                {s.name || s.skill || 'Skill'}
              </span>
            ))}
            {skills.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
            {!skills.isLoading && (skills.data ?? []).length === 0 ? (
              <div className="text-sm text-slate-500">No skills added yet.</div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {tab === 'certificates' ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Certificates</div>
            {isAdmin ? <Button variant="outline">Upload Certificate</Button> : null}
          </div>
          <div className="mt-4 space-y-2">
            {(certificates.data ?? []).map((c) => (
              <div key={c.id || c._id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                <div className="font-medium">{c.title || c.name || 'Certificate'}</div>
              </div>
            ))}
            {certificates.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
          </div>
        </Card>
      ) : null}

      {tab === 'evaluations' ? (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Evaluations</div>
            {isAdmin ? <Button variant="outline">Create Evaluation</Button> : null}
          </div>
          <div className="mt-4 space-y-2">
            {(evaluations.data ?? []).map((e) => (
              <div key={e.id || e._id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-800">
                <div className="font-medium">{e.title || 'Evaluation'}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{e.score != null ? `Score: ${e.score}` : null}</div>
              </div>
            ))}
            {evaluations.isLoading ? <div className="text-sm text-slate-500">Loading…</div> : null}
          </div>
        </Card>
      ) : null}

      <Modal
        open={skillModal}
        onClose={() => setSkillModal(false)}
        title="Add skill"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSkillModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => addSkill.mutate()} disabled={!skillName || addSkill.isPending}>
              {addSkill.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Skill name</label>
          <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. React" />
        </div>
      </Modal>
    </div>
  )
}

