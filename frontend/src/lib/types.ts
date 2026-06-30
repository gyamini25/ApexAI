// ── ApexAI shared data models ──────────────────────────────────────────────

export interface Driver {
  id: string
  name: string
  number: number
  team: string
  abbr: string
}

export interface Tyre {
  compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTER' | 'WET'
  ageLaps: number
  conditionPct: number // 0-100 remaining performance
  degRatePerLap: number // % performance lost per lap
  corner: 'FL' | 'FR' | 'RL' | 'RR'
  tempC: number
  optimalTempC: number
}

export interface Weather {
  airTempC: number
  trackTempC: number
  condition: 'DRY' | 'CLOUDY' | 'LIGHT_RAIN' | 'RAIN'
  rainProbabilityPct: number
}

export interface CarHealth {
  engineTempC: number
  brakeTempC: number
  tyreStatus: 'Good' | 'Worn' | 'Critical'
  ersPct: number
  fuelKg: number
}

export interface TelemetrySample {
  lap: number
  speedKmh: number
  rpm: number
  throttlePct: number
  brakePct: number
  steeringDeg: number
  gForce: number
  drs: boolean
  ersPct: number
}

export interface Competitor {
  position: number
  driver: string
  abbr: string
  gapToUs: number // seconds, negative = ahead of us
  tyre: Tyre['compound']
  tyreAgeLaps: number
  pitted: boolean
}

export interface RaceState {
  race: string
  circuit: string
  trackLengthKm: number
  lap: number
  totalLaps: number
  position: number
  gapToLeader: number
  interval: number
  lastLap: string
  bestLap: string
  weather: Weather
  car: CarHealth
  driver: Driver
  tyres: Tyre[]
  competitors: Competitor[]
}

export interface Recommendation {
  action: string
  why: string[]
  confidencePct: number
  impact: string
  window?: string
  severity: 'info' | 'advise' | 'urgent'
  source?: 'IBM Granite' | 'mock'
}

export interface ScenarioOutcome {
  id: string
  label: string
  detail: string
  finishPosition: string
  confidencePct: number
  deltaToCurrent: string
  tone: 'current' | 'good' | 'bad'
}

export interface ChatMessage {
  id: string
  role: 'engineer' | 'ai'
  text: string
  ts: string
  reasoning?: string[]
  source?: 'IBM Granite' | 'mock'
}

export interface RaceEvent {
  ts: string
  text: string
  kind: 'info' | 'warn' | 'good'
}

export interface DocInsight {
  doc: string
  summary: string
  insights: string[]
  source?: 'IBM Granite' | 'mock'
}
