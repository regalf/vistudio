import React, { useState, useEffect } from 'react'

interface GitStatusModalProps {
  folderPath: string | null
  onClose: () => void
}

const GitStatusModal: React.FC<GitStatusModalProps> = ({ folderPath, onClose }) => {
  const [status, setStatus] = useState<string>('')
  const [files, setFiles] = useState<Array<{ path: string; staged: string; working: string }>>([])
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!folderPath || !window.electronAPI) { setLoading(false); return }
    Promise.all([
      window.electronAPI.git.status(folderPath),
      window.electronAPI.git.branch(folderPath),
      window.electronAPI.git.statusVerbose(folderPath)
    ]).then(([statusRes, branchRes, verboseRes]) => {
      if (statusRes.success && statusRes.files) setFiles(statusRes.files)
      if (branchRes.success && branchRes.branch) setBranch(branchRes.branch)
      if (verboseRes.success && verboseRes.stdout) setStatus(verboseRes.stdout)
      else setError(verboseRes.error || statusRes.error || 'Failed to load status')
      setLoading(false)
    }).catch(e => { setError(e.message); setLoading(false) })
  }, [folderPath])

  const statusIcon = (code: string) => {
    const map: Record<string, { label: string; color: string }> = {
      'M': { label: 'M', color: '#cc7a00' },
      'A': { label: 'A', color: '#4ec9b0' },
      'D': { label: 'D', color: '#f14c4c' },
      'R': { label: 'R', color: '#4ec9b0' },
      'C': { label: 'C', color: '#4ec9b0' },
      '?': { label: '?', color: '#858585' },
      'U': { label: 'U', color: '#569cd6' }
    }
    const m = map[code] || { label: code, color: 'var(--text-secondary)' }
    return React.createElement('span', { style: { color: m.color, fontWeight: 700, width: '16px', display: 'inline-block', fontSize: '12px' } }, m.label)
  }

  return React.createElement('div', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }
  }, [
    React.createElement('div', {
      style: {
        background: 'var(--bg-secondary)', borderRadius: '8px', width: '620px', maxHeight: '80vh',
        border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column'
      }
    }, [
      React.createElement('div', {
        style: {
          padding: '14px 18px', borderBottom: '1px solid var(--border-primary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }
      }, [
        React.createElement('span', { style: { fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' } },
          branch ? [React.createElement('span', { key: 'icon' }, '🔀'), React.createElement('span', { key: 'branch' }, branch)] : 'Git Status'
        ),
        React.createElement('button', { onClick: onClose, style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' } }, '×')
      ]),
      React.createElement('div', { style: { padding: '14px 18px', overflowY: 'auto', flex: 1 } }, [
        loading && React.createElement('div', { style: { textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0', fontSize: '13px' } }, 'Loading...'),
        error && React.createElement('div', { style: { color: 'var(--danger)', fontSize: '12px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(241,76,76,0.1)', borderRadius: '4px' } }, error),

        files.length > 0 && React.createElement('div', { style: { marginBottom: '16px' } }, [
          React.createElement('div', { style: { display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 } }, [
            React.createElement('span', { style: { width: '32px' } }, 'STG'),
            React.createElement('span', { style: { width: '32px' } }, 'WRK'),
            React.createElement('span', null, 'PATH')
          ]),
          ...files.map(f =>
            React.createElement('div', {
              key: f.path, style: { display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-primary)', padding: '3px 0', borderBottom: '1px solid var(--bg-tertiary)', fontFamily: 'monospace' }
            }, [
              React.createElement('span', { style: { width: '32px' } }, statusIcon(f.staged)),
              React.createElement('span', { style: { width: '32px' } }, statusIcon(f.working)),
              React.createElement('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, f.path)
            ])
          )
        ]),

        !loading && files.length === 0 && React.createElement('div', { style: { textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' } }, '✓ No changes detected'),

        status && React.createElement('div', { style: { marginTop: '12px' } }, [
          React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' } }, 'Full Status Output'),
          React.createElement('pre', { style: { background: 'var(--bg-primary)', padding: '10px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: '18px', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', margin: 0 } }, status)
        ])
      ])
    ])
  ])
}

export default GitStatusModal
