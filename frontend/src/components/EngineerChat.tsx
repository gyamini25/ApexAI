import { useState, useRef, useEffect } from 'react'
import { Mic, Send, Cpu, ChevronRight } from 'lucide-react'
import type { ChatMessage, RaceState } from '../lib/types'
import { api } from '../lib/api'

const SUGGESTIONS = [
  'Why am I losing time?',
  'Should we pit now?',
  'How are the tyres?',
  'What if it rains?',
]

let idc = 100
const nextId = () => `m${idc++}`

export function EngineerChat({ race }: { race: RaceState }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'seed',
      role: 'ai',
      text: "Radio check — I'm on the wall. We're P3, 12.4s off the lead. Front-left deg is climbing faster than plan. Ask me anything and I'll talk you through it.",
      ts: '10:24',
      source: 'mock',
    },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const q = text.trim()
    if (!q || busy) return
    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'engineer',
      text: q,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setBusy(true)
    try {
      const { message } = await api.chat(q, race, messages)
      setMessages((m) => [...m, message])
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'ai',
          text: 'Radio dropout — backend offline. Start the API server to bring the engineer online.',
          ts: '',
          source: 'mock',
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-pit-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-pit-red" />
          <span className="text-sm font-bold uppercase tracking-wider">AI Race Engineer</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-pit-green">
          <span className="h-2 w-2 rounded-full bg-pit-green live-dot" /> Online
        </span>
      </div>

      {/* Voice / equalizer */}
      <div className="relative flex flex-col items-center gap-2 border-b border-pit-line bg-gradient-to-b from-pit-red/5 to-transparent py-4">
        <div className="flex h-10 items-end gap-[3px]">
          {Array.from({ length: 28 }).map((_, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-gradient-to-t from-pit-red-dim to-pit-red"
              style={{
                height: '100%',
                animation: `eq ${0.7 + (i % 5) * 0.18}s ease-in-out ${i * 0.04}s infinite`,
              }}
            />
          ))}
        </div>
        <button
          onClick={() => send('Engineer, what is happening right now?')}
          className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-pit-red to-pit-red-dim glow-red transition hover:scale-105"
          title="Voice radio (demo: pushes a status request)"
        >
          <Mic className="h-5 w-5" />
        </button>
        <span className="text-[10px] uppercase tracking-widest text-pit-muted">Tap to radio in</span>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-pit-muted">
            <Cpu className="h-3.5 w-3.5 animate-pulse text-pit-red" />
            <span className="text-xs">Engineer analysing telemetry…</span>
          </div>
        )}
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 border-t border-pit-line px-3 py-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-pit-line bg-pit-panel-2 px-2.5 py-1 text-[11px] text-pit-muted transition hover:border-pit-red/40 hover:text-pit-text"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-pit-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Radio the engineer…"
          className="flex-1 rounded-lg border border-pit-line bg-pit-bg px-3 py-2 text-sm outline-none placeholder:text-pit-muted focus:border-pit-red/50"
        />
        <button
          onClick={() => send(input)}
          disabled={busy}
          className="grid h-9 w-9 place-items-center rounded-lg bg-pit-red disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.role === 'engineer') {
    return (
      <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm border border-pit-red/30 bg-pit-red/10 px-3 py-2">
        <div className="text-sm text-pit-text">{m.text}</div>
        {m.ts && <div className="mt-0.5 text-right text-[10px] text-pit-muted">{m.ts}</div>}
      </div>
    )
  }
  return (
    <div className="max-w-[92%] rounded-xl rounded-tl-sm border border-pit-line bg-pit-panel-2 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-xs font-bold text-pit-red">ApexAI</span>
        {m.source && (
          <span className="rounded bg-pit-line/60 px-1.5 py-px text-[9px] uppercase tracking-wide text-pit-muted">
            {m.source}
          </span>
        )}
      </div>
      <div className="whitespace-pre-line text-sm leading-relaxed text-pit-text">{m.text}</div>
      {m.reasoning && m.reasoning.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-pit-line pt-2">
          {m.reasoning.map((r, i) => (
            <li key={i} className="flex gap-1.5 text-xs text-pit-muted">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-pit-red" />
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
