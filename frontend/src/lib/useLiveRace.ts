import { useEffect, useRef, useState, useCallback } from 'react'
import type { RaceState, TelemetrySample } from './types'
import { liveTelemetry as baseTelemetry } from './mockData'

export interface LiveRace {
  race: RaceState
  telemetry: TelemetrySample
  running: boolean
  toggle: () => void
  reset: () => void
}

// Drives a live, ticking race forward — lap counter, tyre degradation, fuel
// burn and fluctuating telemetry — so the dashboard feels like real garage
// software during the demo rather than a static mockup.
export function useLiveRace(base: RaceState): LiveRace {
  const [race, setRace] = useState<RaceState>(base)
  const [telemetry, setTelemetry] = useState<TelemetrySample>(baseTelemetry)
  const [running, setRunning] = useState(false)
  const tick = useRef(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      tick.current += 1
      const t = tick.current

      // Fast channel: telemetry fluctuates every tick (~600ms)
      const phase = (t % 12) / 12
      const corner = Math.sin(phase * Math.PI * 2)
      setTelemetry({
        lap: race.lap,
        speedKmh: Math.round(210 + 120 * (0.5 + 0.5 * Math.cos(phase * Math.PI * 2))),
        rpm: Math.round(10200 + 4200 * (0.5 + 0.5 * Math.cos(phase * Math.PI * 2))),
        throttlePct: Math.round(Math.max(0, 100 * Math.cos(phase * Math.PI * 2))),
        brakePct: Math.round(Math.max(0, -90 * Math.cos(phase * Math.PI * 2))),
        steeringDeg: Math.round(corner * 95),
        gForce: +(1.5 + Math.abs(corner) * 3).toFixed(1),
        drs: corner > 0.6,
        ersPct: Math.round(60 + 35 * Math.sin(phase * Math.PI)),
      })

      // Slow channel: advance the race roughly every 3 ticks (~2s/lap)
      if (t % 3 === 0) {
        setRace((r) => {
          if (r.lap >= r.totalLaps) return r
          const nextLap = r.lap + 1
          return {
            ...r,
            lap: nextLap,
            car: {
              ...r.car,
              fuelKg: Math.max(0, +(r.car.fuelKg - 0.42).toFixed(1)),
              ersPct: Math.round(55 + 40 * Math.abs(Math.sin(nextLap / 4))),
              brakeTempC: 470 + Math.round(40 * Math.abs(Math.sin(nextLap / 3))),
            },
            tyres: r.tyres.map((ty) => ({
              ...ty,
              ageLaps: ty.ageLaps + 1,
              conditionPct: Math.max(4, +(ty.conditionPct - ty.degRatePerLap).toFixed(1)),
            })),
          }
        })
      }
    }, 600)
    return () => clearInterval(id)
  }, [running, race.lap])

  const toggle = useCallback(() => setRunning((v) => !v), [])
  const reset = useCallback(() => {
    setRunning(false)
    tick.current = 0
    setRace(base)
    setTelemetry(baseTelemetry)
  }, [base])

  return { race, telemetry, running, toggle, reset }
}
