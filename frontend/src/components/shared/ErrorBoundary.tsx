import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-card border border-destructive rounded-lg p-6">
            <p className="text-sm font-semibold text-destructive mb-2">Runtime Error</p>
            <p className="text-sm text-foreground font-mono mb-4">{error.message}</p>
            <pre className="text-xs text-muted-foreground overflow-auto max-h-48 bg-muted p-3 rounded">
              {error.stack}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/home' }}
              className="mt-4 h-8 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Go home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
