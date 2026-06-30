import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { graniteInfo } from './granite.js'
import {
  strategy,
  chat,
  simulate,
  documentAsk,
  telemetryInsight,
} from './engine.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '8mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, granite: graniteInfo.configured, model: graniteInfo.model })
})

app.post('/api/strategy', async (req, res) => {
  try {
    res.json(await strategy(req.body.race))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const { question, race } = req.body
    res.json(await chat(question, race))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

app.post('/api/simulate', async (req, res) => {
  try {
    const { question, race } = req.body
    res.json(await simulate(question, race))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

app.post('/api/documents/ask', async (req, res) => {
  try {
    const { docName, question, text } = req.body
    res.json(await documentAsk(docName, question, text))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

app.post('/api/telemetry/parse', async (req, res) => {
  try {
    res.json(await telemetryInsight(req.body.csv ?? ''))
  } catch (e) {
    res.status(500).json({ error: (e as Error).message })
  }
})

// ── Serve the built frontend (single-server mode, no Vite needed) ───────────
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.resolve(__dirname, '../../frontend/dist')
app.use(express.static(distPath))
// SPA fallback for any non-API route
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = Number(process.env.PORT ?? 8787)
app.listen(PORT, () => {
  console.log(`\n  ApexAI → http://localhost:${PORT}  (UI + API on one server)`)
  console.log(
    `  IBM Granite: ${graniteInfo.configured ? `LIVE (${graniteInfo.model} @ ${graniteInfo.region})` : 'SIM MODE (no watsonx creds — using deterministic engine)'}\n`,
  )
})
