import { useEffect, useState } from 'react'
import { CommandBar, type Screen } from './components/CommandBar'
import { Dashboard } from './components/Dashboard'
import { Strategy } from './components/Strategy'
import { Telemetry } from './components/Telemetry'
import { Simulation } from './components/Simulation'
import { Documents } from './components/Documents'
import { raceState } from './lib/mockData'
import { api } from './lib/api'

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [graniteOnline, setGraniteOnline] = useState(false)

  useEffect(() => {
    api.health().then((h) => setGraniteOnline(Boolean(h.granite)))
  }, [])

  return (
    <div className="grid-backdrop min-h-screen">
      <CommandBar
        screen={screen}
        onScreen={setScreen}
        race={raceState}
        graniteOnline={graniteOnline}
      />
      <main className="mx-auto max-w-[1600px] px-4 py-4">
        {screen === 'dashboard' && <Dashboard race={raceState} />}
        {screen === 'strategy' && <Strategy race={raceState} />}
        {screen === 'telemetry' && <Telemetry />}
        {screen === 'simulation' && <Simulation race={raceState} />}
        {screen === 'documents' && <Documents />}
      </main>
      <footer className="border-t border-pit-line/60 px-6 py-3 text-center text-xs text-pit-muted">
        <span className="text-pit-text">ApexAI</span> — turning millions of racing data points into
        decisions in seconds · Powered by IBM Granite · Docling · LangFlow
      </footer>
    </div>
  )
}
