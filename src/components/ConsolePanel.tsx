import React, { useState, useEffect, useRef } from 'react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'log' | 'warn' | 'error' | 'info'
  message: string
}

interface ConsolePanelProps {
  logs: LogEntry[]
  onClear: () => void
  onClose: () => void
}

const levelColors: Record<string, string> = {
  log: '#cccccc',
  info: '#4fc3f7',
  warn: '#ffb74d',
  error: '#ef5350'
}

const levelBgColors: Record<string, string> = {
  log: 'transparent',
  info: 'rgba(79, 195, 247, 0.1)',
  warn: 'rgba(255, 183, 77, 0.1)',
  error: 'rgba(239, 83, 80, 0.1)'
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [filterLevel, setFilterLevel] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  return React.createElement('div', {
    style: {
      height: '300px',
      borderTop: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)'
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: {
        padding: '4px 10px',
        background: 'var(--bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-primary)'
      }
    }, [
      React.createElement('div', {
        key: 'left',
        style: { display: 'flex', alignItems: 'center', gap: '10px' }
      }, [
        React.createElement('span', { key: 'title', style: { color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 } }, 'CONSOLE'),
        React.createElement('span', {
          key: 'count',
          style: { color: 'var(--text-secondary)', fontSize: '12px' }
        }, `${filteredLogs.length} entries`),
        React.createElement('label', {
          key: 'autoscroll',
          style: { color: 'var(--text-secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }
        }, [
          React.createElement('input', {
            type: 'checkbox',
            checked: autoScroll,
            onChange: (e: any) => setAutoScroll(e.target.checked),
            style: { accentColor: 'var(--accent)' }
          }),
          'Auto-scroll'
        ])
      ]),
      React.createElement('div', {
        key: 'right',
        style: { display: 'flex', alignItems: 'center', gap: '8px' }
      }, [
        React.createElement('select', {
          key: 'filter',
          value: filterLevel,
          onChange: (e: any) => setFilterLevel(e.target.value),
          style: {
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            padding: '4px 6px',
            borderRadius: '3px'
          }
        }, [
          React.createElement('option', { key: 'all', value: 'all' }, 'All'),
          React.createElement('option', { key: 'log', value: 'log' }, 'Log'),
          React.createElement('option', { key: 'info', value: 'info' }, 'Info'),
          React.createElement('option', { key: 'warn', value: 'warn' }, 'Warn'),
          React.createElement('option', { key: 'error', value: 'error' }, 'Error')
        ]),
        React.createElement('input', {
          key: 'search',
          type: 'text',
          placeholder: 'Filter...',
          value: searchTerm,
          onChange: (e: any) => setSearchTerm(e.target.value),
          style: {
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '3px',
            width: '120px'
          }
        }),
        React.createElement('button', {
          key: 'clear',
          onClick: onClear,
          style: {
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '3px',
            cursor: 'pointer'
          }
        }, 'Clear'),
        React.createElement('span', {
          key: 'close',
          onClick: onClose,
          style: { cursor: 'pointer', fontSize: '16px', color: 'var(--text-primary)', marginLeft: '4px' }
        }, '×')
      ])
    ]),
    React.createElement('div', {
      key: 'content',
      ref: scrollRef as any,
      style: {
        flex: 1,
        overflowY: 'auto',
        fontFamily: "'Fira Code', 'Consolas', monospace",
        fontSize: '14px',
        padding: '8px 0'
      }
    }, filteredLogs.length === 0
      ? React.createElement('div', {
          key: 'empty',
          style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '30px', fontSize: '14px' }
        }, 'No log entries')
      : filteredLogs.map(log =>
        React.createElement('div', {
          key: log.id,
          style: {
            padding: '6px 10px',
            color: levelColors[log.level],
            background: levelBgColors[log.level],
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid rgba(60, 60, 60, 0.3)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }
        }, [
          React.createElement('span', {
            key: 'time',
            style: { color: 'var(--text-secondary)', minWidth: '80px', userSelect: 'none', fontSize: '13px' }
          }, log.timestamp),
          React.createElement('span', {
            key: 'level',
            style: {
              color: levelColors[log.level],
              fontWeight: 600,
              minWidth: '50px',
              textTransform: 'uppercase',
              fontSize: '11px'
            }
          }, log.level),
          React.createElement('span', {
            key: 'msg',
            style: { color: levelColors[log.level], fontSize: '13px' }
          }, log.message)
        ])
      )
    )
  ])
}

export default ConsolePanel
