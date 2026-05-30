import React, { useState } from 'react'

interface CloneModalProps {
  onClose: () => void
  onClone: (url: string, targetDir: string) => Promise<void>
}

const CloneModal: React.FC<CloneModalProps> = ({ onClose, onClone }) => {
  const [url, setUrl] = useState('')
  const [targetDir, setTargetDir] = useState('')
  const [cloning, setCloning] = useState(false)
  const [error, setError] = useState('')

  const handleBrowse = async () => {
    if (!window.electronAPI) return
    const dir = await window.electronAPI.dialog.openFolder()
    if (dir) setTargetDir(dir)
  }

  const handleClone = async () => {
    if (!url.trim() || !targetDir.trim()) return
    setCloning(true)
    setError('')
    try {
      await onClone(url.trim(), targetDir.trim())
      onClose()
    } catch (e: any) {
      setError(e.message || 'Clone failed')
    }
    setCloning(false)
  }

  const placeholder = navigator.platform?.startsWith('Win')
    ? 'C:\\Users\\username\\repos'
    : '/home/user/repos'

  return React.createElement('div', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }
  }, [
    React.createElement('div', {
      style: {
        background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px',
        minWidth: '450px', border: '1px solid var(--border-primary)'
      }
    }, [
      React.createElement('h3', {
        key: 'title',
        style: { margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '16px' }
      }, 'Clone Repository'),
      React.createElement('label', {
        key: 'url-label',
        style: { display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }
      }, 'Repository URL'),
      React.createElement('input', {
        key: 'url-input',
        type: 'text', value: url,
        onChange: (e: any) => setUrl(e.target.value),
        placeholder: 'https://github.com/user/repo.git',
        autoFocus: true,
        style: {
          width: '100%', padding: '8px', background: 'var(--bg-input)',
          border: '1px solid var(--border-secondary)', color: 'var(--text-primary)',
          borderRadius: '4px', marginBottom: '12px', boxSizing: 'border-box'
        }
      }),
      React.createElement('label', {
        key: 'dir-label',
        style: { display: 'block', color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }
      }, 'Target Directory'),
      React.createElement('div', {
        key: 'dir-row',
        style: { display: 'flex', gap: '8px', marginBottom: '15px' }
      }, [
        React.createElement('input', {
          key: 'dir-input',
          type: 'text', value: targetDir,
          onChange: (e: any) => setTargetDir(e.target.value),
          placeholder: placeholder,
          style: {
            flex: 1, padding: '8px', background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)', color: 'var(--text-primary)',
            borderRadius: '4px', boxSizing: 'border-box'
          }
        }),
        React.createElement('button', {
          key: 'browse', onClick: handleBrowse,
          style: {
            padding: '8px 12px', background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)', color: 'var(--text-primary)',
            borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap'
          }
        }, 'Browse')
      ]),
      error && React.createElement('div', {
        key: 'error',
        style: { color: 'var(--danger)', fontSize: '12px', marginBottom: '10px' }
      }, error),
      React.createElement('div', {
        key: 'buttons',
        style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }
      }, [
        React.createElement('button', {
          key: 'cancel', onClick: onClose, disabled: cloning,
          style: {
            padding: '6px 16px', background: 'var(--bg-input)', border: 'none',
            color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer'
          }
        }, 'Cancel'),
        React.createElement('button', {
          key: 'clone', onClick: handleClone, disabled: cloning || !url.trim() || !targetDir.trim(),
          style: {
            padding: '6px 16px',
            background: url.trim() && targetDir.trim() ? 'var(--accent)' : 'var(--bg-input)',
            border: 'none',
            color: url.trim() && targetDir.trim() ? 'var(--text-button)' : 'var(--text-secondary)',
            borderRadius: '4px', cursor: url.trim() && targetDir.trim() ? 'pointer' : 'default',
            fontSize: '12px'
          }
        }, cloning ? 'Cloning...' : 'Clone')
      ])
    ])
  ])
}

export default CloneModal
