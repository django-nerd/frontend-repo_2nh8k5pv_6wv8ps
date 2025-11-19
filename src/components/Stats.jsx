export default function Stats({ stats }) {
  const items = stats || [
    { label: 'Active Models', value: 8 },
    { label: 'Training Jobs', value: 3 },
    { label: 'Queued Sims', value: 5 },
    { label: 'Success Rate', value: '97%' },
  ]
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {items.map((s, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <div className="text-xs uppercase tracking-wide text-white/60">{s.label}</div>
          <div className="mt-2 text-2xl font-semibold text-white">{s.value}</div>
        </div>
      ))}
    </section>
  )
}
