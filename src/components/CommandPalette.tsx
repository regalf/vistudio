import React, { useState, useEffect, useRef, useCallback } from 'react'

interface CommandItem {
  id: string
  label: string
  category?: string
  shortcut?: string
  icon?: string
  type: 'command' | 'file'
  path?: string
}

interface CommandPaletteProps {
  commands: CommandItem[]
  onSelect: (command: CommandItem) => void
  onClose: () => void
}

function fuzzyMatch(query: string, text: string): { match: boolean; score: number } {
  if (!query) return { match: true, score: 0 }
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  let queryIdx = 0
  let textIdx = 0
  let score = 0
  let lastMatchIdx = -1
  
  while (queryIdx < lowerQuery.length && textIdx < lowerText.length) {
    if (lowerQuery[queryIdx] === lowerText[textIdx]) {
      if (lastMatchIdx === textIdx - 1) score += 2
      else if (textIdx > 0 && lowerText[textIdx - 1] === ' ') score += 1
      else if (textIdx > 0 && lowerText[textIdx - 1] === ':') score += 1
      else if (textIdx > 0 && lowerText[textIdx - 1] === '/') score += 1
      else score += 0.5
      
      lastMatchIdx = textIdx
      queryIdx++
    }
    textIdx++
  }
  
  if (queryIdx === lowerQuery.length) {
    if (lowerText.startsWith(lowerQuery)) score += 10
    return { match: true, score }
  }
  
  return { match: false, score: 0 }
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, onSelect, onClose }) => {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mode, setMode] = useState<'command' | 'file'>('command')
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  const filteredCommands = commands
    .filter(cmd => cmd.type === mode)
    .map(cmd => {
      const match = fuzzyMatch(search, cmd.label)
      const categoryMatch = cmd.category ? fuzzyMatch(search, cmd.category) : { match: false, score: 0 }
      return { ...cmd, matchScore: Math.max(match.score, categoryMatch.score), matches: match.match || categoryMatch.match }
    })
    .filter(cmd => cmd.matches)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 50)

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        onSelect(filteredCommands[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (mode === 'command' && e.key === '>' && search === '') {
      setMode('file')
      setSearch('')
    }
  }, [filteredCommands, selectedIndex, onSelect, onClose, mode, search])

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '40px'
    },
    onClick: onClose
  }, [
    React.createElement('div', {
      key: 'palette',
      style: {
        width: '950px',
        maxWidth: '90vw',
        height: 'fit-content',
        maxHeight: '850px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      },
      onClick: (e: any) => e.stopPropagation()
    }, [
      React.createElement('div', {
        key: 'input-container',
        style: {
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }
      }, [
        React.createElement('span', {
          key: 'icon',
          style: { fontSize: '16px', color: 'var(--text-secondary)' }
        }, mode === 'command' ? '>' : '#'),
        React.createElement('input', {
          ref: inputRef as any,
          type: 'text',
          value: search,
          onChange: (e: any) => setSearch(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: mode === 'command' ? 'Type a command...' : 'Search files...',
          style: {
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '16px',
            outline: 'none'
          }
        }),
        search && React.createElement('span', {
          key: 'count',
          style: { color: 'var(--text-secondary)', fontSize: '12px' }
        }, `${filteredCommands.length}`)
      ]),
      React.createElement('div', {
        ref: listRef as any,
        key: 'list',
        style: {
          maxHeight: '700px',
          overflowY: 'auto',
          padding: '4px 0'
        }
      }, filteredCommands.length === 0
        ? React.createElement('div', {
            key: 'empty',
            style: { padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }
          }, mode === 'command' ? 'No commands found' : 'No files match your search')
        : filteredCommands.map((cmd, idx) =>
          React.createElement('div', {
            key: cmd.id + (cmd.path || ''),
            'data-selected': idx === selectedIndex,
            onClick: () => onSelect(cmd),
            onMouseEnter: () => setSelectedIndex(idx),
            style: {
              padding: '4px 12px',
              background: idx === selectedIndex ? 'var(--bg-active)' : 'transparent',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: idx === selectedIndex ? 'var(--text-active)' : 'var(--text-primary)'
            }
          }, [
            React.createElement('div', {
              key: 'left',
              style: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }
            }, [
              cmd.icon && React.createElement('span', {
                key: 'icon',
                style: { fontSize: '14px', opacity: 0.7 }
              }, cmd.icon),
              React.createElement('div', {
                key: 'text',
                style: { overflow: 'hidden' }
              }, [
                React.createElement('div', {
                  key: 'label',
                style: {
                  fontSize: '16px',
                  whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }, cmd.label),
                cmd.category && React.createElement('div', {
                  key: 'category',
                  style: { fontSize: '11px', opacity: 0.6 }
                }, cmd.category)
              ])
            ]),
            cmd.shortcut && React.createElement('div', {
              key: 'shortcut',
              style: {
                display: 'flex',
                gap: '4px',
                marginLeft: '16px',
                flexShrink: 0
              }
            }, cmd.shortcut.split('+').map((key, keyIdx) =>
              React.createElement('kbd', {
                key: keyIdx,
                style: {
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                  fontSize: '10px',
                  fontFamily: 'inherit'
                }
              }, key)
            ))
          ])
        )
      ),
      React.createElement('div', {
        key: 'footer',
        style: {
          padding: '4px 12px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          gap: '12px',
          fontSize: '10px',
          color: 'var(--text-secondary)'
        }
      }, [
        React.createElement('span', { key: 'nav' }, '↑↓ navigate'),
        React.createElement('span', { key: 'select' }, '↵ select'),
        React.createElement('span', { key: 'close' }, 'esc close')
      ])
    ])
  ])
}

export default CommandPalette
