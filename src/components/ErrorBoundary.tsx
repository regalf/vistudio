import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

const wrapperStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontFamily: 'sans-serif',
  padding: '40px',
  flexDirection: 'column',
  gap: '16px'
}

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: 'var(--danger, #e81123)',
  margin: 0
}

const msgStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  margin: 0,
  textAlign: 'center' as const,
  maxWidth: '600px'
}

const btnStyle: React.CSSProperties = {
  padding: '8px 24px',
  background: 'var(--accent)',
  border: 'none',
  color: 'var(--text-button)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, info)
    try {
      if (window.electronAPI) {
        window.electronAPI.getDataPath().then(dataPath => {
          window.electronAPI.fs.writeFile(
            dataPath + '/runtime-error.log',
            `[${new Date().toISOString()}] [ErrorBoundary] ${error.stack || error.message}\n`
          ).catch(() => {})
        }).catch(() => {})
      }
    } catch {}
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', { style: wrapperStyle }, [
        React.createElement('h2', { key: 'title', style: titleStyle }, 'Something went wrong'),
        React.createElement('p', { key: 'msg', style: msgStyle },
          this.state.error?.message || 'An unexpected error occurred'
        ),
        React.createElement('p', { key: 'detail', style: { ...msgStyle, fontSize: '12px', fontFamily: 'monospace' } },
          this.state.error?.stack?.split('\n').slice(0, 3).join('\n') || ''
        ),
        React.createElement('button', { key: 'btn', onClick: this.handleReload, style: btnStyle }, 'Try Again')
      ])
    }
    return this.props.children
  }
}

export default ErrorBoundary
