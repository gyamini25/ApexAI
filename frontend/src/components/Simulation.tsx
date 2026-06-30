import { useState } from 'react'
import { FlaskConical, Play, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Panel } from './ui'
import { api } from '../lib/api'
import { baselineScenarios } from '../lib/mockData'
import type { RaceState, ScenarioOutcome } from '../lib/types'

const PRESETS = [
  'What happens if we pit now?',
  'What if it starts raining on Lap 46?',
  'Should we extend the stint to Lap 52?',
  'What if P2 pits next lap?',
]

export function Simulation({ race }: { race: RaceState }) {
  const [question, setQuestion] = useState('What happens if we pit now?')
  const [scenarios, setScenarios] = useState<ScenarioOutcome[]>(baselineScenarios)
  const [narrative, setNarrative] = useState(
    'Baseline projection from the current race state. Run a what-if to let Granite re-evaluate the strategy tree.',
  )
  const [busy, setBusy] = useState(false)

  async function run(q: string) {
    setQuestion(q)
    setBusy(true)
    try {
      const r = await api.simulate(q, race)
      setScenarios(r.scenarios)
      setNarrative(r.narrative)
    } catch {
      setNarrative('Backend offline — showing baseline scenarios. Start the API to run live simulations.')
      setScenarios(baselineScenarios)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Panel className="border-pit-purple/30 bg-gradient-to-br from-pit-purple/10 to-pit-panel">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-pit-purple" />
          <h2 className="text-lg font-bold">What-If Simulator</h2>
        </div>
        <p className="mt-1 text-sm text-pit-muted">
          Ask a strategic question. Granite re-runs the race forward and returns ranked outcomes — finish
          position, confidence and delta to your current plan.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => run(p)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                question === p
                  ? 'border-pit-purple/50 bg-pit-purple/15 text-pit-text'
                  : 'border-pit-line bg-pit-panel-2 text-pit-muted hover:text-pit-text'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(question)}
            className="flex-1 rounded-lg border border-pit-line bg-pit-bg px-3 py-2.5 text-sm outline-none focus:border-pit-purple/50"
            placeholder="What if…"
          />
          <button
            onClick={() => run(question)}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-pit-purple px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> {busy ? 'Simulating…' : 'Run'}
          </button>
        </div>
      </Panel>

      <div className="rounded-lg border border-pit-line bg-pit-panel-2 px-4 py-3 text-sm text-pit-text">
        <span className="panel-label mr-2">Granite summary</span>
        {narrative}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} s={s} />
        ))}
      </div>
    </div>
  )
}

function ScenarioCard({ s }: { s: ScenarioOutcome }) {
  const tone = {
    current: { ring: 'border-pit-line', txt: 'text-pit-text', icon: Minus, glow: '' },
    good: { ring: 'border-pit-green/40', txt: 'text-pit-green', icon: TrendingUp, glow: 'shadow-[0_0_30px_-10px_rgba(34,224,122,0.5)]' },
    bad: { ring: 'border-pit-red/40', txt: 'text-pit-red', icon: TrendingDown, glow: '' },
  }[s.tone]
  const Icon = tone.icon
  return (
    <div className={`panel border ${tone.ring} ${tone.glow} flex flex-col p-4`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-pit-muted">{s.label}</span>
        <Icon className={`h-4 w-4 ${tone.txt}`} />
      </div>
      <p className="mt-2 text-sm text-pit-text">{s.detail}</p>
      <div className="my-3 h-px bg-pit-line" />
      <div className="flex items-end justify-between">
        <div>
          <div className="panel-label">Finish</div>
          <div className={`mono text-3xl font-black ${tone.txt}`}>{s.finishPosition}</div>
        </div>
        <div className="text-right">
          <div className="panel-label">Confidence</div>
          <div className="mono text-xl font-bold">{s.confidencePct}%</div>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-pit-bg/60 px-2.5 py-2 text-[11px] text-pit-muted">
        <ArrowRight className={`mt-0.5 h-3 w-3 shrink-0 ${tone.txt}`} />
        {s.deltaToCurrent}
      </div>
    </div>
  )
}
