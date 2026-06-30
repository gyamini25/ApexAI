import { graniteConfigured, graniteJson, graniteGenerate } from './granite.js'

type Source = 'IBM Granite' | 'mock'

const RACE_SYSTEM = `You are ApexAI, an elite Formula 1 race strategist embedded on the pit wall.
You reason over telemetry, tyre degradation, weather, competitor strategy and track position.
You are decisive and speak like a real race engineer on the radio: short, concrete, numbers-led.
Every strategic call must justify WHAT, WHY, CONFIDENCE and IMPACT.`

function ctx(race: any): string {
  const fl = race?.tyres?.find((t: any) => t.corner === 'FL')
  return `RACE STATE
Event: ${race?.race} (${race?.circuit}), Lap ${race?.lap}/${race?.totalLaps}
Position: P${race?.position}, gap to leader +${race?.gapToLeader}s, interval +${race?.interval}s
Tyres: ${fl?.compound} medium, age ${fl?.ageLaps} laps, FL condition ${fl?.conditionPct}%, deg ${fl?.degRatePerLap}%/lap
Weather: air ${race?.weather?.airTempC}C track ${race?.weather?.trackTempC}C, rain probability ${race?.weather?.rainProbabilityPct}%
Fuel: ${race?.car?.fuelKg}kg, ERS ${race?.car?.ersPct}%, engine ${race?.car?.engineTempC}C, brakes ${race?.car?.brakeTempC}C
Competitors: ${(race?.competitors ?? [])
    .map((c: any) => `P${c.position} ${c.abbr} ${c.gapToUs > 0 ? '+' : ''}${c.gapToUs}s ${c.tyre}/${c.tyreAgeLaps}L${c.pitted ? ' (pitted)' : ''}`)
    .join(', ')}`
}

