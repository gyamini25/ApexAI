import {
  LayoutDashboard,
  Brain,
  Activity,
  FlaskConical,
  FileText,
  Cloud,
  Cpu,
  Play,
  Pause,
} from 'lucide-react'
import type { RaceState } from '../lib/types'
import { Logo } from './Logo'

export type Screen = 'dashboard' | 'strategy' | 'telemetry' | 'simulation' | 'documents'

const TABS: { id: Screen; label: string; icon: typeof Brain }[] = [
  { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard },
  { id: 'strategy', label: 'Strategy', icon: Brain },
  { id: 'telemetry', label: 'Telemetry', icon: Activity },
  { id: 'simulation', label: 'What-If', icon: FlaskConical },
  { id: 'documents', label: 'Intel', icon: FileText },
]

export function CommandBar({
  screen,
  onScreen,
  race,
  graniteOnline,
  running,
  onToggleLive,
}: {
  screen: Screen
  onScreen: (s: Screen) => void
  race: RaceState
  graniteOnline: boolean
  running: boolean
  onToggleLive: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-pit-line bg-pit-bg/85 backdrop-blur-xl">
      {/* Row 1 — brand + live race strip + status */}
      <div className="flex items-stretch">
        {/* Brand block */}
        <div className="flex items-center gap-3 border-r border-pit-line px-5 py-3">
          <Logo size={38} />
          <div className="leading-tight">
            <div className="text-lg font-black italic tracking-tight">
              Apex<span className="text-pit-red">AI</span>
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-pit-muted">
              Autonomous Race Engineer
            </div>
          </div>
        </div>

        {/* Live race telemetry strip */}
        <div className="flex flex-1 items-center gap-6 overflow-x-auto px-5">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="live-dot h-2 w-2 rounded-full bg-pit-red" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-pit-red">Live</span>
            <span className="text-sm font-semibold">{race.race}</span>
          </div>
          <StripStat label="Lap" value={`${race.lap} / ${race.totalLaps}`} />
          <StripStat label="Pos" value={`P${race.position}`} tone="text-pit-text" />
          <StripStat label="Leader" value={`+${race.gapToLeader.toFixed(3)}`} />
          <StripStat label="Interval" value={`+${race.interval.toFixed(3)}`} />
          <StripStat label="Best" value={race.bestLap} tone="text-pit-purple" />
          <div className="hidden items-center gap-2 whitespace-nowrap xl:flex">
            <Cloud className="h-4 w-4 text-pit-cyan" />
            <span className="mono text-sm">
              {race.weather.airTempC}° air · {race.weather.trackTempC}° track ·{' '}
              <span className="text-pit-amber">{race.weather.rainProbabilityPct}% rain</span>
            </span>
          </div>
        </div>

        {/* Engine status */}
        <div className="flex items-center gap-3 border-l border-pit-line px-5">
          <div className="flex items-center gap-2">
            <Cpu className={`h-4 w-4 ${graniteOnline ? 'text-pit-green' : 'text-pit-amber'}`} />
            <div className="leading-tight">
              <div className="text-[9px] uppercase tracking-widest text-pit-muted">AI Engine</div>
              <div className="text-xs font-semibold">
                IBM Granite{' '}
                <span className={graniteOnline ? 'text-pit-green' : 'text-pit-amber'}>
                  {graniteOnline ? 'live' : 'sim'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 — pit-wall tab switches */}
      <nav className="flex items-center gap-1 border-t border-pit-line/60 px-3 py-1.5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = screen === id
          return (
            <button
              key={id}
              onClick={() => onScreen(id)}
              className={`group relative flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-semibold transition ${
                active ? 'text-pit-text' : 'text-pit-muted hover:text-pit-text'
              }`}
            >
              {active && (
                <span className="absolute inset-0 -z-10 rounded-md border border-pit-red/40 bg-pit-red/10" />
              )}
              <Icon className={`h-4 w-4 ${active ? 'text-pit-red' : ''}`} />
              {label}
            </button>
          )
        })}
        <button
          onClick={onToggleLive}
          className={`ml-auto flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
            running
              ? 'border-pit-green/40 bg-pit-green/10 text-pit-green'
              : 'border-pit-red/40 bg-pit-red/10 text-pit-red hover:bg-pit-red/20'
          }`}
          title={running ? 'Pause the live race feed' : 'Start the live race feed'}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running ? 'Race Live' : 'Go Live'}
          {running && <span className="h-2 w-2 rounded-full bg-pit-green live-dot" />}
        </button>
      </nav>
    </header>
  )
}

function StripStat({
  label,
  value,
  tone = 'text-pit-text',
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex flex-col whitespace-nowrap leading-none">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-pit-muted">
        {label}
      </span>
      <span className={`mono text-sm font-semibold ${tone}`}>{value}</span>
    </div>
  )
}
