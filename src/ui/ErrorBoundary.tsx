import { Component, type ReactNode } from 'react'

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[RarePark] runtime error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#2a1a10',
            color: '#ffd9a8',
            padding: 40,
            fontFamily: 'monospace',
            fontSize: 13,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          <h2 style={{ color: '#ff8a8a' }}>渲染出错</h2>
          <div>{this.state.error?.message}</div>
          <pre style={{ marginTop: 16, opacity: 0.7 }}>{this.state.error?.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
