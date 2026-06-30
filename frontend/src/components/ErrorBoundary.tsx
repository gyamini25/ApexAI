import { Component, type ReactNode } from 'react'

// Keeps a single bad render (e.g. a malformed AI payload) from blanking the
// whole app — the dashboard stays alive even if one panel throws.
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; msg?: string }
> {
  state = { hasError: false, msg: undefined as string | undefined }

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, msg: err.message }
  }

  componentDidCatch(err: Error) {
    console.error('[ApexAI] recovered from render error:', err.message)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-6 rounded-xl border border-pit-amber/30 bg-pit-amber/5 p-6 text-center">
          <div className="text-sm font-semibold text-pit-amber">
            A panel hit an unexpected data shape and was isolated.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, msg: undefined })}
            className="mt-3 rounded-lg bg-pit-red px-4 py-2 text-sm font-semibold"
          >
            Reload view
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
