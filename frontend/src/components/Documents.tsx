import { useRef, useState } from 'react'
import { FileText, Upload, Send, Sparkles, BookOpen, CircleDot } from 'lucide-react'
import { Panel } from './ui'
import { api } from '../lib/api'
import type { DocInsight } from '../lib/types'

const SAMPLE_DOCS = [
  { name: '2025_Monaco_Race_Report.pdf', tag: 'Race Report' },
  { name: 'FIA_2025_Sporting_Regulations.pdf', tag: 'Regulations' },
  { name: 'Pirelli_Tyre_Allocation_Monaco.pdf', tag: 'Tyre Data' },
]

const SAMPLE_TEXT =
  'Monaco 2025 race report. The undercut was the decisive strategic lever: cars pitting between laps 44-47 onto the hard compound gained 1.4s/lap of clean-air advantage while traffic neutralised those who stayed out. Tyre degradation on the medium accelerated sharply after lap 45 (the "cliff"), with front-left thermal load the limiting factor. Track position outweighed raw pace given Monaco overtaking difficulty; the safety car probability after lap 50 was elevated due to debris. Teams that committed early to the undercut converted P3 starts into podium-leading positions.'

const PRESET_Q = [
  'What strategy worked at Monaco?',
  'When does the tyre cliff hit?',
  'What does the report say about undercuts?',
]

export function Documents() {
  const [active, setActive] = useState(SAMPLE_DOCS[0].name)
  const [docText] = useState(SAMPLE_TEXT)
  const [question, setQuestion] = useState('What strategy worked at Monaco?')
  const [answer, setAnswer] = useState<DocInsight | null>(null)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function ask(q: string) {
    setQuestion(q)
    setBusy(true)
    try {
      const r = await api.document(active, q, docText)
      setAnswer(r.answer)
    } catch {
      setAnswer({
        doc: active,
        summary:
          'Backend offline. From the indexed report: the undercut (pit laps 44–47 onto hard) was the winning play — track position beat raw pace at Monaco.',
        insights: [
          'Pit window 44–47 captured the clean-air undercut.',
          'Medium tyre cliff after lap 45, front-left limited.',
          'Elevated safety-car probability after lap 50.',
        ],
        source: 'mock',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* Library */}
      <div className="space-y-4">
        <Panel label="Knowledge Base">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const f = e.dataTransfer.files[0]
              if (f) setActive(f.name)
            }}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-pit-line bg-pit-bg/40 px-3 py-6 text-center transition hover:border-pit-cyan/50"
          >
            <Upload className="h-6 w-6 text-pit-cyan" />
            <div className="text-xs font-semibold">Upload document</div>
            <div className="text-[10px] text-pit-muted">PDF · race reports · regs</div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setActive(e.target.files[0].name)}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {SAMPLE_DOCS.map((d) => (
              <button
                key={d.name}
                onClick={() => setActive(d.name)}
                className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                  active === d.name
                    ? 'border-pit-cyan/40 bg-pit-cyan/10'
                    : 'border-pit-line bg-pit-panel-2 hover:border-pit-cyan/30'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-pit-cyan" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{d.name}</div>
                  <div className="text-[10px] text-pit-muted">{d.tag}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="mono mt-3 flex items-center gap-1.5 text-[10px] text-pit-muted">
            <BookOpen className="h-3 w-3" /> Docling → vector index → retrieval
          </div>
        </Panel>
      </div>

      {/* Q&A */}
      <div className="space-y-4">
        <Panel className="border-pit-cyan/30 bg-gradient-to-br from-pit-cyan/8 to-pit-panel">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pit-cyan" />
            <h2 className="text-lg font-bold">Document Intelligence</h2>
          </div>
          <p className="mt-1 text-sm text-pit-muted">
            Querying <b className="text-pit-cyan">{active}</b> — Docling extracts structure, Granite
            answers in race-engineer language.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_Q.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                className="rounded-full border border-pit-line bg-pit-panel-2 px-3 py-1.5 text-xs text-pit-muted hover:text-pit-text"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(question)}
              className="flex-1 rounded-lg border border-pit-line bg-pit-bg px-3 py-2.5 text-sm outline-none focus:border-pit-cyan/50"
              placeholder="Ask the document…"
            />
            <button
              onClick={() => ask(question)}
              disabled={busy}
              className="flex items-center gap-2 rounded-lg bg-pit-cyan px-4 py-2.5 text-sm font-semibold text-pit-bg disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {busy ? 'Reading…' : 'Ask'}
            </button>
          </div>
        </Panel>

        {answer && (
          <Panel label="Answer" right={answer.source && <span className="panel-label">{answer.source}</span>}>
            <p className="text-sm leading-relaxed text-pit-text">{answer.summary}</p>
            {answer.insights.length > 0 && (
              <ul className="mt-3 space-y-1.5 border-t border-pit-line pt-3">
                {answer.insights.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm text-pit-muted">
                    <CircleDot className="mt-1 h-3 w-3 shrink-0 text-pit-cyan" />
                    {it}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>
    </div>
  )
}
