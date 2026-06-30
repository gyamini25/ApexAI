import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Legend,
} from 'recharts'
import { degradationCurve, outcomeTraces } from '../lib/mockData'

const AXIS = { fontSize: 10, fill: '#8a94a6' }

export function Gauge({
  value,
  max,
  unit,
  label,
  color,
}: {
  value: number
  max: number
  unit: string
  label: string
  color: string
}) {
  const pct = Math.min(1, value / max)
  const r = 42
  const circ = Math.PI * r // half circle
  const dash = circ * pct
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-full max-w-[120px]">
        <path
          d="M 8 54 A 42 42 0 0 1 92 54"
          fill="none"
          stroke="#1c2533"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M 8 54 A 42 42 0 0 1 92 54"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: 'stroke-dasharray .6s' }}
        />
      </svg>
      <div className="-mt-4 text-center">
        <div className="mono text-xl font-bold" style={{ color }}>
          {value}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-pit-muted">{unit}</div>
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-pit-muted">
        {label}
      </div>
    </div>
  )
}

export function DegradationChart() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={degradationCurve} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2533" />
        <XAxis dataKey="lap" tick={AXIS} stroke="#1c2533" />
        <YAxis tick={AXIS} stroke="#1c2533" domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            background: '#0c1018',
            border: '1px solid #1c2533',
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: '#8a94a6' }}
        />
        <ReferenceArea x1={45} x2={47} fill="#ff2d2d" fillOpacity={0.12} />
        <ReferenceLine x={42} stroke="#8a94a6" strokeDasharray="4 4" label={{ value: 'NOW', fill: '#8a94a6', fontSize: 10, position: 'top' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="FL" stroke="#ff2d2d" strokeWidth={2} dot={false} name="Front L" />
        <Line type="monotone" dataKey="FR" stroke="#ffb020" strokeWidth={2} dot={false} name="Front R" />
        <Line type="monotone" dataKey="RL" stroke="#22e07a" strokeWidth={2} dot={false} name="Rear L" />
        <Line type="monotone" dataKey="RR" stroke="#3b82f6" strokeWidth={2} dot={false} name="Rear R" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function OutcomeChart({ which }: { which: 'current' | 'early' | 'late' }) {
  const data = outcomeTraces[which]
  const color = which === 'current' ? '#ff2d2d' : which === 'early' ? '#22e07a' : '#ffb020'
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
        <YAxis hide domain={[0, 7]} reversed />
        <Line type="monotone" dataKey="p" stroke={color} strokeWidth={2.5} dot={{ r: 2, fill: color }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Stylised Monaco-ish circuit outline with sector colouring
export function TrackMap() {
  return (
    <svg viewBox="0 0 260 150" className="w-full">
      <path
        d="M20 110 C 30 60 60 50 80 60 C 100 70 95 95 120 100 C 150 106 150 70 175 60 C 205 48 225 70 220 95 C 216 118 185 120 165 115 C 130 105 120 130 90 130 C 55 130 30 130 20 110 Z"
        fill="none"
        stroke="#1c2533"
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path d="M20 110 C 30 60 60 50 80 60 C 100 70 95 95 120 100" fill="none" stroke="#ff2d2d" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M120 100 C 150 106 150 70 175 60 C 205 48 225 70 220 95" fill="none" stroke="#28e0d8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M220 95 C 216 118 185 120 165 115 C 130 105 120 130 90 130 C 55 130 30 130 20 110" fill="none" stroke="#ffb020" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="80" cy="60" r="4" fill="#ff2d2d">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
