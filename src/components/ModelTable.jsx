import { useEffect, useState, useRef } from 'react'

const api = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const statusColors = {
  ready: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/30',
  training: 'bg-amber-500/20 text-amber-300 ring-amber-400/30',
  'needs-training': 'bg-rose-500/20 text-rose-300 ring-rose-400/30',
  stale: 'bg-sky-500/20 text-sky-300 ring-sky-400/30',
}

export default function ModelTable() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [task, setTask] = useState('generation')
  const fileInputRefs = useRef({})
  const [uploadingId, setUploadingId] = useState(null)
  const [progress, setProgress] = useState({})
  const [artifacts, setArtifacts] = useState({})

  const fetchModels = async () => {
    try {
      const res = await fetch(`${api}/api/models`)
      const data = await res.json()
      setModels(data)
      // fetch artifacts per model
      data.forEach(async (m) => {
        try {
          const r = await fetch(`${api}/api/models/${m.id}/artifacts`)
          if (r.ok) {
            const list = await r.json()
            setArtifacts((prev) => ({ ...prev, [m.id]: list }))
          }
        } catch {}
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const createModel = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch(`${api}/api/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, task }),
      })
      setName('')
      fetchModels()
    } finally {
      setLoading(false)
    }
  }

  const markNeedsTraining = async (id) => {
    await fetch(`${api}/api/models/${id}/needs-training`, { method: 'POST' })
    fetchModels()
  }

  const triggerTraining = async (id) => {
    await fetch(`${api}/api/models/${id}/train`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ epochs: 3 }) })
    fetchModels()
  }

  const triggerSim = async (id) => {
    await fetch(`${api}/api/models/${id}/simulate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'smoke' }) })
  }

  const uploadWithProgress = async (url, formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
        else reject(new Error(xhr.responseText || 'Upload failed'))
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send(formData)
    })
  }

  const handleFileSelect = async (id, file) => {
    if (!file) return
    try {
      setUploadingId(id)
      setProgress((p) => ({ ...p, [id]: 0 }))
      const formData = new FormData()
      formData.append('file', file)
      // Detect SB3 .zip and set version label based on date or filename
      const version = file.name.endsWith('.zip') ? `v${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 12)}` : undefined
      if (version) formData.append('version', version)
      formData.append('promote', 'true')
      await uploadWithProgress(`${api}/api/models/${id}/artifact`, formData, (pct) => setProgress((p) => ({ ...p, [id]: pct })))
      await fetchModels()
    } catch (e) {
      console.error(e)
      alert('Upload failed: ' + (e.message || 'Unknown error'))
    } finally {
      setUploadingId(null)
      setTimeout(() => setProgress((p) => ({ ...p, [id]: undefined })), 1200)
      const input = fileInputRefs.current[id]
      if (input) input.value = ''
    }
  }

  const promoteArtifact = async (modelId, artifactId) => {
    await fetch(`${api}/api/models/${modelId}/artifacts/${artifactId}/promote`, { method: 'POST' })
    fetchModels()
  }

  const deleteArtifact = async (modelId, artifactId) => {
    if (!confirm('Delete this artifact?')) return
    await fetch(`${api}/api/models/${modelId}/artifacts/${artifactId}`, { method: 'DELETE' })
    fetchModels()
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-semibold">Models</h2>
        <form onSubmit={createModel} className="flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add model" className="rounded-xl bg-white/5 text-white placeholder-white/40 px-3 py-2 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-400/40" />
          <select value={task} onChange={(e) => setTask(e.target.value)} className="rounded-xl bg-white/5 text-white px-3 py-2 ring-1 ring-white/10">
            <option value="generation">Generation</option>
            <option value="classification">Classification</option>
            <option value="embedding">Embedding</option>
            <option value="rl">RL</option>
            <option value="other">Other</option>
          </select>
          <button disabled={loading} className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-slate-950 px-4 py-2 font-medium transition">Create</button>
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-white/10">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5 text-left text-white/70 text-sm">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Active Artifact</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {models.map((m) => (
              <tr key={m.id} className="text-white/90 align-top">
                <td className="px-4 py-3">{m.name}</td>
                <td className="px-4 py-3 text-white/70">{m.task}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusColors[m.status] || 'bg-white/10 text-white ring-white/20'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${m.status === 'ready' ? 'bg-emerald-400' : m.status === 'training' ? 'bg-amber-400' : m.status === 'needs-training' ? 'bg-rose-400' : 'bg-sky-400'}`} />
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center">
                      <input
                        ref={(el) => (fileInputRefs.current[m.id] = el)}
                        type="file"
                        accept=".zip,.tar,.tar.gz,.tgz,.pt,.pth,.pkl,.bin,.safetensors"
                        className="hidden"
                        onChange={(e) => handleFileSelect(m.id, e.target.files?.[0])}
                      />
                      <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 cursor-pointer">Upload</span>
                    </label>
                    {typeof progress[m.id] === 'number' && (
                      <div className="w-32 h-2 bg-white/10 rounded overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${progress[m.id]}%` }} />
                      </div>
                    )}
                    {m.artifact_filename ? (
                      <a
                        href={`${api}/api/models/${m.id}/artifact/download`}
                        className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                      >
                        {uploadingId === m.id ? 'Uploading...' : m.artifact_filename}
                      </a>
                    ) : (
                      <span className="text-xs text-white/50">No active artifact</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/70 text-xs">{m.active_version || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => markNeedsTraining(m.id)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10">Needs Training</button>
                    <button onClick={() => triggerTraining(m.id)} className="rounded-lg bg-amber-500/80 px-3 py-1.5 text-xs text-slate-900 hover:bg-amber-500">Train</button>
                    <button onClick={() => triggerSim(m.id)} className="rounded-lg bg-sky-500/80 px-3 py-1.5 text-xs text-slate-900 hover:bg-sky-500">Simulate</button>
                  </div>
                  {/* Artifact list */}
                  <div className="mt-3 space-y-1">
                    {(artifacts[m.id] || []).map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5 text-xs text-white/80">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block h-2 w-2 rounded-full ${a.sb3_valid ? 'bg-emerald-400' : 'bg-white/30'}`} title={a.sb3_valid ? 'Looks like SB3 .zip' : 'Unknown format'} />
                          <span className="font-medium">{a.version}</span>
                          <span className="text-white/60">{a.filename}</span>
                          <span className="text-white/40">{(a.size / (1024 * 1024)).toFixed(2)} MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={`${api}/api/artifacts/${a.id}/download`} className="rounded bg-white/10 px-2 py-1 hover:bg-white/15">Download</a>
                          <button onClick={() => promoteArtifact(m.id, a.id)} className="rounded bg-emerald-500/70 text-slate-900 px-2 py-1 hover:bg-emerald-500">Promote</button>
                          <button onClick={() => deleteArtifact(m.id, a.id)} className="rounded bg-rose-500/70 text-slate-900 px-2 py-1 hover:bg-rose-500">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
