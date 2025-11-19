import Spline from '@splinetool/react-spline'

export default function Hero() {
  return (
    <section className="relative h-[60vh] min-h-[520px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/4cHQr84zOGAHOehh/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),rgba(59,130,246,0.12)_40%,transparent_70%)]" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 ring-1 ring-white/10 backdrop-blur">
          AI Workflow Observatory
          <span className="ml-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        </div>
        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white">
          Monitor. Orchestrate. Accelerate.
        </h1>
        <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/70">
          A sleek control surface for your models, training jobs, and simulation runs — all in one place.
        </p>
      </div>
    </section>
  )
}
