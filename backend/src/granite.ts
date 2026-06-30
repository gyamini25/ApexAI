import 'dotenv/config'

// ── IBM watsonx Granite client ──────────────────────────────────────────────
// Calls IBM Granite via the watsonx.ai text-generation API. Falls back to a
// deterministic local engine when credentials are absent so the demo never dies.

const API_KEY = process.env.WATSONX_API_KEY ?? ''
const PROJECT_ID = process.env.WATSONX_PROJECT_ID ?? ''
const REGION = process.env.WATSONX_REGION ?? 'us-south'
const MODEL_ID = process.env.WATSONX_MODEL_ID ?? 'ibm/granite-3-8b-instruct'
const BASE = `https://${REGION}.ml.cloud.ibm.com`

export const graniteConfigured = Boolean(API_KEY && PROJECT_ID)

let token: { value: string; exp: number } | null = null

async function iamToken(): Promise<string> {
  const now = Date.now()
  if (token && token.exp > now + 60_000) return token.value
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: API_KEY,
    }),
  })
  if (!res.ok) throw new Error(`IAM token ${res.status}`)
  const json: any = await res.json()
  token = { value: json.access_token, exp: now + (json.expires_in ?? 3600) * 1000 }
  return token.value
}

export interface GraniteOptions {
  maxTokens?: number
  temperature?: number
  stop?: string[]
}

export async function graniteGenerate(
  prompt: string,
  opts: GraniteOptions = {},
): Promise<string> {
  const bearer = await iamToken()
  // Granite 4 is a chat model — use the /text/chat endpoint with messages.
  // We accept a single prompt string and split an optional leading system block.
  const messages = toMessages(prompt)
  const res = await fetch(`${BASE}/ml/v1/text/chat?version=2023-05-29`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({
      model_id: MODEL_ID,
      project_id: PROJECT_ID,
      messages,
      max_tokens: opts.maxTokens ?? 600,
      temperature: opts.temperature ?? 0.2,
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`watsonx ${res.status}: ${t.slice(0, 200)}`)
  }
  const json: any = await res.json()
  return (json.choices?.[0]?.message?.content ?? '').trim()
}

// Split a prompt into system + user messages. Our engine prompts put the
// persona first, then the task — we send the whole thing as the user turn,
// which Granite chat handles well, but promote an explicit "You are" lead-in
// to a system message for sharper instruction-following.
function toMessages(prompt: string): { role: string; content: string }[] {
  const idx = prompt.indexOf('\n\n')
  if (idx > 0 && /^you are/i.test(prompt.trim())) {
    return [
      { role: 'system', content: prompt.slice(0, idx).trim() },
      { role: 'user', content: prompt.slice(idx).trim() },
    ]
  }
  return [{ role: 'user', content: prompt }]
}

// Ask Granite for JSON and parse defensively.
export async function graniteJson<T>(prompt: string, opts?: GraniteOptions): Promise<T> {
  const raw = await graniteGenerate(prompt, opts)
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON in Granite output')
  return JSON.parse(raw.slice(start, end + 1)) as T
}

export const graniteInfo = { configured: graniteConfigured, model: MODEL_ID, region: REGION }