// Granite sometimes returns fields in the wrong shape (e.g. `why` as a string).
// Coerce everything to the shape the UI expects so a bad payload can't crash it.
function asArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x))
  if (v == null) return []
  return String(v)
    .split(/\n|•|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function normalizeRec(r: any): Recommendation {
  return {
    action: String(r?.action ?? 'Hold position'),
    why: asArray(r?.why),
    confidencePct: Math.max(0, Math.min(100, Math.round(Number(r?.confidencePct) || 0))),
    impact: String(r?.impact ?? ''),
    window: r?.window ? String(r.window) : undefined,
    severity: ['info', 'advise', 'urgent'].includes(r?.severity) ? r.severity : 'advise',
    source: 'IBM Granite',
  }
}

interface Recommendation {
  action: string
  why: string[]
  confidencePct: number
  impact: string
  window?: string
  severity: 'info' | 'advise' | 'urgent'
  source: Source
}

// ── Strategy recommendation ─────────────────────────────────────────────────
export async function strategy(race: any) {
  if (graniteConfigured) {
    try {
      const prompt = `${RACE_SYSTEM}

${ctx(race)}

Give the single best strategic call right now. Respond ONLY with JSON:
{"action": string, "why": [string,string,string], "confidencePct": number, "impact": string, "window": string, "severity": "info"|"advise"|"urgent"}`
      const r = await graniteJson<any>(prompt, { maxTokens: 500 })
      return { recommendation: normalizeRec(r) }
    } catch (e) {
      console.warn('[granite] strategy fallback:', (e as Error).message)
    }
  }
  return {
    recommendation: {
      action: 'Pit stop recommended in next 3 laps',
      why: [
        'Front-left degradation 18% above optimal — entering the cliff at Lap 45.',
        'Two competitors behind on fresh softs; staying out concedes the undercut.',
        'Rain probability 72% raises the value of banking track position now.',
        'Projected pace drop 1.5s/lap once the medium falls off after Lap 45.',
      ],
      confidencePct: 84,
      impact: 'Holds P3 and opens P1 probability +18% via the undercut on P2.',
      window: 'Lap 45–47',
      severity: 'urgent' as const,
      source: 'mock' as Source,
    },
  }
}

// ── Engineer chat ───────────────────────────────────────────────────────────
export async function chat(question: string, race: any) {
  const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (graniteConfigured) {
    try {
      const prompt = `${RACE_SYSTEM}

${ctx(race)}

The driver/engineer asks: "${question}"
Reply on the radio in 2-4 sentences, concrete and numbers-led. Then give up to 3 bullet reasons.
Respond ONLY with JSON: {"text": string, "reasoning": [string]}`
      const r = await graniteJson<any>(prompt, { maxTokens: 450, temperature: 0.4 })
      return {
        message: {
          id: `g${Date.now()}`,
          role: 'ai',
          ts,
          source: 'IBM Granite' as Source,
          text: String(r?.text ?? ''),
          reasoning: asArray(r?.reasoning),
        },
      }
    } catch (e) {
      console.warn('[granite] chat fallback:', (e as Error).message)
    }
  }
  return { message: { ...mockChat(question, race), id: `m${Date.now()}`, role: 'ai', ts } }
}

function mockChat(q: string, race: any) {
  const t = q.toLowerCase()
  if (t.includes('losing') || t.includes('time') || t.includes('slow')) {
    return {
      text: "You're losing about 0.4s in Sector 2. Root cause is front-left tyre temperature running 8°C below the optimal window, so you're not getting the rotation through the chicane. Build temp on the next entry and it'll come back.",
      reasoning: [
        'Sector 2 delta +0.247s vs leader.',
        'FL tyre 96°C vs 104°C optimal — 8°C cold.',
        'Underrotation in low-speed corners costs apex speed.',
      ],
      source: 'mock' as Source,
    }
  }
  if (t.includes('pit') || t.includes('box') || t.includes('stop')) {
    return {
      text: 'Recommend we box within the next 3 laps. Front-left deg is climbing into the cliff and P4/P5 just pitted onto fresh softs — if we stay out we hand them the undercut. Pitting now keeps P3 and opens an attack on P2.',
      reasoning: [
        'FL degradation 18% above optimal.',
        'Undercut threat from P4/P5 on new softs.',
        'Clean air on hards worth ~1.4s/lap here.',
      ],
      source: 'mock' as Source,
    }
  }
  if (t.includes('tyre') || t.includes('tire') || t.includes('condition')) {
    return {
      text: 'Tyres are at the edge of the working window. Front-left is the limiter at 61% condition, degrading 1.5%/lap and heading for the cliff around Lap 45. Rears are healthier at ~70%. We have one strong stint left, not two.',
      reasoning: [
        'FL 61% / 1.5%/lap — limiting corner.',
        'Cliff projected at Lap 45.',
        'Rears 70%, thermally stable.',
      ],
      source: 'mock' as Source,
    }
  }
  if (t.includes('rain') || t.includes('weather') || t.includes('wet')) {
    return {
      text: 'Rain probability is up to 72% and trending. If it arrives around Lap 46 the crossover to inters is worth it within two laps. The smart hedge is to pit now for hards and bank track position — if the rain comes we react from P2/P3, not from the back of a queue.',
      reasoning: [
        'Rain probability 72% and rising.',
        'Inter crossover ~Lap 46 if it starts.',
        'Track position de-risks a weather swing.',
      ],
      source: 'mock' as Source,
    }
  }
  return {
    text: `We're P${race?.position}, ${race?.gapToLeader}s off the lead with ${race?.totalLaps - race?.lap} laps to go. Front-left degradation is the story — it's climbing faster than plan. I'd be ready to box inside three laps to protect the position and open up the undercut.`,
    reasoning: [
      `Running P${race?.position}, interval +${race?.interval}s.`,
      'FL deg above optimal range.',
      'Pit window opening Lap 45–47.',
    ],
    source: 'mock' as Source,
  }
}

// ── What-if simulation ──────────────────────────────────────────────────────
export async function simulate(question: string, race: any) {
  if (graniteConfigured) {
    try {
      const prompt = `${RACE_SYSTEM}

${ctx(race)}

Run a forward simulation for: "${question}"
Return 2-3 ranked scenarios. Respond ONLY with JSON:
{"narrative": string, "scenarios": [{"id": string, "label": string, "detail": string, "finishPosition": string, "confidencePct": number, "deltaToCurrent": string, "tone": "current"|"good"|"bad"}]}`
      const r = await graniteJson<any>(prompt, { maxTokens: 700 })
      return r
    } catch (e) {
      console.warn('[granite] simulate fallback:', (e as Error).message)
    }
  }
  return {
    narrative:
      'Granite re-ran the stint forward from the current state. The undercut path dominates: fresh hards in clean air convert the most race-finish equity, at the cost of ~4s pit loss now.',
    scenarios: [
      { id: 'a', label: 'Scenario A — Stay Out', detail: 'Hold the medium to Lap 52, single stop.', finishPosition: 'P4', confidencePct: 72, deltaToCurrent: 'Track position held but exposed to undercut.', tone: 'current' },
      { id: 'b', label: 'Scenario B — Pit Now', detail: 'Box this lap for hard, attack P2 in clean air.', finishPosition: 'P1–P2', confidencePct: 64, deltaToCurrent: 'Undercut open on P2. +18% win probability.', tone: 'good' },
      { id: 'c', label: 'Scenario C — Late Pit (L50)', detail: 'Extend stint, risk the degradation cliff.', finishPosition: 'P5–P6', confidencePct: 48, deltaToCurrent: 'High risk: pace drop 1.5s/lap, fresh-tyre cars attack.', tone: 'bad' },
    ],
  }
}

// ── Document intelligence ───────────────────────────────────────────────────
export async function documentAsk(docName: string, question: string, text: string) {
  if (graniteConfigured && text) {
    try {
      const prompt = `You are ApexAI's document intelligence over racing knowledge extracted by Docling.
DOCUMENT (${docName}):
"""${text.slice(0, 4000)}"""

Question: "${question}"
Answer as a race engineer using only the document. Respond ONLY with JSON:
{"summary": string, "insights": [string]}`
      const r = await graniteJson<any>(prompt, { maxTokens: 500 })
      return { answer: { doc: docName, source: 'IBM Granite' as Source, ...r } }
    } catch (e) {
      console.warn('[granite] document fallback:', (e as Error).message)
    }
  }
  return {
    answer: {
      doc: docName,
      summary:
        'From the indexed report, the undercut was the decisive lever at Monaco: cars boxing on laps 44–47 onto the hard gained ~1.4s/lap in clean air, while track position outweighed raw pace given overtaking difficulty.',
      insights: [
        'Pit window 44–47 captured the clean-air undercut.',
        'Medium tyre cliff after Lap 45, front-left thermally limited.',
        'Elevated safety-car probability after Lap 50 (debris).',
      ],
      source: 'mock' as Source,
    },
  }
}

// ── Telemetry CSV analysis ──────────────────────────────────────────────────
export async function telemetryInsight(csv: string) {
  const lines = csv.trim().split(/\r?\n/)
  const columns = (lines[0] ?? '').split(',').map((s) => s.trim())
  const rows = Math.max(0, lines.length - 1)
  if (graniteConfigured && rows > 0) {
    try {
      const sample = lines.slice(0, 12).join('\n')
      const prompt = `${RACE_SYSTEM}

A telemetry CSV was uploaded (${rows} samples, columns: ${columns.join(', ')}).
First rows:
${sample}

In 2 sentences, summarise the most actionable engineering insight from this trace. Plain text only.`
      const insight = await graniteGenerate(prompt, { maxTokens: 220 })
      return { rows, columns, insight }
    } catch (e) {
      console.warn('[granite] telemetry fallback:', (e as Error).message)
    }
  }
  return {
    rows,
    columns,
    insight: `Parsed ${rows} samples across ${columns.length} channels. Speed and throttle traces are consistent with a representative lap; brake-temperature build into Sector 2 is the main thermal stressor. Connect watsonx Granite for deeper degradation modelling.`,
  }
}
