import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'

console.log('main.tsx loaded')

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error)
  if (window.electronAPI) {
    window.electronAPI.getDataPath().then(dataPath => {
      window.electronAPI.fs.writeFile(dataPath + '/runtime-error.log', 
        `[${new Date().toISOString()}] ${e.error?.stack || e.message}\n`).catch(() => {})
    }).catch(() => {})
  }
})

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason)
  if (window.electronAPI) {
    window.electronAPI.getDataPath().then(dataPath => {
      window.electronAPI.fs.writeFile(dataPath + '/runtime-error.log', 
        `[${new Date().toISOString()}] UNHANDLED: ${e.reason?.stack || e.reason}\n`).catch(() => {})
    }).catch(() => {})
  }
})

const rootElement = document.getElementById('root')
console.log('root element:', rootElement)

if (rootElement) {
  console.log('Creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  console.log('Rendering App...')
  root.render(
    React.createElement(ErrorBoundary, null, React.createElement(App))
  )
  console.log('App rendered!')
} else {
  console.error('Root element not found!')
}
