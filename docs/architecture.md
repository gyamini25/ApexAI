# ApexAI — Architecture

## System overview

```
┌──────────────────────────────────────────────────────────────┐
│                      FRONTEND (React/TS)                       │
│  Pit-wall CommandBar ── Mission Control ── Strategy ── What-If │
│  ── Telemetry ── Intel ── AI Engineer Chat                     │
│            │  fetch /api/*  (Vite proxy → :8787)               │
└────────────┼──────────────────────────────────────────────────┘
             ▼
┌──────────────────────────────────────────────────────────────┐
│                      BACKEND (Express/TS)                      │
│  /api/strategy   /api/chat   /api/simulate                     │
│  /api/documents/ask   /api/telemetry/parse   /api/health       │
│            │                                                    │
│      engine.ts  (feature extraction + race context builder)    │
│            │                                                    │
│      granite.ts ── IBM watsonx IAM + text-generation           │
│            │              │                                     │
│      LIVE Granite    deterministic fallback (always available) │
└──────────────────────────────────────────────────────────────┘
```

## The reasoning pipeline (mirrors the LangFlow graph)

```
Telemetry Input
   → Data Cleaner            (CSV parse, channel detection)
   → Race Context Builder    (engine.ts `ctx()` — compresses state to a prompt)
   → Granite Reasoning Agent (granite.ts — watsonx text generation)
   → Decision Generator      (structured JSON: action/why/confidence/impact)
   → Explanation Generator   (reasoning bullets for the UI)
   → UI Output               (dashboard cards + radio bubbles)
```

## Why a pluggable AI layer
`granite.ts` exposes `graniteConfigured`, `graniteGenerate()` and `graniteJson()`. `engine.ts`
checks `graniteConfigured` per request: if creds exist it prompts Granite for JSON and parses
defensively; any failure (auth, timeout, bad JSON) drops to a deterministic, race-accurate engine.

Result: the product is **demo-proof** (works with zero creds) and **production-credible** (real
IBM Granite reasoning the moment creds land). Swapping in another model = one file.

## Document intelligence (Docling)
`/api/documents/ask` receives extracted document text (Docling in production; bundled sample text
in the demo), passes it to Granite with the user's question, and returns a structured
`{ summary, insights[] }`. The vector-retrieval step is the production extension point.

## Data models
Defined in `frontend/src/lib/types.ts`: `Driver, Car (CarHealth), Race (RaceState), Telemetry
(TelemetrySample), Strategy (Recommendation), Tyre, Weather, Document (DocInsight), Recommendation`.

## Tech
- **Frontend:** React 19, TypeScript, Vite, Tailwind v4, Recharts, lucide-react, framer-motion.
- **Backend:** Node 22, Express 5, tsx (no build step), dotenv.
- **AI:** IBM Granite via watsonx.ai; LangFlow workflow; Docling pipeline.
