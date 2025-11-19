import { useEffect, useState } from 'react'

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

  const fetchModels = async () => {
    try {
      const res = await fetch(`${api}/api/models`)
      const data = await res.json()
      setModels(data)
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
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {models.map((m) => (
              <tr key={m.id} className="text-white/90">
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
                    <button onClick={() => markNeedsTraining(m.id)} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10">Needs Training</button>
                    <button onClick={() => triggerTraining(m.id)} className="rounded-lg bg-amber-500/80 px-3 py-1.5 text-xs text-slate-900 hover:bg-amber-500">Train</button>
                    <button onClick={() => triggerSim(m.id)} className="rounded-lg bg-sky-500/80 px-3 py-1.5 text-xs text-slate-900 hover:bg-sky-500">Simulate</button>
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
