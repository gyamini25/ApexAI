import { useRef, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Upload, FileSpreadsheet, Activity, CheckCircle2 } from 'lucide-react'
import { Panel } from './ui'
import { api } from '../lib/api'
import { lapTrace } from '../lib/mockData'
import type { TelemetrySample } from '../lib/types'

const AXIS = { fontSize: 10, fill: '#8a94a6' }

function parseCsv(text: string): TelemetrySample[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = (k: string) => headers.findIndex((h) => h.includes(k))
  const iSpeed = idx('speed')
  const iRpm = idx('rpm')
  const iThr = idx('throttle')
  const iBrk = idx('brake')
  const iSteer = idx('steer')
  const iG = idx('g')
  return lines.slice(1).map((row, n) => {
    const c = row.split(',')
    const num = (i: number) => (i >= 0 ? parseFloat(c[i]) || 0 : 0)
    return {
      lap: n,
      speedKmh: num(iSpeed),
      rpm: num(iRpm),
      throttlePct: num(iThr),
      brakePct: num(iBrk),
      steeringDeg: num(iSteer),
      gForce: num(iG),
      drs: false,
      ersPct: 0,
    }
  })
}

export function Telemetry() {
  const [data, setData] = useState<TelemetrySample[]>(lapTrace)
  const [fileName, setFileName] = useState<string | null>(null)
  const [insight, setInsight] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ rows: number; cols: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const text = await file.text()
    const parsed = parseCsv(text)
    setFileName(file.name)
    if (parsed.length) setData(parsed)
    try {
      const r = await api.parseTelemetry(text)
      setInsight(r.insight)
      setMeta({ rows: r.rows, cols: r.columns })
    } catch {
      setInsight(
        `Parsed ${parsed.length} samples locally. Speed peak ${Math.max(
          ...parsed.map((p) => p.speedKmh),
        )} km/h. Start the API for Granite-level analysis.`,
      )
      setMeta({ rows: parsed.length, cols: Object.keys(parsed[0] ?? {}) })
    }
  }

  const peak = Math.max(...data.map((d) => d.speedKmh))
  const avg = Math.round(data.reduce((s, d) => s + d.speedKmh, 0) / Math.max(1, data.length))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Panel label="Telemetry Trace" right={<Activity className="h-4 w-4 text-pit-muted" />}>
          <div className="mb-2 flex gap-4">
            <Tag label="Samples" value={`${data.length}`} />
            <Tag label="Peak" value={`${peak} km/h`} tone="text-pit-red" />
            <Tag label="Avg" value={`${avg} km/h`} tone="text-pit-cyan" />
            {fileName && <Tag label="Source" value={fileName} tone="text-pit-green" />}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff2d2d" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ff2d2d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2533" />
              <XAxis dataKey="lap" tick={AXIS} stroke="#1c2533" />
              <YAxis tick={AXIS} stroke="#1c2533" />
              <Tooltip contentStyle={{ background: '#0c1018', border: '1px solid #1c2533', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="speedKmh" stroke="#ff2d2d" strokeWidth={2} fill="url(#spd)" name="Speed" />
            </AreaChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2533" />
              <XAxis dataKey="lap" tick={AXIS} stroke="#1c2533" />
              <YAxis tick={AXIS} stroke="#1c2533" />
              <Tooltip contentStyle={{ background: '#0c1018', border: '1px solid #1c2533', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="throttlePct" stroke="#22e07a" strokeWidth={1.6} dot={false} name="Throttle" />
              <Line type="monotone" dataKey="brakePct" stroke="#ff2d2d" strokeWidth={1.6} dot={false} name="Brake" />
              <Line type="monotone" dataKey="gForce" stroke="#a855f7" strokeWidth={1.6} dot={false} name="G-Force" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <div className="space-y-4">
          <Panel label="Upload Telemetry">
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f) handleFile(f)
              }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-pit-line bg-pit-bg/40 px-4 py-8 text-center transition hover:border-pit-red/50"
            >
              <Upload className="h-7 w-7 text-pit-red" />
              <div className="text-sm font-semibold">Drop CSV or click to browse</div>
              <div className="text-[11px] text-pit-muted">
                columns: speed, rpm, throttle, brake, steering, g…
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-pit-red py-2 text-sm font-semibold"
            >
              <FileSpreadsheet className="h-4 w-4" /> Select CSV
            </button>
          </Panel>

          {insight && (
            <Panel label="Granite Analysis" className="border-pit-green/30">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pit-green" />
                <p className="text-sm leading-relaxed">{insight}</p>
              </div>
              {meta && (
                <div className="mono mt-2 text-[11px] text-pit-muted">
                  {meta.rows} rows · {meta.cols.length} columns
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}

function Tag({ label, value, tone = 'text-pit-text' }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="panel-label">{label}</div>
      <div className={`mono text-sm font-semibold ${tone}`}>{value}</div>
    </div>
  )
}
