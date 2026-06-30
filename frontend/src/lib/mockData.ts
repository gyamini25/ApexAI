import type {
  RaceState,
  TelemetrySample,
  RaceEvent,
  ScenarioOutcome,
} from './types'

export const raceState: RaceState = {
  race: 'Monaco Grand Prix 2025',
  circuit: 'Monaco',
  trackLengthKm: 3.337,
  lap: 42,
  totalLaps: 78,
  position: 3,
  gapToLeader: 12.453,
  interval: 2.105,
  lastLap: '1:13.254',
  bestLap: '1:12.845',
  weather: {
    airTempC: 24,
    trackTempC: 38,
    condition: 'LIGHT_RAIN',
    rainProbabilityPct: 72,
  },
  car: {
    engineTempC: 92,
    brakeTempC: 487,
    tyreStatus: 'Good',
    ersPct: 78,
    fuelKg: 32.4,
  },
  driver: { id: 'd1', name: 'M. Gorynski', number: 16, team: 'Apex Racing', abbr: 'GOR' },
  tyres: [
    { corner: 'FL', compound: 'MEDIUM', ageLaps: 18, conditionPct: 61, degRatePerLap: 1.5, tempC: 96, optimalTempC: 104 },
    { corner: 'FR', compound: 'MEDIUM', ageLaps: 18, conditionPct: 66, degRatePerLap: 1.3, tempC: 101, optimalTempC: 104 },
    { corner: 'RL', compound: 'MEDIUM', ageLaps: 18, conditionPct: 70, degRatePerLap: 1.1, tempC: 99, optimalTempC: 102 },
    { corner: 'RR', compound: 'MEDIUM', ageLaps: 18, conditionPct: 72, degRatePerLap: 1.0, tempC: 100, optimalTempC: 102 },
  ],
  competitors: [
    { position: 1, driver: 'C. Leconte', abbr: 'LEC', gapToUs: -12.453, tyre: 'HARD', tyreAgeLaps: 24, pitted: true },
    { position: 2, driver: 'A. Verster', abbr: 'VER', gapToUs: -2.105, tyre: 'MEDIUM', tyreAgeLaps: 16, pitted: false },
    { position: 4, driver: 'L. Norreys', abbr: 'NOR', gapToUs: 3.4, tyre: 'SOFT', tyreAgeLaps: 4, pitted: true },
    { position: 5, driver: 'G. Russos', abbr: 'RUS', gapToUs: 8.9, tyre: 'SOFT', tyreAgeLaps: 4, pitted: true },
  ],
}

// Tyre degradation prediction curves (per corner) across the stint
export const degradationCurve: { lap: number; FL: number; FR: number; RL: number; RR: number }[] =
  Array.from({ length: 11 }, (_, i) => {
    const lap = 30 + i * 5
    const t = i / 10
    const cliff = lap >= 45 ? (lap - 45) * 1.8 : 0
    return {
      lap,
      FL: Math.max(8, Math.round(95 - t * 55 - cliff)),
      FR: Math.max(10, Math.round(95 - t * 50 - cliff * 0.9)),
      RL: Math.max(14, Math.round(96 - t * 44 - cliff * 0.7)),
      RR: Math.max(16, Math.round(96 - t * 42 - cliff * 0.65)),
    }
  })

// Predicted race outcome traces
export const outcomeTraces = {
  current: [3, 3, 3, 4, 4, 3, 3, 3].map((p, i) => ({ x: i, p })),
  early: [3, 3, 2, 2, 1, 2, 1, 1].map((p, i) => ({ x: i, p })),
  late: [3, 4, 5, 5, 6, 6, 5, 5].map((p, i) => ({ x: i, p })),
}

export const liveTelemetry: TelemetrySample = {
  lap: 42,
  speedKmh: 285,
  rpm: 11600,
  throttlePct: 88,
  brakePct: 0,
  steeringDeg: -1.2,
  gForce: 3.2,
  drs: true,
  ersPct: 78,
}

// A lap trace used by the telemetry screen / generated when CSV is uploaded
export const lapTrace: TelemetrySample[] = Array.from({ length: 60 }, (_, i) => {
  const phase = i / 60
  const corner = Math.sin(phase * Math.PI * 6)
  return {
    lap: 42,
    speedKmh: Math.round(180 + 120 * (0.5 + 0.5 * Math.cos(phase * Math.PI * 6))),
    rpm: Math.round(9000 + 3500 * (0.5 + 0.5 * Math.cos(phase * Math.PI * 6))),
    throttlePct: Math.round(Math.max(0, 100 * Math.cos(phase * Math.PI * 6))),
    brakePct: Math.round(Math.max(0, -100 * Math.cos(phase * Math.PI * 6))),
    steeringDeg: Math.round(corner * 110),
    gForce: +(Math.abs(corner) * 4.4).toFixed(1),
    drs: corner > 0.7,
    ersPct: Math.round(60 + 38 * Math.sin(phase * Math.PI * 2)),
  }
})

export const recentEvents: RaceEvent[] = [
  { ts: '10:21 AM', text: 'Rain probability increased to 72%', kind: 'warn' },
  { ts: '10:18 AM', text: 'Car behind (P4) pitted — undercut threat', kind: 'warn' },
  { ts: '10:15 AM', text: 'Fastest lap 1:12.845', kind: 'good' },
  { ts: '10:11 AM', text: 'DRS enabled — main straight', kind: 'info' },
  { ts: '10:07 AM', text: 'Sector 2 purple — +0.247 to leader', kind: 'good' },
]

export const sectors = [
  { name: 'SECTOR 1', time: '22.653', delta: -0.134 },
  { name: 'SECTOR 2', time: '28.541', delta: +0.247 },
  { name: 'SECTOR 3', time: '22.060', delta: -0.045 },
]

export const baselineScenarios: ScenarioOutcome[] = [
  {
    id: 'a',
    label: 'Scenario A — Stay Out',
    detail: 'Hold current medium stint to Lap 52, single stop to hard.',
    finishPosition: 'P4',
    confidencePct: 72,
    deltaToCurrent: 'Track position held, but exposed to undercut.',
    tone: 'current',
  },
  {
    id: 'b',
    label: 'Scenario B — Pit Now (Undercut)',
    detail: 'Box this lap for hard, attack P2 with fresh rubber + clean air.',
    finishPosition: 'P1–P2',
    confidencePct: 64,
    deltaToCurrent: 'Undercut window open on P2. +18% win probability.',
    tone: 'good',
  },
  {
    id: 'c',
    label: 'Scenario C — Late Pit (Lap 50)',
    detail: 'Extend stint, risk degradation cliff after Lap 45.',
    finishPosition: 'P5–P6',
    confidencePct: 48,
    deltaToCurrent: 'High risk — pace drop 1.5s/lap, vulnerable to fresh tyres.',
    tone: 'bad',
  },
]
