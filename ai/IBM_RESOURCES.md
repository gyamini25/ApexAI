# IBM Tooling Map — ApexAI

How ApexAI uses each tool from the IBM SkillsBuild Challenge stack, and where it lives in this repo.

| IBM tool | Role in ApexAI | Where in repo | Status |
|---|---|---|---|
| **IBM Granite** ([granite-community](https://github.com/ibm-granite-community)) | Reasoning engine — strategy calls, engineer chat, what-if sims, explanations. `granite-3-8b-instruct` via watsonx.ai. | `backend/src/granite.ts`, `backend/src/engine.ts`, `ai/granite/prompts.md` | **Wired** (live with creds, deterministic fallback otherwise) |
| **Docling** ([docling.ai](https://www.docling.ai)) | Document extraction — race reports / regulations / tyre allocations → structured racing knowledge for the Intel screen. | `backend/src/engine.ts` `documentAsk()`, `frontend/src/components/Documents.tsx` | **Integrated as pipeline** (sample text bundled; drop-in extraction point marked) |
| **Langflow** ([langflow.org](https://www.langflow.org)) | Visual orchestration of the reasoning pipeline (Telemetry → Cleaner → Context → Granite → Decision → Explanation → UI). | `ai/langflow/apexai_flow.json` (importable) | **Workflow authored** |
| **Context Forge** ([mcp-context-forge](https://ibm.github.io/mcp-context-forge/)) | MCP gateway / retrieval layer in front of the Docling vector index — structured context + RAG for document Q&A. | extension point in `documentAsk()` (see note below) | **Architected** (retrieval hook) |
| **IBM Bob** ([trial](https://bob.ibm.com/trial)) | Optional dev copilot used while building. | — | optional |

## Integration notes

### Granite (done)
The watsonx client authenticates via IBM IAM and calls the text-generation API. Every engine
function checks `graniteConfigured` and prompts Granite for JSON, with a race-accurate fallback so
the demo is bulletproof. Model id matches the watsonx catalog: `ibm/granite-3-8b-instruct`.

### Docling → Context Forge → Granite (RAG path)
Production document flow:

```
PDF (race report / regs)
  → Docling extraction        (structure, tables, sections)
  → chunk + embed → vector DB
  → Context Forge (MCP)        (structured retrieval of the top-k relevant chunks)
  → Granite                    (answers as a race engineer)
  → Intel screen
```

`backend/src/engine.ts` `documentAsk(docName, question, text)` is the seam: today it passes bundled
extracted text; swap `text` for a Context Forge retrieval call to make it full RAG. The prompt and
response contract (`{ summary, insights[] }`) stay identical, so the UI doesn't change.

### Langflow
`ai/langflow/apexai_flow.json` imports into Langflow and mirrors the exact node graph the backend
runs in code (`WatsonxLLM` node = `granite.ts`). Use it to demo the pipeline visually or to retarget
nodes without touching the app.

## Workshops referenced
- Building Agents with Granite — <https://ibm-granite-community.github.io/granite-agent-workshop/>
- Granite Workshop — <https://ibm.github.io/granite-workshop/>
- Docling Workshop — <https://ibm-granite-community.github.io/docling-workshop/>
