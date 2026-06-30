# 🎬 ApexAI — Hackathon Judging Demo (90 seconds)

> Goal: prove a real F1-team tool that turns data into decisions in seconds.

## Setup (before judges arrive)
- Backend running (`cd backend && npm start`). Add watsonx creds to `.env` for the live badge.
- Frontend running (`cd frontend && npm run dev`) at <http://localhost:5173>.
- Have `frontend/public/sample-telemetry.csv` ready to drag in.

## The story

**0:00 — The hook.**
> "A pit-stop decision normally takes a race engineer ~10 minutes of analysis. Watch ApexAI do it in 10 seconds."

Land on **Mission Control**. Point at the live race strip (Lap 42/78, P3, +12.4s) and the
red **AI Strategy Call** card — *"Pit stop recommended in next 3 laps."*

**0:15 — Explainability.**
Read the card aloud: it shows **WHAT** (pit in 3 laps), **WHY** (4 bullet reasons),
**CONFIDENCE** (84%), **EXPECTED RESULT** (P3 → P1 +18%). "No black box — every call shows its reasoning."

**0:30 — The engineer talks back.**
On the right panel, click **"Why am I losing time?"**
> ApexAI: *"You're losing 0.4s in Sector 2 — front-left tyre 8°C below optimum…"*
"That's an engineer conversation, not a chatbot."

**0:45 — What-if.**
Go to **What-If**. Click *"What happens if we pit now?"* → three ranked scenario cards appear
(Stay out → P4, Pit now → P1–P2, Late pit → P5–P6). "The judge can explore the strategy tree live."

**1:00 — Upload telemetry.**
Go to **Telemetry**, drag in `sample-telemetry.csv`. Charts redraw, Granite returns an insight.
"Drop in raw data, get analysis instantly."

**1:15 — Document intelligence.**
Go to **Intel**. With the 2025 Monaco report selected, click *"What strategy worked at Monaco?"*
> Docling-extracted knowledge → Granite answers with the undercut insight.

**1:30 — Close.**
> "ApexAI is an autonomous race engineer that turns millions of racing data points into decisions
> in seconds. Powered by IBM Granite, Docling and LangFlow."

## Backup if the network drops
SIM MODE produces the same scripted, race-accurate responses with **zero** credentials —
the demo is bulletproof. The `IBM Granite sim/live` badge in the header tells you which mode you're in.
