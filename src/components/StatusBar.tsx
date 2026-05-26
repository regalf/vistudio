import React from 'react'

interface StatusBarProps {
  filePath: string | null
  language: string
  cursorPosition: { line: number; column: number }
  extensionsLoaded: number
  errorCount: number
  onConsoleClick: () => void
  gitBranch?: string
}

const StatusBar: React.FC<StatusBarProps> = ({ filePath, language, cursorPosition, extensionsLoaded, errorCount, onConsoleClick, gitBranch }) => {
  return React.createElement('div', {
    style: {
      height: '22px',
      background: 'var(--bg-statusbar)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 10px',
      fontSize: '12px',
      color: 'var(--text-button)',
      userSelect: 'none'
    }
  }, [
    React.createElement('div', {
      key: 'left',
      style: { display: 'flex', alignItems: 'center', gap: '15px' }
    }, [
      gitBranch && React.createElement('span', {
        key: 'branch',
        style: { display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '0 5px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }
      }, `🔀 ${gitBranch}`),
      React.createElement('span', {
        key: 'extensions',
        style: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '0 5px' }
      }, `Extensions: ${extensionsLoaded}`),
      errorCount > 0 && React.createElement('span', {
        key: 'errors',
        onClick: onConsoleClick,
        style: {
          display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer',
          padding: '0 5px', background: 'rgba(239, 83, 80, 0.2)', borderRadius: '2px'
        }
      }, `⚠ ${errorCount} error${errorCount > 1 ? 's' : ''}`),
      React.createElement('span', {
        style: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '0 5px' }
      }, 'ViStudio')
    ]),
    React.createElement('div', {
      key: 'right',
      style: { display: 'flex', alignItems: 'center', gap: '15px' }
    }, [
      filePath && React.createElement(React.Fragment, { key: 'file-info' }, [
        React.createElement('span', {
          key: 'cursor',
          style: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '0 5px' }
        }, `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`),
        React.createElement('span', {
          key: 'encoding',
          style: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '0 5px' }
        }, 'UTF-8'),
        React.createElement('span', {
          key: 'eol',
          style: { display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '0 5px' }
        }, 'LF')
      ]),
      React.createElement('span', {
        key: 'language',
        style: {
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '0 8px',
          borderRadius: '2px',
          cursor: 'pointer'
        }
      }, language || 'Plain Text')
    ])
  ])
}

export default StatusBar
