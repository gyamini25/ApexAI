# ApexAI — Setup

## Prerequisites
- Node.js 20+ (tested on 22)
- npm 10+

## Install & run

```bash
# backend
cd backend && npm install && npm start      # http://localhost:8787

# frontend (new terminal)
cd frontend && npm install && npm run dev    # http://localhost:5173
```

Or from the repo root: `npm install && npm run dev` (boots both via `concurrently`).

## Modes

| Mode | Trigger | Behaviour |
|---|---|---|
| **SIM** | no watsonx creds | Deterministic, race-accurate engineer engine. Header badge: `IBM Granite sim`. |
| **LIVE** | creds in `backend/.env` | Real IBM Granite reasoning via watsonx. Header badge: `IBM Granite live`. |

## Enabling IBM Granite (watsonx.ai)

1. Sign in to <https://dataplatform.cloud.ibm.com> and create/open a **watsonx.ai project**.
2. **API key:** IBM Cloud → *Manage → Access (IAM) → API keys → Create*.
3. **Project ID:** watsonx project → *Manage → General → Project ID*.
4. Fill `backend/.env`:
   ```env
   WATSONX_API_KEY=your_key
   WATSONX_PROJECT_ID=your_project_id
   WATSONX_REGION=us-south          # or eu-de, eu-gb, jp-tok…
   WATSONX_MODEL_ID=ibm/granite-3-8b-instruct
   ```
5. Restart the backend. It prints `IBM Granite: LIVE (...)` on boot.

The backend authenticates via IBM IAM (`iam.cloud.ibm.com/identity/token`, cached) and calls the
watsonx text-generation endpoint (`/ml/v1/text/generation`).

## Endpoints
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/health` | — | `{ ok, granite, model }` |
| POST | `/api/strategy` | `{ race }` | `{ recommendation }` |
| POST | `/api/chat` | `{ question, race, history }` | `{ message }` |
| POST | `/api/simulate` | `{ question, race }` | `{ scenarios, narrative }` |
| POST | `/api/documents/ask` | `{ docName, question, text }` | `{ answer }` |
| POST | `/api/documents/extract` | multipart `file` | `{ docName, text, method, chars }` |
| POST | `/api/telemetry/parse` | `{ csv }` | `{ rows, columns, insight }` |

### Document extraction (Docling)
Uploads are extracted by `backend/src/docparse.ts`: **Docling** (structured Markdown) when enabled,
falling back to **pdf-parse** for PDFs, then plain text — so it always works. To use real Docling:
```bash
pip install docling
# then in backend/.env:
USE_DOCLING=1
```
The Docling step is `ai/docling/extract.py`.

## Troubleshooting
- **Header stuck on `sim`** → creds missing/typo'd; check the backend boot log.
- **CORS / proxy** → frontend proxies `/api` to `:8787` (see `vite.config.ts`); keep both running.
- **watsonx 401/403** → wrong region or expired key; the app silently falls back to SIM.
