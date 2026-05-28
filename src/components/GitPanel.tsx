import React, { useState, useEffect, useCallback } from 'react'

interface GitFile {
  path: string
  staged: string
  working: string
}

interface CommitInfo {
  hash: string
  author: string
  date: string
  message: string
}

interface GitPanelProps {
  folderPath: string | null
  onFileClick: (path: string) => void
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  M: { label: 'M', color: '#ffcc00' },
  A: { label: 'A', color: '#4ec9b0' },
  D: { label: 'D', color: '#f14c4c' },
  R: { label: 'R', color: '#4ec9b0' },
  C: { label: 'C', color: '#4ec9b0' },
  '?': { label: 'U', color: 'var(--text-secondary)' },
  '!': { label: 'I', color: 'var(--text-secondary)' }
}

const CHECK_STYLE: Record<string, string | number> = {
  marginRight: '6px', cursor: 'pointer', flexShrink: 0, accentColor: 'var(--accent)'
}

const GitPanel: React.FC<GitPanelProps> = ({ folderPath, onFileClick }) => {
  const [files, setFiles] = useState<GitFile[]>([])
  const [branch, setBranch] = useState('')
  const [commits, setCommits] = useState<CommitInfo[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [isRepo, setIsRepo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [showLog, setShowLog] = useState(false)
  const [showBranches, setShowBranches] = useState(false)
  const [branches, setBranches] = useState('')
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())

  const refreshStatus = useCallback(async () => {
    if (!folderPath || !window.electronAPI) return
    setLoading(true)
    try {
      const [statusRes, branchRes, logRes] = await Promise.all([
        window.electronAPI.git.status(folderPath),
        window.electronAPI.git.branch(folderPath),
        window.electronAPI.git.log(folderPath, 10)
      ])
      if (statusRes.success && statusRes.files) setFiles(statusRes.files)
      else setFiles([])
      setIsRepo(statusRes.isRepo || false)
      if (branchRes.success && branchRes.branch) setBranch(branchRes.branch)
      if (logRes.success && logRes.commits) setCommits(logRes.commits)
      else setCommits([])
    } catch (e) {
      setStatusMsg('Git error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setSelectedPaths(new Set())
    setLoading(false)
  }, [folderPath])

  useEffect(() => { refreshStatus() }, [refreshStatus])

  const toggleSelect = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const handleStage = async (filePath: string) => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.add(folderPath, filePath)
    if (r.success) refreshStatus()
    else setStatusMsg(`Failed to stage: ${r.error}`)
  }

  const handleUnstage = async (filePath: string) => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.unstage(folderPath, filePath)
    if (r.success) refreshStatus()
    else setStatusMsg(`Failed to unstage: ${r.error}`)
  }

  const handleStageSelected = async () => {
    if (!folderPath || !window.electronAPI || selectedPaths.size === 0) return
    for (const p of selectedPaths) await handleStage(p)
    setSelectedPaths(new Set())
  }

  const handleUnstageSelected = async () => {
    if (!folderPath || !window.electronAPI || selectedPaths.size === 0) return
    for (const p of selectedPaths) await handleUnstage(p)
    setSelectedPaths(new Set())
  }

  const handleStageAll = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.add(folderPath, '.')
    if (r.success) refreshStatus()
    else setStatusMsg(`Failed to stage all: ${r.error}`)
  }

  const handleCommit = async () => {
    if (!folderPath || !window.electronAPI || !commitMessage.trim()) return
    const r = await window.electronAPI.git.commit(folderPath, commitMessage.trim())
    if (r.success) {
      setCommitMessage('')
      setStatusMsg('Committed successfully')
      refreshStatus()
    } else {
      setStatusMsg(`Commit failed: ${r.error}`)
    }
  }

  const handleInit = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.init(folderPath)
    if (r.success) { setStatusMsg('Git repository initialized'); refreshStatus() }
    else setStatusMsg(`Init failed: ${r.error}`)
  }

  const handlePull = async () => {
    if (!folderPath || !window.electronAPI) return
    setStatusMsg('Pulling...')
    const r = await window.electronAPI.git.pull(folderPath)
    setStatusMsg(r.success ? 'Pull completed' : `Pull failed: ${r.error}`)
    refreshStatus()
  }

  const handlePush = async () => {
    if (!folderPath || !window.electronAPI) return
    setStatusMsg('Pushing...')
    const r = await window.electronAPI.git.push(folderPath)
    setStatusMsg(r.success ? 'Push completed' : `Push failed: ${r.error}`)
    refreshStatus()
  }

  const handleCheckout = async (b: string) => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.checkout(folderPath, b.replace(/^\*\s*/, '').trim())
    if (r.success) { setShowBranches(false); refreshStatus() }
    else setStatusMsg(`Checkout failed: ${r.error}`)
  }

  const handleShowBranches = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.allBranches(folderPath)
    if (r.success && r.stdout) setBranches(r.stdout)
    setShowBranches(true)
  }

  const stagedFiles = files.filter(f => f.staged)
  const unstagedFiles = files.filter(f => f.working || !f.staged)
  const allUnstagedSelected = unstagedFiles.length > 0 && unstagedFiles.every(f => selectedPaths.has(f.path))
  const allStagedSelected = stagedFiles.length > 0 && stagedFiles.every(f => selectedPaths.has(f.path))

  const statusIcon = (code: string) => {
    const s = STATUS_LABELS[code]
    if (!s) return null
    return React.createElement('span', {
      style: { color: s.color, fontWeight: 700, fontSize: '11px', marginRight: '6px', fontFamily: 'monospace', flexShrink: 0 }
    }, s.label)
  }

  const renderFileItem = (f: GitFile, staged: boolean) => {
    const code = staged ? f.staged : (f.working || f.staged)
    const fileName = f.path.split('/').pop() || f.path
    const isChecked = selectedPaths.has(f.path)
    return React.createElement('div', {
      key: f.path + (staged ? '-staged' : ''),
      style: {
        display: 'flex', alignItems: 'center', padding: '2px 12px 2px 4px',
        fontSize: '13px', color: 'var(--text-primary)', userSelect: 'none',
        background: isChecked ? '#2a2d2e' : 'transparent'
      }
    }, [
      React.createElement('input', {
        key: 'check',
        type: 'checkbox',
        checked: isChecked,
        onChange: () => toggleSelect(f.path),
        style: CHECK_STYLE
      }),
      statusIcon(code),
      React.createElement('span', {
        key: 'name',
        onClick: (e: any) => { e.stopPropagation(); onFileClick(f.path) },
        style: { marginLeft: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, cursor: 'pointer' }
      }, fileName),
      React.createElement('button', {
        key: 'action',
        onClick: (e: any) => { e.stopPropagation(); staged ? handleUnstage(f.path) : handleStage(f.path) },
        title: staged ? 'Unstage' : 'Stage',
        style: {
          background: 'none', border: 'none', color: staged ? '#f14c4c' : '#4ec9b0',
          cursor: 'pointer', padding: '2px 4px', fontSize: '14px', lineHeight: 1, flexShrink: 0
        }
      }, staged ? '−' : '+')
    ])
  }

  if (!folderPath) {
    return React.createElement('div', {
      style: { padding: '12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }
    }, 'Open a folder to view source control')
  }

  if (!isRepo) {
    return React.createElement('div', { style: { padding: '12px' } }, [
      React.createElement('div', { key: 'info', style: { color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px', textAlign: 'center' } },
        'This folder is not a git repository.'),
      React.createElement('button', {
        key: 'init', onClick: handleInit,
        style: { width: '100%', padding: '6px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }
      }, 'Initialize Git Repository')
    ])
  }

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', height: '100%', fontSize: '13px' } }, [
    React.createElement('div', {
      key: 'header', style: { padding: '8px 12px', borderBottom: '1px solid var(--border-primary)' }
    }, [
      React.createElement('div', {
        key: 'branch-row',
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }
      }, [
        React.createElement('span', {
          key: 'branch', onClick: handleShowBranches,
          style: { fontWeight: 600, fontSize: '13px', color: '#e8e8e8', cursor: 'pointer' }
        }, `🔀 ${branch || 'main'}`),
        React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '4px' } },
          React.createElement('button', { onClick: handlePull, title: 'Pull', style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px', fontSize: '14px', lineHeight: 1 } }, '↓'),
          React.createElement('button', { onClick: handlePush, title: 'Push', style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px', fontSize: '14px', lineHeight: 1 } }, '↑'),
          React.createElement('button', { onClick: refreshStatus, title: 'Refresh', style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 4px', fontSize: '14px', lineHeight: 1 } }, '🔄')
        )
      ])
    ]),
    showBranches && React.createElement('div', {
      key: 'branch-list', style: { padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', maxHeight: '120px', overflowY: 'auto' }
    }, [
      React.createElement('div', { key: 'title', style: { fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 } }, 'BRANCHES'),
      ...branches.split('\n').filter(Boolean).map(b =>
        React.createElement('div', {
          key: b, onClick: () => handleCheckout(b),
          style: { padding: '2px 4px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-primary)', background: b.startsWith('*') ? '#2a2d2e' : 'transparent' }
        }, b)
      ),
      React.createElement('div', { key: 'close', onClick: () => setShowBranches(false), style: { color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', marginTop: '4px' } }, 'Close branches')
    ]),
    React.createElement('div', {
      key: 'changes', style: { flex: 1, overflowY: 'auto' }
    }, [
      stagedFiles.length > 0 && React.createElement('div', { key: 'staged-group' }, [
        React.createElement('div', {
          style: { padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          React.createElement('div', { key: 'left', style: { display: 'flex', alignItems: 'center', gap: '6px' } },
            React.createElement('input', {
              key: 'select-all', type: 'checkbox', checked: allStagedSelected,
              onChange: () => {
                if (allStagedSelected) setSelectedPaths(new Set())
                else setSelectedPaths(new Set(stagedFiles.map(f => f.path)))
              },
              style: { cursor: 'pointer', accentColor: 'var(--accent)', margin: 0 }
            }),
            React.createElement('span', { key: 'label' }, `STAGED (${stagedFiles.length})`)
          ),
          selectedPaths.size > 0 && React.createElement('button', {
            key: 'unstage-selected', onClick: handleUnstageSelected,
            style: { background: 'none', border: 'none', color: '#f14c4c', cursor: 'pointer', fontSize: '11px', padding: 0 }
          }, `Unstage ${selectedPaths.size > 0 ? '(' + selectedPaths.size + ')' : ''}`)
        ]),
        ...stagedFiles.map(f => renderFileItem(f, true))
      ]),
      unstagedFiles.length > 0 && React.createElement('div', { key: 'unstaged-group' }, [
        React.createElement('div', {
          style: { padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          React.createElement('div', { key: 'left', style: { display: 'flex', alignItems: 'center', gap: '6px' } },
            React.createElement('input', {
              key: 'select-all', type: 'checkbox', checked: allUnstagedSelected,
              onChange: () => {
                if (allUnstagedSelected) setSelectedPaths(new Set())
                else setSelectedPaths(new Set(unstagedFiles.map(f => f.path)))
              },
              style: { cursor: 'pointer', accentColor: 'var(--accent)', margin: 0 }
            }),
            React.createElement('span', { key: 'label' }, `CHANGES (${unstagedFiles.length})`)
          ),
          React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '6px' } },
            selectedPaths.size > 0 && React.createElement('button', {
              key: 'stage-selected', onClick: handleStageSelected,
              style: { background: 'none', border: 'none', color: '#4ec9b0', cursor: 'pointer', fontSize: '11px', padding: 0 }
            }, `Stage Selected ${selectedPaths.size > 0 ? '(' + selectedPaths.size + ')' : ''}`),
            unstagedFiles.length > 0 && React.createElement('button', {
              onClick: handleStageAll,
              style: { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', padding: 0 }
            }, 'Stage All')
          )
        ]),
        ...unstagedFiles.map(f => renderFileItem(f, false))
      ]),
      stagedFiles.length === 0 && unstagedFiles.length === 0 && React.createElement('div', {
        style: { padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }
      }, 'No changes detected')
    ]),
    React.createElement('div', {
      key: 'commit-area', style: { borderTop: '1px solid var(--border-primary)', padding: '8px 12px' }
    }, [
      React.createElement('textarea', {
        value: commitMessage, onChange: (e: any) => setCommitMessage(e.target.value),
        placeholder: 'Commit message...',
        onKeyDown: (e: any) => { if (e.key === 'Enter' && e.ctrlKey) handleCommit() },
        style: {
          width: '100%', padding: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
          color: 'var(--text-primary)', borderRadius: '3px', fontSize: '12px', resize: 'none',
          height: '50px', boxSizing: 'border-box', fontFamily: 'inherit'
        }
      }),
      React.createElement('div', {
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }
      }, [
        React.createElement('button', {
          onClick: handleCommit, disabled: !commitMessage.trim(),
          style: {
            padding: '4px 12px', background: commitMessage.trim() ? 'var(--accent)' : 'var(--bg-input)',
            border: 'none', color: commitMessage.trim() ? 'white' : 'var(--text-secondary)',
            borderRadius: '3px', cursor: commitMessage.trim() ? 'pointer' : 'default', fontSize: '12px'
          }
        }, 'Commit (Ctrl+Enter)'),
        React.createElement('span', {
          onClick: () => setShowLog(!showLog),
          style: { color: 'var(--accent)', cursor: 'pointer', fontSize: '11px' }
        }, showLog ? 'Hide Log' : 'Show Log')
      ])
    ]),
    showLog && React.createElement('div', {
      key: 'log', style: { borderTop: '1px solid var(--border-primary)', maxHeight: '150px', overflowY: 'auto', padding: '4px 12px' }
    }, [
      React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' } }, 'RECENT COMMITS'),
      ...commits.map(c =>
        React.createElement('div', { key: c.hash, style: { padding: '3px 0', fontSize: '11px', borderBottom: '1px solid var(--bg-tertiary)' } }, [
          React.createElement('div', { style: { color: '#4ec9b0', fontFamily: 'monospace' } }, c.hash),
          React.createElement('div', { style: { color: 'var(--text-primary)' } }, c.message),
          React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '10px' } }, `${c.author} - ${c.date}`)
        ])
      )
    ]),
    statusMsg && React.createElement('div', {
      key: 'status', style: { padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-primary)' }
    }, statusMsg),
    loading && React.createElement('div', {
      key: 'loader', style: { padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)' }
    }, 'Loading...')
  ])
}

export default GitPanel
