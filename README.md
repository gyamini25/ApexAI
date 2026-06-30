# 🏎️ ApexAI — Autonomous F1 Race Engineer Copilot

> **"An AI teammate, not an AI chatbot."**
>
> ApexAI turns millions of racing data points into decisions in seconds. It's the pit-wall
> software an F1 team would actually use — mission-control UI, an AI strategist powered by
> **IBM Granite**, document intelligence via **Docling**, and a reasoning pipeline modelled in
> **LangFlow**.

```
Without ApexAI:  10 minutes of analysis to make a pit call.
With ApexAI:     10 seconds.
```

---

## The Challenge

**The problem we're solving.**
In Formula 1, a race is won or lost on decisions made in seconds — when to pit, which tyre, how to
respond to a rival's undercut or a 70% chance of rain. A modern car streams **millions of telemetry
data points** per race, but a human race engineer can only reason over a fraction of it under
pressure. Critical calls are made on gut feel and partial data, and a single misjudged stop drops a
podium to P6. The bottleneck isn't data — it's turning data into an explainable decision fast enough
to act on.

**Our AI / technical approach.**
ApexAI is an autonomous race-engineer copilot. Live telemetry, tyre, weather, competitor and
position data are compressed into a race-context prompt and reasoned over by **IBM Granite 4**
(`granite-4-h-small`, served on IBM **watsonx.ai**) via its chat API. Granite returns a structured,
**explainable** decision — every call carries **WHAT · WHY · CONFIDENCE · IMPACT** — which renders
straight into a mission-control dashboard and a radio-style engineer chat. **Docling** extracts
structured knowledge from race reports and regulations for retrieval-grounded answers, and the
reasoning pipeline (telemetry → clean → context → Granite → decision → explanation → UI) mirrors a
**LangFlow** graph. The system degrades gracefully to a deterministic engine if the network drops,
so it never goes dark mid-race.

**Why it matters in racing.**
This is the exact workflow a real F1 strategy team runs on the pit wall — but compressed from ~10
minutes of human analysis to ~10 seconds, and made fully explainable so an engineer can *trust and
act* on the call. The same approach generalises to any high-stakes, data-dense, time-critical
decision domain: endurance racing, motorsport junior series, even logistics and trading. ApexAI
shows what an **AI teammate** on the pit wall looks like.

---

## What it does

| Feature | Description |
|---|---|
| 🧠 **AI Strategy Engine** | Every call ships with **WHAT · WHY · CONFIDENCE · IMPACT**. Reads telemetry, tyres, weather, competitors and track position. |
| 🔮 **What-If Simulator** | "What happens if we pit now?" → ranked scenario cards with finish position, confidence and delta-to-current. |
| 📻 **AI Race Engineer Chat** | Radio-style engineer conversation, not a chatbot. *"You're losing 0.4s in Sector 2 — front tyre 8°C below optimum."* |
| 📈 **Tyre Degradation Prediction** | Per-corner degradation curves with the cliff and the recommended pit window. |
| 📂 **Document Intelligence** | Upload race reports / regulations → Docling extraction → Granite answers *"what strategy worked?"* |
| 📊 **Telemetry Upload** | Drop a CSV → instant trace charts + Granite analysis. |
| ✅ **Explainable decisions** | No black boxes — every recommendation shows its reasoning. |

---

## Architecture

```
 Telemetry · Weather · Tyres · Competitors · Position
                       │
                       ▼
            Feature extraction  (backend/engine.ts)
                       │
                       ▼
   ┌───────────────────────────────────────────┐
   │            IBM Granite (watsonx.ai)        │  ← reasoning + explanations
   │   granite-3-8b-instruct  ·  graceful       │
   │   deterministic fallback when offline      │
   └───────────────────────────────────────────┘
                       │
        Decision  +  Explanation  (JSON)
                       │
                       ▼
        React mission-control dashboard
```

- **Frontend** — React + TypeScript + Vite + Tailwind v4 + Recharts. Pit-wall command bar (no SaaS sidebar).
- **Backend** — Express + TypeScript. Pluggable Granite client; flips to live watsonx the moment creds are present.
- **AI** — Granite prompts (`/ai/granite`) and a Langflow workflow (`/ai/langflow`) that mirrors the pipeline.
- **IBM stack** — Granite · Docling · Langflow · Context Forge (MCP retrieval). Full map in [`ai/IBM_RESOURCES.md`](ai/IBM_RESOURCES.md).
- **Docs** — architecture, setup, demo script (`/docs`).

---

## Quick start

The backend serves **both the built UI and the API on one port** — no separate frontend server needed.

```bash
cd frontend && npm install && npm run build   # builds the UI into frontend/dist
cd ../backend && npm install
cp .env.example .env                           # add your watsonx creds (see below)
npm start                                      # → http://localhost:8787  (UI + API + Granite)
```

Open **http://localhost:8787**. The header badge shows `IBM Granite live` (creds present) or `sim`
(deterministic engine).

> **SIM MODE is intentional** — the demo is fully functional with zero credentials, then upgrades
> to real IBM Granite reasoning by pasting your watsonx values into `backend/.env`. The judge never
> sees a dead screen.

---

## Going live with IBM Granite (watsonx.ai)

1. Create a **watsonx.ai** project at <https://dataplatform.cloud.ibm.com> and associate a
   **watsonx.ai Runtime** with it.
2. Put your **API key** and **Project ID** into `backend/.env`:
   ```env
   WATSONX_API_KEY=<your IBM Cloud IAM API key>
   WATSONX_PROJECT_ID=<your watsonx project id>
   WATSONX_REGION=eu-de                 # Frankfurt — hosts Granite chat models
   WATSONX_MODEL_ID=ibm/granite-4-h-small
   ```
   > ⚠️ **Region matters:** Granite *chat/instruct* models are region-specific. Frankfurt (`eu-de`)
   > serves `ibm/granite-4-h-small`; Dallas (`us-south`) serves `ibm/granite-3-8b-instruct`. Some
   > regions (e.g. London `eu-gb`) only host Granite *embeddings*, not chat — pick a region that has
   > the chat model you want.
3. Restart the backend. Every endpoint now reasons through **Granite 4** via watsonx's `text/chat`
   API, with the deterministic engine as an automatic fallback if a call fails. See
   [`docs/setup.md`](docs/setup.md).

---

## Repo structure

```
/frontend          React + TypeScript mission-control UI
  /src/components   CommandBar, Dashboard, Strategy, Telemetry, Simulation, Documents, EngineerChat
  /src/lib          types, mock race data, API client
/backend           Express API
  /src/granite.ts   IBM watsonx Granite client (IAM + text generation)
  /src/engine.ts    strategy / chat / simulate / documents / telemetry  (+ mock fallback)
  /src/server.ts    REST endpoints
/ai
  /granite          system + task prompts
  /langflow         LangFlow workflow (importable JSON)
/docs               architecture · setup · demo script
```

---

*Built for the IBM hackathon. Powered by IBM Granite · Docling · LangFlow.*
