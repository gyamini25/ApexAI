import { useEffect, useState } from 'react'
import {
  Sparkles,
  Gauge as GaugeIcon,
  Thermometer,
  Disc3,
  BatteryCharging,
  Fuel,
  TrendingUp,
  ArrowRight,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { Panel, Confidence } from './ui'
import { Gauge, DegradationChart, OutcomeChart, TrackMap } from './charts'
import { EngineerChat } from './EngineerChat'
import { api } from '../lib/api'
import {
  liveTelemetry,
  recentEvents,
  sectors,
  raceState,
} from '../lib/mockData'
import type { RaceState, Recommendation } from '../lib/types'

export function Dashboard({ race }: { race: RaceState }) {
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [loadingRec, setLoadingRec] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .strategy(race)
      .then((r) => alive && setRec(r.recommendation))
      .catch(() => alive && setRec(fallbackRec))
      .finally(() => alive && setLoadingRec(false))
    return () => {
      alive = false
    }
  }, [race])

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
      {/* LEFT — mission control grid */}
      <div className="space-y-4">
        {/* Top row: strategy recommendation + race overview + car health */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StrategyRecommendation rec={rec} loading={loadingRec} />
          <RaceOverview race={race} />
          <CarHealthCard race={race} />
        </div>

        {/* Middle row: tyre deg + predicted outcome */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Panel label="Tyre Degradation Prediction" right={<span className="panel-label text-pit-amber">cliff @ lap 45</span>}>
            <DegradationChart />
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-pit-amber/20 bg-pit-amber/5 px-3 py-2 text-xs text-pit-amber">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Recommended pit window <b className="mono">Lap 45–47</b> — projected pace drop 1.5s/lap after the cliff.
            </div>
          </Panel>
          <PredictedOutcome />
        </div>

        {/* Bottom row: live telemetry gauges + AI insight + events */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
          <LiveTelemetry />
          <AIInsight />
          <RecentEvents />
        </div>
      </div>

      {/* RIGHT — AI engineer */}
      <div className="xl:sticky xl:top-[112px] xl:h-[calc(100vh-132px)]">
        <EngineerChat race={race} />
      </div>
    </div>
  )
}

const fallbackRec: Recommendation = {
  action: 'Pit stop recommended in next 3 laps',
  why: [
    'Front-left tyre degradation 18% above optimal range.',
    'Rain probability increased to 72%.',
    'Two competitors behind on fresher rubber — undercut threat.',
    'Projected pace drop 1.5s/lap after Lap 45.',
  ],
  confidencePct: 84,
  impact: 'Holds P3, protects against undercut. +18% P1 probability via early pit.',
  window: 'Lap 45–47',
  severity: 'urgent',
  source: 'mock',
}

function StrategyRecommendation({
  rec,
  loading,
}: {
  rec: Recommendation | null
  loading: boolean
}) {
  const r = rec ?? fallbackRec
  return (
    <Panel className="scan relative overflow-hidden border-pit-red/30 bg-gradient-to-br from-pit-red/10 via-pit-panel to-pit-panel lg:col-span-1">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pit-red" />
          <span className="text-xs font-bold uppercase tracking-widest text-pit-red">
            AI Strategy Call
          </span>
        </div>
        {r.source && (
          <span className="rounded bg-pit-line/60 px-2 py-0.5 text-[9px] uppercase tracking-wide text-pit-muted">
            {r.source === 'mock' ? 'sim' : r.source}
          </span>
        )}
      </div>

      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-pit-muted">Action</div>
      <h2 className="text-xl font-bold leading-tight">
        {loading ? 'Analysing telemetry…' : r.action}
      </h2>
      {r.window && (
        <div className="mono mt-1 text-sm text-pit-amber">Optimal window: {r.window}</div>
      )}

      <div className="my-3 h-px bg-pit-line" />
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-pit-muted">Why</div>
      <ul className="space-y-1.5">
        {r.why.slice(0, 4).map((w, i) => (
          <li key={i} className="flex gap-2 text-xs text-pit-text">
            <CircleDot className="mt-0.5 h-3 w-3 shrink-0 text-pit-red" />
            {w}
          </li>
        ))}
      </ul>

      <div className="my-3 h-px bg-pit-line" />
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-pit-muted">
        Expected Result
      </div>
      <p className="text-xs text-pit-green">{r.impact}</p>

      <div className="mt-3">
        <Confidence value={r.confidencePct} />
      </div>
    </Panel>
  )
}

function RaceOverview({ race }: { race: RaceState }) {
  return (
    <Panel label="Race Overview">
      <TrackMap />
      <div className="mt-2 space-y-1.5">
        {sectors.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-sm">
            <span className="panel-label">{s.name}</span>
            <span className="flex items-center gap-2">
              <span className="mono font-semibold">{s.time}</span>
              <span className={`mono text-xs ${s.delta < 0 ? 'text-pit-green' : 'text-pit-red'}`}>
                {s.delta < 0 ? '' : '+'}
                {s.delta.toFixed(3)}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-pit-line pt-2 text-center">
        <Mini label="Track" value={race.circuit} />
        <Mini label="Length" value={`${race.trackLengthKm} km`} />
        <Mini label="Laps" value={`${race.lap}/${race.totalLaps}`} />
      </div>
    </Panel>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="panel-label">{label}</div>
      <div className="mono text-sm font-semibold">{value}</div>
    </div>
  )
}

function CarHealthCard({ race }: { race: RaceState }) {
  const rows = [
    { icon: Thermometer, label: 'Engine', value: `${race.car.engineTempC}°C`, tone: 'text-pit-amber' },
    { icon: Disc3, label: 'Brakes', value: `${race.car.brakeTempC}°C`, tone: 'text-pit-red' },
    { icon: CircleDot, label: 'Tyres', value: race.car.tyreStatus, tone: 'text-pit-green' },
    { icon: BatteryCharging, label: 'ERS', value: `${race.car.ersPct}%`, tone: 'text-pit-cyan' },
    { icon: Fuel, label: 'Fuel', value: `${race.car.fuelKg} kg`, tone: 'text-pit-text' },
  ]
  return (
    <Panel label="Car Health">
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-pit-muted">
              <r.icon className={`h-4 w-4 ${r.tone}`} /> {r.label}
            </span>
            <span className={`mono text-sm font-semibold ${r.tone}`}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2 border-t border-pit-line pt-3">
        {race.tyres.map((t) => (
          <div key={t.corner} className="flex items-center gap-2">
            <span className="w-7 text-[10px] font-bold text-pit-muted">{t.corner}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pit-line">
              <div
                className={`h-full rounded-full ${
                  t.conditionPct > 65 ? 'bg-pit-green' : t.conditionPct > 45 ? 'bg-pit-amber' : 'bg-pit-red'
                }`}
                style={{ width: `${t.conditionPct}%` }}
              />
            </div>
            <span className="mono w-9 text-right text-[11px] text-pit-muted">{t.conditionPct}%</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function PredictedOutcome() {
  const rows = [
    { label: 'Current Strategy', sub: 'Stay out → 1-stop', pos: 'P3', conf: 72, which: 'current' as const, tone: 'text-pit-red' },
    { label: 'Early Pit (Lap 45)', sub: 'Undercut P2', pos: 'P1–P2', conf: 64, which: 'early' as const, tone: 'text-pit-green' },
    { label: 'Late Pit (Lap 50)', sub: 'Extend stint', pos: 'P5–P6', conf: 48, which: 'late' as const, tone: 'text-pit-amber' },
  ]
  return (
    <Panel label="Predicted Race Outcome" right={<TrendingUp className="h-4 w-4 text-pit-muted" />}>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-pit-line bg-pit-panel-2 p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">{r.label}</div>
                <div className="text-[11px] text-pit-muted">{r.sub}</div>
              </div>
              <div className="text-right">
                <div className={`mono text-lg font-bold ${r.tone}`}>{r.pos}</div>
                <div className="text-[10px] text-pit-muted">{r.conf}% conf</div>
              </div>
            </div>
            <div className="mt-1">
              <OutcomeChart which={r.which} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function LiveTelemetry() {
  return (
    <Panel label="Live Telemetry" right={<GaugeIcon className="h-4 w-4 text-pit-muted" />}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Gauge value={liveTelemetry.speedKmh} max={360} unit="km/h" label="Speed" color="#ff2d2d" />
        <Gauge value={liveTelemetry.rpm} max={15000} unit="rpm" label="Engine" color="#ffb020" />
        <Gauge value={liveTelemetry.throttlePct} max={100} unit="%" label="Throttle" color="#22e07a" />
        <Gauge value={liveTelemetry.gForce} max={6} unit="G" label="G-Force" color="#a855f7" />
      </div>
    </Panel>
  )
}

function AIInsight() {
  return (
    <Panel label="AI Insight">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-pit-purple/15">
          <Sparkles className="h-4 w-4 text-pit-purple" />
        </div>
        <div>
          <p className="text-sm leading-relaxed text-pit-text">
            Tyre degradation rate has increased by{' '}
            <b className="text-pit-amber">23%</b> in the last 5 laps. Rear-left thermal load is the
            limiting factor — monitor closely into the cliff.
          </p>
          <div className="mt-2 text-[11px] text-pit-muted">Granite analysis · 2 mins ago</div>
        </div>
      </div>
    </Panel>
  )
}

function RecentEvents() {
  const iconFor = (k: string) =>
    k === 'good' ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-pit-green" />
    ) : k === 'warn' ? (
      <AlertTriangle className="h-3.5 w-3.5 text-pit-amber" />
    ) : (
      <Info className="h-3.5 w-3.5 text-pit-cyan" />
    )
  return (
    <Panel label="Race Events">
      <ul className="space-y-2.5">
        {recentEvents.map((e, i) => (
          <li key={i} className="flex items-start gap-2">
            {iconFor(e.kind)}
            <div>
              <div className="text-sm leading-tight text-pit-text">{e.text}</div>
              <div className="mono text-[10px] text-pit-muted">{e.ts}</div>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-pit-red">
        View all events <ArrowRight className="h-3 w-3" />
      </button>
    </Panel>
  )
}

export { raceState }
