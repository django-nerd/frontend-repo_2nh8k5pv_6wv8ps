import Hero from './components/Hero'
import Stats from './components/Stats'
import ModelTable from './components/ModelTable'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Hero />
        <Stats />
        <ModelTable />
      </div>
    </div>
  )
}

export default App
