import React, { useState, useCallback } from 'react'
import { ExtensionInfo } from '../types/extension'

interface ExtensionsPanelProps {
  extensions: ExtensionInfo[]
  onActivate: (id: string) => Promise<void>
  onDeactivate: (id: string) => Promise<void>
  onDelete: (id: string) => void
  onInstall: () => void
  onClose: () => void
}

const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({
  extensions,
  onActivate,
  onDeactivate,
  onDelete,
  onInstall,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = useCallback(async (ext: ExtensionInfo) => {
    console.log('[ExtensionsPanel] Toggle clicked for:', ext.id, 'current isActive:', ext.isActive)
    if (togglingId) return
    setTogglingId(ext.id)
    try {
      if (ext.isActive) {
        console.log('[ExtensionsPanel] Calling onDeactivate')
        await onDeactivate(ext.id)
      } else {
        console.log('[ExtensionsPanel] Calling onActivate')
        await onActivate(ext.id)
      }
      console.log('[ExtensionsPanel] Toggle complete')
    } finally {
      setTogglingId(null)
    }
  }, [onActivate, onDeactivate, togglingId])

  const filteredExtensions = extensions.filter(ext =>
    ext.manifest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ext.manifest.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: '30px',
      right: '0',
      bottom: '22px',
      width: '350px',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: {
        padding: '10px',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, [
      React.createElement('h3', {
        key: 'title',
        style: { margin: 0, color: 'var(--text-primary)', fontSize: '14px' }
      }, 'Extensions'),
      React.createElement('span', {
        key: 'close',
        onClick: onClose,
        style: { cursor: 'pointer', fontSize: '18px', color: 'var(--text-primary)' }
      }, '×')
    ]),
    React.createElement('div', {
      key: 'search',
      style: { padding: '10px', borderBottom: '1px solid var(--border-primary)' }
    }, React.createElement('input', {
      type: 'text',
      placeholder: 'Search extensions...',
      value: searchTerm,
      onChange: (e: any) => setSearchTerm(e.target.value),
      style: {
        width: '100%',
        padding: '6px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-secondary)',
        color: 'var(--text-primary)',
        borderRadius: '4px',
        boxSizing: 'border-box'
      }
    })),
    React.createElement('div', {
      key: 'actions',
      style: { padding: '10px', borderBottom: '1px solid var(--border-primary)' }
    }, React.createElement('button', {
      onClick: onInstall,
      style: {
        width: '100%',
        padding: '8px',
        background: 'var(--accent)',
        border: 'none',
        color: 'var(--text-button)',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '13px'
      }
    }, 'Install Extension...')),
    React.createElement('div', {
      key: 'list',
      style: { flex: 1, overflowY: 'auto', padding: '10px' }
    }, filteredExtensions.length === 0
      ? React.createElement('div', {
          style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }
        }, 'No extensions found')
      : filteredExtensions.map(ext =>
        React.createElement('div', {
          key: ext.id,
          style: {
            background: 'var(--bg-tertiary)',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '8px',
            border: '1px solid var(--border-primary)'
          }
        }, [
          React.createElement('div', {
            key: 'info',
            style: { marginBottom: '8px' }
          }, [
            React.createElement('div', {
              key: 'name',
              style: { color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }
            }, ext.manifest.name),
            React.createElement('div', {
              key: 'version',
              style: { color: 'var(--text-secondary)', fontSize: '12px' }
            }, `v${ext.manifest.version}`),
            ext.manifest.description && React.createElement('div', {
              key: 'desc',
              style: { color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }
            }, ext.manifest.description)
          ]),
          React.createElement('div', {
            key: 'controls',
            style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
          }, [
            React.createElement('div', {
              key: 'switch-container',
              style: { display: 'flex', alignItems: 'center', gap: '8px' }
            }, [
              React.createElement('span', {
                key: 'switch-label',
                style: {
                  color: togglingId === ext.id ? '#888' : (ext.isActive ? '#4caf50' : 'var(--text-secondary)'),
                  fontSize: '12px'
                }
              }, togglingId === ext.id ? 'Toggling...' : (ext.isActive ? 'Active' : 'Inactive')),
              React.createElement('div', {
                key: 'switch',
                onClick: () => handleToggle(ext),
                style: {
                  width: '40px',
                  height: '20px',
                  borderRadius: '10px',
                  background: togglingId === ext.id ? '#888' : (ext.isActive ? '#4caf50' : 'var(--border-secondary)'),
                  cursor: togglingId === ext.id ? 'wait' : 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                  opacity: togglingId === ext.id ? 0.6 : 1
                }
              }, [
                React.createElement('div', {
                  key: 'switch-knob',
                  style: {
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--text-button)',
                    position: 'absolute',
                    top: '2px',
                    left: togglingId === ext.id ? (ext.isActive ? '2px' : '22px') : (ext.isActive ? '22px' : '2px'),
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }
                })
              ])
            ]),
            React.createElement('button', {
              key: 'delete',
              onClick: () => onDelete(ext.id),
              style: {
                padding: '4px 8px',
                background: '#f44336',
                border: 'none',
                color: 'var(--text-button)',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }
            }, 'Delete')
          ])
        ])
      )
    )
  ])
}

export default ExtensionsPanel
