import { useEffect, useState } from 'react'
import { Brain, RefreshCw, CircleDot, Flag, Gauge } from 'lucide-react'
import { Panel, Confidence, Pill } from './ui'
import { api } from '../lib/api'
import type { RaceState, Recommendation } from '../lib/types'

const fallback: Recommendation = {
  action: 'Box this lap — undercut P2',
  why: [
    'Front-left degradation 18% above optimal; entering the cliff at Lap 45.',
    'Clean air on fresh hards worth ~1.4s/lap vs traffic-bound rivals.',
    'P4 already pitted — staying out exposes us to their undercut.',
    'Rain probability 72% raises value of banking track position now.',
  ],
  confidencePct: 84,
  impact: 'P3 → P1 probability +18%. Protects podium against undercut and weather swing.',
  window: 'Lap 45–47',
  severity: 'urgent',
  source: 'mock',
}

export function Strategy({ race }: { race: RaceState }) {
  const [rec, setRec] = useState<Recommendation>(fallback)
  const [busy, setBusy] = useState(false)

  async function refresh() {
    setBusy(true)
    try {
      const r = await api.strategy(race)
      setRec(r.recommendation)
    } catch {
      setRec(fallback)
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <Panel className="border-pit-red/30 bg-gradient-to-br from-pit-red/10 to-pit-panel">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-pit-red" />
              <h2 className="text-lg font-bold">AI Strategy Engine</h2>
              <Pill tone={rec.severity === 'urgent' ? 'red' : 'amber'}>{rec.severity}</Pill>
            </div>
            <button
              onClick={refresh}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-pit-line bg-pit-panel-2 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Recompute
            </button>
          </div>

          <Field label="Action">
            <div className="text-2xl font-bold">{rec.action}</div>
            {rec.window && <div className="mono mt-1 text-sm text-pit-amber">Window: {rec.window}</div>}
          </Field>

          <Field label="Why">
            <ul className="space-y-2">
              {rec.why.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <CircleDot className="mt-1 h-3 w-3 shrink-0 text-pit-red" />
                  {w}
                </li>
              ))}
            </ul>
          </Field>

          <Field label="Expected Result">
            <p className="text-sm text-pit-green">{rec.impact}</p>
          </Field>

          <div className="mt-3">
            <Confidence value={rec.confidencePct} />
          </div>
          <div className="mono mt-2 text-[11px] text-pit-muted">
            reasoning engine · {rec.source === 'mock' ? 'simulation' : rec.source}
          </div>
        </Panel>

        <PitWindowTimeline current={race.lap} />
      </div>

      <div className="space-y-4">
        <UndercutBoard race={race} />
        <InputsCard race={race} />
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-pit-line py-3 first:border-t-0 first:pt-0">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-pit-muted">{label}</div>
      {children}
    </div>
  )
}

function PitWindowTimeline({ current }: { current: number }) {
  const start = 30
  const end = 78
  const span = end - start
  const window = { from: 45, to: 47 }
  const pct = (l: number) => ((l - start) / span) * 100
  return (
    <Panel label="Pit Window Timeline" right={<Flag className="h-4 w-4 text-pit-muted" />}>
      <div className="relative mt-6 h-2 w-full rounded-full bg-pit-line">
        <div
          className="absolute top-0 h-2 rounded-full bg-pit-green/40"
          style={{ left: `${pct(window.from)}%`, width: `${pct(window.to) - pct(window.from)}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-1 rounded bg-pit-red"
          style={{ left: `${pct(current)}%` }}
          title={`Now: Lap ${current}`}
        />
        <span
          className="absolute -top-7 -translate-x-1/2 text-[10px] font-bold text-pit-red"
          style={{ left: `${pct(current)}%` }}
        >
          NOW L{current}
        </span>
        <span
          className="absolute top-3 -translate-x-1/2 text-[10px] font-semibold text-pit-green"
          style={{ left: `${(pct(window.from) + pct(window.to)) / 2}%` }}
        >
          OPTIMAL {window.from}–{window.to}
        </span>
      </div>
      <div className="mono mt-8 flex justify-between text-[10px] text-pit-muted">
        <span>L{start}</span>
        <span>L50</span>
        <span>L60</span>
        <span>L{end} FLAG</span>
      </div>
    </Panel>
  )
}

function UndercutBoard({ race }: { race: RaceState }) {
  return (
    <Panel label="Competitor Undercut Board">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-pit-muted">
            <th className="pb-2">Pos</th>
            <th className="pb-2">Driver</th>
            <th className="pb-2">Gap</th>
            <th className="pb-2">Tyre</th>
            <th className="pb-2 text-right">Threat</th>
          </tr>
        </thead>
        <tbody>
          {[...race.competitors]
            .sort((a, b) => a.position - b.position)
            .map((c) => {
              const us = c.position > race.position
              const threat = c.pitted && c.tyreAgeLaps < 8 && us
              return (
                <tr key={c.position} className="border-t border-pit-line">
                  <td className="py-2 mono font-bold">P{c.position}</td>
                  <td className="py-2">{c.driver}</td>
                  <td className={`py-2 mono ${c.gapToUs < 0 ? 'text-pit-cyan' : 'text-pit-amber'}`}>
                    {c.gapToUs < 0 ? '' : '+'}
                    {c.gapToUs.toFixed(1)}s
                  </td>
                  <td className="py-2">
                    <Pill tone={c.tyre === 'SOFT' ? 'red' : c.tyre === 'MEDIUM' ? 'amber' : 'muted'}>
                      {c.tyre} · {c.tyreAgeLaps}L
                    </Pill>
                  </td>
                  <td className="py-2 text-right">
                    {threat ? <Pill tone="red">UNDERCUT</Pill> : <span className="text-pit-muted">—</span>}
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-pit-muted">
        P4 & P5 pitted onto fresh softs — both within undercut range. Granite weights this as the
        primary driver of the box-now call.
      </p>
    </Panel>
  )
}

function InputsCard({ race }: { race: RaceState }) {
  const inputs = [
    { k: 'Telemetry', v: 'Live · 60 ch' },
    { k: 'Tyre model', v: `${race.tyres[0].compound} · ${race.tyres[0].ageLaps}L` },
    { k: 'Weather', v: `${race.weather.rainProbabilityPct}% rain` },
    { k: 'Competitors', v: `${race.competitors.length} tracked` },
    { k: 'Position', v: `P${race.position}` },
  ]
  return (
    <Panel label="Decision Inputs" right={<Gauge className="h-4 w-4 text-pit-muted" />}>
      <div className="grid grid-cols-2 gap-2">
        {inputs.map((i) => (
          <div key={i.k} className="rounded-lg border border-pit-line bg-pit-panel-2 px-3 py-2">
            <div className="panel-label">{i.k}</div>
            <div className="mono text-sm font-semibold">{i.v}</div>
          </div>
        ))}
      </div>
      <div className="mono mt-3 text-[11px] text-pit-muted">
        Pipeline: Telemetry → Feature extraction → Race context → IBM Granite → Decision → Explanation
      </div>
    </Panel>
  )
}
