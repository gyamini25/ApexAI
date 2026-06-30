import type {
  RaceState,
  Recommendation,
  ChatMessage,
  ScenarioOutcome,
  DocInsight,
} from './types'

const BASE = '/api'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} ${res.status}`)
  return res.json() as Promise<T>
}

export const api = {
  async health(): Promise<{ ok: boolean; granite: boolean; model?: string }> {
    try {
      const r = await fetch(`${BASE}/health`)
      return await r.json()
    } catch {
      return { ok: false, granite: false }
    }
  },

  strategy(race: RaceState): Promise<{ recommendation: Recommendation }> {
    return post('/strategy', { race })
  },

  chat(
    question: string,
    race: RaceState,
    history: ChatMessage[],
  ): Promise<{ message: ChatMessage }> {
    return post('/chat', { question, race, history })
  },

  simulate(
    question: string,
    race: RaceState,
  ): Promise<{ scenarios: ScenarioOutcome[]; narrative: string }> {
    return post('/simulate', { question, race })
  },

  parseTelemetry(csv: string): Promise<{ rows: number; columns: string[]; insight: string }> {
    return post('/telemetry/parse', { csv })
  },

  document(
    docName: string,
    question: string,
    text: string,
  ): Promise<{ answer: DocInsight }> {
    return post('/documents/ask', { docName, question, text })
  },
}
