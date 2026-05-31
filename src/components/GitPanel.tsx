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
  onBranchChange?: (branch: string) => void
  onChangesCountChange?: (count: number) => void
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

const btnStyle = (color: string): Record<string, string | number> => ({
  background: 'none', border: 'none', color, cursor: 'pointer', padding: '2px 6px', fontSize: '12px', lineHeight: 1
})

const GitPanel: React.FC<GitPanelProps> = ({ folderPath, onFileClick, onBranchChange, onChangesCountChange }) => {
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
  const [showBranchInput, setShowBranchInput] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [showDiff, setShowDiff] = useState<string | null>(null)
  const [diffContent, setDiffContent] = useState('')
  const [stashList, setStashList] = useState<Array<{ ref: string; message: string }>>([])
  const [showStashList, setShowStashList] = useState(false)
  const [stashMessage, setStashMessage] = useState('')
  const [showRenameInput, setShowRenameInput] = useState<string | null>(null)
  const [renameNewName, setRenameNewName] = useState('')
  const [showRemoteInput, setShowRemoteInput] = useState(false)
  const [remoteName, setRemoteName] = useState('')
  const [remoteUrl, setRemoteUrl] = useState('')
  const [showRemotes, setShowRemotes] = useState(false)
  const [remotesText, setRemotesText] = useState('')
  const [showOpHistory, setShowOpHistory] = useState(false)
  const [opHistory, setOpHistory] = useState<Array<{ timestamp: string; operation: string; details?: string; success: boolean; error?: string }>>([])

  const logGitOp = async (operation: string, success: boolean, details?: string, error?: string) => {
    if (!window.electronAPI) return
    await window.electronAPI.git.logHistory({ operation, details, success, error })
  }

  const refreshStatus = useCallback(async () => {
    if (!folderPath || !window.electronAPI) return
    setLoading(true)
    setStatusMsg('')
    try {
      const [statusRes, branchRes, logRes] = await Promise.all([
        window.electronAPI.git.status(folderPath),
        window.electronAPI.git.branch(folderPath),
        window.electronAPI.git.log(folderPath, 10)
      ])
      if (statusRes.success && statusRes.files) {
        setFiles(statusRes.files)
        onChangesCountChange?.(statusRes.files.length)
        logGitOp('Status', true, `${statusRes.files.length} change(s)`)
      }
      else { setFiles([]); onChangesCountChange?.(0) }
      setIsRepo(statusRes.isRepo || false)
      if (branchRes.success && branchRes.branch) {
        setBranch(branchRes.branch)
        onBranchChange?.(branchRes.branch)
      }
      if (logRes.success && logRes.commits) setCommits(logRes.commits)
      else setCommits([])
    } catch (e) {
      setStatusMsg('Git error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setSelectedPaths(new Set())
    setLoading(false)
  }, [folderPath, onBranchChange, onChangesCountChange])

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
    if (r.success) { logGitOp('Stage', true, filePath); refreshStatus() }
    else { logGitOp('Stage', false, filePath, r.error); setStatusMsg(`Failed to stage: ${r.error}`) }
  }

  const handleUnstage = async (filePath: string) => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.unstage(folderPath, filePath)
    if (r.success) { logGitOp('Unstage', true, filePath); refreshStatus() }
    else { logGitOp('Unstage', false, filePath, r.error); setStatusMsg(`Failed to unstage: ${r.error}`) }
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

  const handleCommit = async () => {
    if (!folderPath || !window.electronAPI || !commitMessage.trim()) return
    const msg = commitMessage.trim()
    const statusRes = await window.electronAPI.git.status(folderPath)
    const currentFiles = statusRes.success && statusRes.files ? statusRes.files : []
    const hasStaged = currentFiles.some((f: any) => f.staged && f.staged !== '?')
    const hasUnstaged = currentFiles.some((f: any) => (f.working && f.working !== '?') || f.staged === '?')
    if (!hasStaged && !hasUnstaged) {
      setStatusMsg('Nothing to commit')
      return
    }
    const useAuto = !hasStaged || hasUnstaged
    const r = useAuto
      ? await window.electronAPI.git.commitAll(folderPath, msg)
      : await window.electronAPI.git.commit(folderPath, msg)
    if (r.success) {
      logGitOp('Commit', true, msg)
      setCommitMessage('')
      setStatusMsg('Committed successfully')
      refreshStatus()
    } else {
      logGitOp('Commit', false, msg, r.error)
      setStatusMsg(`Commit failed: ${r.error}`)
    }
  }

  const handleInit = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.init(folderPath)
    if (r.success) { logGitOp('Init', true); setStatusMsg('Git repository initialized'); refreshStatus() }
    else { logGitOp('Init', false, undefined, r.error); setStatusMsg(`Init failed: ${r.error}`) }
  }

  const handlePull = async () => {
    if (!folderPath || !window.electronAPI) return
    setStatusMsg('Pulling...')
    const r = await window.electronAPI.git.pull(folderPath)
    logGitOp('Pull', r.success, undefined, r.error)
    setStatusMsg(r.success ? 'Pull completed' : `Pull failed: ${r.error}`)
    refreshStatus()
  }

  const parseBranchName = (b: string): string | null => {
    const name = b.replace(/^\*\s*/, '').trim()
    if (name.includes('->')) return null
    return name
  }

  const handleCheckout = async (b: string) => {
    if (!folderPath || !window.electronAPI) return
    const name = parseBranchName(b)
    if (!name) return
    const r = await window.electronAPI.git.checkout(folderPath, name)
    if (r.success) { logGitOp('Checkout', true, name); setShowBranches(false); refreshStatus() }
    else { logGitOp('Checkout', false, name, r.error); setStatusMsg(`Checkout failed: ${r.error}`) }
  }

  const handleShowBranches = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.allBranches(folderPath)
    if (r.success && r.stdout) setBranches(r.stdout)
    setShowBranches(true)
  }

  const handleCreateBranch = async () => {
    if (!folderPath || !window.electronAPI || !newBranchName.trim()) return
    const name = newBranchName.trim()
    const r = await window.electronAPI.git.branchCreate(folderPath, name)
    if (r.success) { logGitOp('Create Branch', true, name); setShowBranchInput(false); setNewBranchName(''); refreshStatus() }
    else { logGitOp('Create Branch', false, name, r.error); setStatusMsg(`Branch create failed: ${r.error}`) }
  }

  const handleDeleteBranch = async (b: string) => {
    if (!folderPath || !window.electronAPI) return
    const name = parseBranchName(b)
    if (!name) return
    if (name === branch) { setStatusMsg('Cannot delete current branch'); return }
    if (!confirm(`Delete branch "${name}"?`)) return
    const r = await window.electronAPI.git.branchDelete(folderPath, name)
    if (r.success) { logGitOp('Delete Branch', true, name); handleShowBranches(); refreshStatus() }
    else { logGitOp('Delete Branch', false, name, r.error); setStatusMsg(`Branch delete failed: ${r.error}`) }
  }

  const handleStashPop = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.stashPop(folderPath)
    logGitOp('Stash Pop', r.success, undefined, r.error)
    setStatusMsg(r.success ? 'Stash popped' : `Stash pop failed: ${r.error}`)
    refreshStatus()
  }

  const handleRestore = async (filePath: string) => {
    if (!folderPath || !window.electronAPI) return
    if (!confirm(`Discard changes to "${filePath.split('/').pop()}"?`)) return
    const r = await window.electronAPI.git.restore(folderPath, filePath)
    logGitOp('Restore', r.success, filePath, r.error)
    setStatusMsg(r.success ? 'File restored' : `Restore failed: ${r.error}`)
    if (r.success) refreshStatus()
  }

  const handleFetch = async () => {
    if (!folderPath || !window.electronAPI) return
    setStatusMsg('Fetching...')
    const r = await window.electronAPI.git.fetch(folderPath)
    logGitOp('Fetch', r.success, undefined, r.error)
    setStatusMsg(r.success ? 'Fetch completed' : `Fetch failed: ${r.error}`)
    refreshStatus()
  }

  const handlePushSafe = async () => {
    if (!folderPath || !window.electronAPI) return
    setStatusMsg('Pushing...')
    const r = await window.electronAPI.git.push(folderPath)
    if (r.success) { logGitOp('Push', true); setStatusMsg('Push completed'); refreshStatus(); return }
    if (r.error && (r.error.includes('no upstream') || r.error.includes('no tracking') || r.error.includes('set-upstream'))) {
      if (!confirm(`Branch "${branch}" has no upstream. Push and set upstream?`)) return
      const r2 = await window.electronAPI.git.pushUpstream(folderPath, branch)
      logGitOp('Push Upstream', r2.success, branch, r2.error)
      setStatusMsg(r2.success ? 'Push completed (upstream set)' : `Push failed: ${r2.error}`)
    } else {
      logGitOp('Push', false, undefined, r.error)
      setStatusMsg(`Push failed: ${r.error}`)
    }
    refreshStatus()
  }

  const handleForceDeleteBranch = async (b: string) => {
    if (!folderPath || !window.electronAPI) return
    const name = parseBranchName(b)
    if (!name) return
    if (!confirm(`Force delete branch "${name}"? This cannot be undone.`)) return
    const r = await window.electronAPI.git.branchDeleteForce(folderPath, name)
    if (r.success) { logGitOp('Force Delete Branch', true, name); handleShowBranches(); refreshStatus() }
    else { logGitOp('Force Delete Branch', false, name, r.error); setStatusMsg(`Force delete failed: ${r.error}`) }
  }

  const handleRenameBranch = async (oldName: string) => {
    if (!folderPath || !window.electronAPI || !renameNewName.trim()) return
    const newName = renameNewName.trim()
    const r = await window.electronAPI.git.branchRename(folderPath, oldName, newName)
    if (r.success) { logGitOp('Rename Branch', true, `${oldName} → ${newName}`); setShowRenameInput(null); setRenameNewName(''); refreshStatus() }
    else { logGitOp('Rename Branch', false, `${oldName} → ${newName}`, r.error); setStatusMsg(`Rename failed: ${r.error}`) }
  }

  const handleMerge = async (b: string) => {
    if (!folderPath || !window.electronAPI) return
    const name = parseBranchName(b)
    if (!name) return
    if (!confirm(`Merge "${name}" into current branch "${branch}"?`)) return
    setStatusMsg(`Merging ${name}...`)
    const r = await window.electronAPI.git.merge(folderPath, name)
    logGitOp('Merge', r.success, `${name} → ${branch}`, r.error)
    setStatusMsg(r.success ? `Merged ${name}` : `Merge failed: ${r.error}`)
    refreshStatus()
  }

  const handleRemoteAdd = async () => {
    if (!folderPath || !window.electronAPI || !remoteName.trim() || !remoteUrl.trim()) return
    const rn = remoteName.trim()
    const ru = remoteUrl.trim()
    const r = await window.electronAPI.git.remoteAdd(folderPath, rn, ru)
    if (r.success) { logGitOp('Remote Add', true, `${rn} → ${ru}`); setShowRemoteInput(false); setRemoteName(''); setRemoteUrl(''); refreshStatus() }
    else { logGitOp('Remote Add', false, `${rn} → ${ru}`, r.error); setStatusMsg(`Remote add failed: ${r.error}`) }
  }

  const handleShowRemotes = async () => {
    if (!folderPath || !window.electronAPI) return
    const r = await window.electronAPI.git.remoteList(folderPath)
    if (r.success && r.stdout) setRemotesText(r.stdout)
    setShowRemotes(!showRemotes)
  }

  const handleShowStashList = async () => {
    if (!folderPath || !window.electronAPI) return
    if (showStashList) { setShowStashList(false); return }
    const r = await window.electronAPI.git.stashList(folderPath)
    if (r.success && r.stashes) setStashList(r.stashes)
    setShowStashList(true)
  }

  const handleStashNamed = async () => {
    if (!folderPath || !window.electronAPI) return
    const sm = stashMessage.trim() || undefined
    const r = await window.electronAPI.git.stashPush(folderPath, sm)
    logGitOp('Stash', r.success, sm, r.error)
    setStatusMsg(r.success ? 'Stashed' : `Stash failed: ${r.error}`)
    if (r.success) { setStashMessage(''); setShowStashList(false) }
    refreshStatus()
  }

  const handleStashDrop = async (ref: string) => {
    if (!folderPath || !window.electronAPI) return
    if (!confirm(`Drop ${ref}?`)) return
    const r = await window.electronAPI.git.stashDrop(folderPath, ref)
    logGitOp('Stash Drop', r.success, ref, r.error)
    setStatusMsg(r.success ? 'Stash dropped' : `Stash drop failed: ${r.error}`)
    if (r.success) handleShowStashList()
    refreshStatus()
  }

  const handleShowDiff = async (filePath: string) => {
    if (!folderPath || !window.electronAPI) return
    if (showDiff === filePath) { setShowDiff(null); return }
    const r = await window.electronAPI.git.diff(folderPath, filePath)
    setDiffContent(r.stdout || (r.error || 'No diff available'))
    setShowDiff(filePath)
  }

  const stagedFiles = files.filter(f => f.staged && f.staged !== '?')
  const modifiedFiles = files.filter(f => f.working && f.working !== '?')
  const untrackedFiles = files.filter(f => f.staged === '?')
  const allStagedSelected = stagedFiles.length > 0 && stagedFiles.every(f => selectedPaths.has(f.path))
  const allModifiedSelected = modifiedFiles.length > 0 && modifiedFiles.every(f => selectedPaths.has(f.path))
  const allUntrackedSelected = untrackedFiles.length > 0 && untrackedFiles.every(f => selectedPaths.has(f.path))

  const statusIcon = (code: string) => {
    const s = STATUS_LABELS[code]
    if (!s) return null
    return React.createElement('span', {
      style: { color: s.color, fontWeight: 700, fontSize: '11px', marginRight: '6px', fontFamily: 'monospace', flexShrink: 0 }
    }, s.label)
  }

  const renderColorizedDiff = (diff: string) => {
    const lines = diff.split('\n').map((line, i) => {
      let color = 'var(--text-primary)'
      let bg = 'transparent'
      if (line.startsWith('+') && !line.startsWith('+++')) { color = '#4ec9b0'; bg = 'rgba(78,201,176,0.1)' }
      else if (line.startsWith('-') && !line.startsWith('---')) { color = '#f14c4c'; bg = 'rgba(241,76,76,0.1)' }
      else if (line.startsWith('@@')) { color = '#569cd6'; bg = 'rgba(86,156,214,0.1)' }
      else if (line.startsWith('diff --git') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++')) { color = 'var(--text-secondary)' }
      return React.createElement('div', {
        key: i, style: { color, background: bg, padding: '0 8px', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre', lineHeight: '18px' }
      }, line || ' ')
    })
    return lines
  }

  const renderFileItem = (f: GitFile, staged: boolean) => {
    const code = staged ? f.staged : (f.working || f.staged)
    const fileName = f.path.split('/').pop() || f.path
    const isChecked = selectedPaths.has(f.path)
    const isDiffOpen = showDiff === f.path
    const hasBoth = f.staged && f.working
    return [
      React.createElement('div', {
        key: f.path + (staged ? '-staged' : ''),
        style: {
          display: 'flex', alignItems: 'center', padding: '2px 12px 2px 4px',
          fontSize: '13px', color: 'var(--text-primary)', userSelect: 'none',
          background: isChecked ? '#2a2d2e' : 'transparent'
        }
      }, [
        React.createElement('input', {
          key: 'check', type: 'checkbox', checked: isChecked,
          onChange: () => toggleSelect(f.path), style: CHECK_STYLE
        }),
        statusIcon(code),
        React.createElement('span', {
          key: 'name', onClick: (e: any) => { e.stopPropagation(); onFileClick(f.path) },
          style: { marginLeft: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, cursor: 'pointer' }
        }, fileName),
        !staged && React.createElement('button', {
          key: 'diff-btn', onClick: (e: any) => { e.stopPropagation(); handleShowDiff(f.path) },
          title: 'Show diff', style: btnStyle(isDiffOpen ? '#569cd6' : 'var(--text-secondary)')
        }, '▽'),
        !staged && React.createElement('button', {
          key: 'restore', onClick: (e: any) => { e.stopPropagation(); handleRestore(f.path) },
          title: 'Discard changes', style: btnStyle('#f14c4c')
        }, '↩'),
        hasBoth && React.createElement('button', {
          key: 'unstage', onClick: (e: any) => { e.stopPropagation(); handleUnstage(f.path) },
          title: 'Unstage', style: { background: 'transparent', border: 'none', color: '#f14c4c', cursor: 'pointer', padding: '2px 4px', fontSize: '11px', lineHeight: 1, fontWeight: 600, flexShrink: 0 }
        }, '−'),
        React.createElement('button', {
          key: 'action', onClick: (e: any) => { e.stopPropagation(); hasBoth ? handleStage(f.path) : (staged ? handleUnstage(f.path) : handleStage(f.path)) },
          title: hasBoth ? 'Stage changes' : (staged ? 'Unstage' : 'Add'),
          style: {
            background: hasBoth ? '#cc7a00' : (staged ? 'transparent' : '#cc7a00'),
            border: 'none',
            color: hasBoth ? 'white' : (staged ? '#f14c4c' : 'white'),
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: '11px',
            borderRadius: '3px',
            lineHeight: 1,
            fontWeight: 600,
            flexShrink: 0
          }
        }, hasBoth ? 'Add' : (staged ? 'Unstage' : 'Add'))
      ]),
      isDiffOpen && React.createElement('div', {
        key: f.path + '-diff', style: { background: 'var(--bg-primary)', borderTop: '1px solid var(--border-primary)', maxHeight: '200px', overflow: 'auto' }
      }, renderColorizedDiff(diffContent))
    ]
  }

  if (!folderPath) {
    return React.createElement('div', {
      style: { padding: '12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }
    }, 'Open a folder to view source control')
  }

  if (!isRepo) {
    return React.createElement('div', { style: { padding: '12px' } }, [
      React.createElement('div', {
        key: 'info', style: { color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px', textAlign: 'center' }
      }, 'This folder is not a git repository.'),
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
        key: 'branch-row', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }
      }, [
        React.createElement('span', {
          key: 'branch', onClick: handleShowBranches,
          style: { fontWeight: 600, fontSize: '13px', color: '#e8e8e8', cursor: 'pointer' }
        }, `🔀 ${branch || 'main'}`),
        React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '4px' } },
          React.createElement('button', { key: 'stash', onClick: handleShowStashList, title: 'Stash', style: btnStyle('var(--text-secondary)') }, '📦'),
          React.createElement('button', { key: 'stash-pop', onClick: handleStashPop, title: 'Stash Pop', style: btnStyle('var(--text-secondary)') }, '📂'),
          React.createElement('button', { key: 'fetch', onClick: handleFetch, title: 'Fetch', style: btnStyle('var(--text-secondary)') }, '⇣'),
          React.createElement('button', { key: 'pull', onClick: handlePull, title: 'Pull', style: btnStyle('var(--text-secondary)') }, '↓'),
          React.createElement('button', { key: 'push', onClick: handlePushSafe, title: 'Push', style: btnStyle('var(--text-secondary)') }, '↑'),
          React.createElement('button', { key: 'refresh', onClick: refreshStatus, title: 'Refresh', style: btnStyle('var(--text-secondary)') }, '🔄')
        )
      ])
    ]),
    showBranches && React.createElement('div', {
      key: 'branch-list', style: { padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', maxHeight: '150px', overflowY: 'auto' }
    }, [
      React.createElement('div', { key: 'title', style: { fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('span', null, 'BRANCHES'),
        React.createElement('button', {
          onClick: () => setShowBranchInput(true),
          style: { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', padding: 0 }
        }, '+ New')
      ),
      showBranchInput && React.createElement('div', {
        key: 'new-branch', style: { display: 'flex', gap: '4px', marginBottom: '4px' }
      }, [
        React.createElement('input', {
          value: newBranchName, onChange: (e: any) => setNewBranchName(e.target.value),
          onKeyDown: (e: any) => e.key === 'Enter' && handleCreateBranch(),
          placeholder: 'Branch name', autoFocus: true,
          style: {
            flex: 1, padding: '3px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)', borderRadius: '2px', fontSize: '11px'
          }
        }),
        React.createElement('button', {
          onClick: handleCreateBranch, disabled: !newBranchName.trim(),
          style: { background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '2px', cursor: 'pointer', fontSize: '11px', padding: '3px 8px' }
        }, 'OK')
      ]),
      ...branches.split('\n').filter(Boolean).filter(b => !b.includes('->')).map(b => {
        const name = parseBranchName(b)
        const isCurrent = b.startsWith('*')
        const isRenaming = showRenameInput === name
        return React.createElement('div', {
          key: b, style: { display: 'flex', flexDirection: 'column', padding: '2px 4px', fontSize: '12px', color: 'var(--text-primary)', background: isCurrent ? '#2a2d2e' : 'transparent' }
        }, [
          React.createElement('div', { key: 'row', style: { display: 'flex', alignItems: 'center', gap: '2px' } }, [
            isRenaming
              ? React.createElement('input', {
                value: renameNewName, onChange: (e: any) => setRenameNewName(e.target.value),
                onKeyDown: (e: any) => { if (e.key === 'Enter') handleRenameBranch(name!); if (e.key === 'Escape') { setShowRenameInput(null); setRenameNewName('') } },
                autoFocus: true,
                style: { flex: 1, padding: '1px 4px', background: 'var(--bg-input)', border: '1px solid var(--accent)', color: 'var(--text-primary)', fontSize: '11px', borderRadius: '2px' }
              })
              : React.createElement('span', {
                key: 'name', onClick: () => handleCheckout(b), style: { cursor: 'pointer', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }, b),
            !isRenaming && !isCurrent && name && React.createElement(React.Fragment, null, [
              React.createElement('button', {
                key: 'rename', onClick: () => { setShowRenameInput(name); setRenameNewName(name) }, title: 'Rename branch',
                style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '10px', padding: '1px 3px' }
              }, '✎'),
              React.createElement('button', {
                key: 'merge', onClick: () => handleMerge(b), title: 'Merge into current branch',
                style: { background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '10px', padding: '1px 3px' }
              }, '◉'),
              React.createElement('button', {
                key: 'del', onClick: () => handleDeleteBranch(b), title: 'Delete branch',
                style: { background: 'none', border: 'none', color: '#f14c4c', cursor: 'pointer', fontSize: '10px', padding: '1px 3px' }
              }, '×'),
              React.createElement('button', {
                key: 'forcedel', onClick: () => handleForceDeleteBranch(b), title: 'Force delete branch',
                style: { background: 'none', border: 'none', color: '#f14c4c', cursor: 'pointer', fontSize: '9px', padding: '1px 3px', opacity: 0.6 }
              }, '✕')
            ])
          ])
        ])
      }),
      React.createElement('div', {
        key: 'close', onClick: () => { setShowBranches(false); setShowBranchInput(false) },
        style: { color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', marginTop: '4px' }
      }, 'Close branches')
    ]),
    showStashList && React.createElement('div', {
      key: 'stash-list', style: { padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', maxHeight: '150px', overflowY: 'auto' }
    }, [
      React.createElement('div', { key: 'title', style: { fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 } }, 'STASHES'),
      React.createElement('div', { key: 'stash-input', style: { display: 'flex', gap: '4px', marginBottom: '6px' } }, [
        React.createElement('input', {
          value: stashMessage, onChange: (e: any) => setStashMessage(e.target.value),
          onKeyDown: (e: any) => e.key === 'Enter' && handleStashNamed(),
          placeholder: 'Stash message (optional)', autoFocus: true,
          style: { flex: 1, padding: '3px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)', borderRadius: '2px', fontSize: '11px' }
        }),
        React.createElement('button', {
          onClick: handleStashNamed,
          style: { background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '2px', cursor: 'pointer', fontSize: '11px', padding: '3px 8px' }
        }, 'Stash')
      ]),
      stashList.length === 0 && React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '11px', padding: '4px 0' } }, 'No stashes'),
      ...stashList.map(s =>
        React.createElement('div', {
          key: s.ref, style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid var(--bg-tertiary)', fontSize: '11px' }
        }, [
          React.createElement('span', { key: 'msg', style: { flex: 1, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, `${s.ref}: ${s.message}`),
          React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '4px' } },
            React.createElement('button', {
              onClick: () => { window.electronAPI?.git.stashPop(folderPath!).then(r => { setStatusMsg(r.success ? 'Stash popped' : `Pop failed: ${r.error}`); handleShowStashList(); refreshStatus() }) },
              style: { background: 'none', border: 'none', color: '#4ec9b0', cursor: 'pointer', fontSize: '10px', padding: '1px 4px' }
            }, '▶'),
            React.createElement('button', {
              onClick: () => handleStashDrop(s.ref),
              style: { background: 'none', border: 'none', color: '#f14c4c', cursor: 'pointer', fontSize: '10px', padding: '1px 4px' }
            }, '×')
          )
        ])
      ),
      React.createElement('div', {
        key: 'close', onClick: () => setShowStashList(false),
        style: { color: 'var(--accent)', cursor: 'pointer', fontSize: '11px', marginTop: '4px' }
      }, 'Close stashes')
    ]),
    React.createElement('div', {
      key: 'remote-area', style: { padding: '4px 12px', borderBottom: '1px solid var(--border-primary)', display: 'flex', gap: '6px', alignItems: 'center' }
    }, [
      React.createElement('span', {
        key: 'label', onClick: handleShowRemotes,
        style: { color: 'var(--accent)', cursor: 'pointer', fontSize: '10px' }
      }, showRemotes ? 'Remotes ▲' : 'Remotes ▼'),
      React.createElement('span', {
        key: 'add-btn', onClick: () => setShowRemoteInput(!showRemoteInput),
        style: { color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '10px' }
      }, '+ Add')
    ]),
    showRemoteInput && React.createElement('div', {
      key: 'remote-input', style: { padding: '4px 12px', borderBottom: '1px solid var(--border-primary)', display: 'flex', gap: '4px', flexDirection: 'column' }
    }, [
      React.createElement('input', {
        value: remoteName, onChange: (e: any) => setRemoteName(e.target.value),
        placeholder: 'Remote name (e.g. origin)', autoFocus: true,
        style: { padding: '3px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)', borderRadius: '2px', fontSize: '11px' }
      }),
      React.createElement('input', {
        value: remoteUrl, onChange: (e: any) => setRemoteUrl(e.target.value),
        onKeyDown: (e: any) => e.key === 'Enter' && handleRemoteAdd(),
        placeholder: 'Remote URL',
        style: { padding: '3px 6px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)', borderRadius: '2px', fontSize: '11px' }
      }),
      React.createElement('button', {
        onClick: handleRemoteAdd, disabled: !remoteName.trim() || !remoteUrl.trim(),
        style: { padding: '3px 8px', background: remoteName.trim() && remoteUrl.trim() ? 'var(--accent)' : 'var(--bg-input)', border: 'none', color: remoteName.trim() && remoteUrl.trim() ? 'white' : 'var(--text-secondary)', borderRadius: '2px', cursor: 'pointer', fontSize: '11px', alignSelf: 'flex-start' }
      }, 'Add Remote')
    ]),
    showRemotes && remotesText && React.createElement('div', {
      key: 'remote-output', style: { padding: '4px 12px', borderBottom: '1px solid var(--border-primary)', fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'pre', lineHeight: '16px', maxHeight: '60px', overflow: 'auto' }
    }, remotesText),
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
          }, 'Unstage')
        ]),
        ...stagedFiles.flatMap(f => renderFileItem(f, true))
      ]),
      modifiedFiles.length > 0 && React.createElement('div', { key: 'modified-group' }, [
        React.createElement('div', {
          style: { padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          React.createElement('div', { key: 'left', style: { display: 'flex', alignItems: 'center', gap: '6px' } },
            React.createElement('input', {
              key: 'select-all', type: 'checkbox', checked: allModifiedSelected,
              onChange: () => {
                if (allModifiedSelected) setSelectedPaths(new Set())
                else setSelectedPaths(new Set(modifiedFiles.map(f => f.path)))
              },
              style: { cursor: 'pointer', accentColor: 'var(--accent)', margin: 0 }
            }),
            React.createElement('span', { key: 'label' }, `MODIFIED (${modifiedFiles.length})`)
          ),
          modifiedFiles.some(f => selectedPaths.has(f.path)) && React.createElement('button', {
            key: 'add-selected', onClick: handleStageSelected,
            style: { background: '#cc7a00', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 10px', fontSize: '11px', borderRadius: '3px', lineHeight: 1, fontWeight: 600 }
          }, `Add (${modifiedFiles.filter(f => selectedPaths.has(f.path)).length})`)
        ]),
        ...modifiedFiles.flatMap(f => renderFileItem(f, false))
      ]),
      untrackedFiles.length > 0 && React.createElement('div', { key: 'untracked-group' }, [
        React.createElement('div', {
          style: { padding: '4px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          React.createElement('div', { key: 'left', style: { display: 'flex', alignItems: 'center', gap: '6px' } },
            React.createElement('input', {
              key: 'select-all', type: 'checkbox', checked: allUntrackedSelected,
              onChange: () => {
                if (allUntrackedSelected) setSelectedPaths(new Set())
                else setSelectedPaths(new Set(untrackedFiles.map(f => f.path)))
              },
              style: { cursor: 'pointer', accentColor: 'var(--accent)', margin: 0 }
            }),
            React.createElement('span', { key: 'label' }, `UNTRACKED (${untrackedFiles.length})`)
          ),
          untrackedFiles.some(f => selectedPaths.has(f.path)) && React.createElement('button', {
            key: 'add-untracked', onClick: handleStageSelected,
            style: { background: '#cc7a00', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 10px', fontSize: '11px', borderRadius: '3px', lineHeight: 1, fontWeight: 600 }
          }, `Add (${untrackedFiles.filter(f => selectedPaths.has(f.path)).length})`)
        ]),
        ...untrackedFiles.flatMap(f => renderFileItem(f, false))
      ]),
      stagedFiles.length === 0 && modifiedFiles.length === 0 && untrackedFiles.length === 0 && React.createElement('div', {
        key: 'no-changes', style: { padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }
      }, 'No changes detected')
    ]),
    React.createElement('div', {
      key: 'commit-area', style: { borderTop: '1px solid var(--border-primary)', padding: '8px 12px' }
    }, [
      React.createElement('textarea', {
        key: 'msg-input', value: commitMessage, onChange: (e: any) => setCommitMessage(e.target.value),
        placeholder: 'Commit message...',
        onKeyDown: (e: any) => { if (e.key === 'Enter' && e.ctrlKey) handleCommit() },
        style: {
          width: '100%', padding: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
          color: 'var(--text-primary)', borderRadius: '3px', fontSize: '12px', resize: 'none',
          height: '50px', boxSizing: 'border-box', fontFamily: 'inherit'
        }
      }),
      React.createElement('div', {
        key: 'commit-actions', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }
      }, [
        React.createElement('button', {
          key: 'do-commit', onClick: handleCommit, disabled: !commitMessage.trim(),
          style: {
            padding: '4px 12px', background: commitMessage.trim() ? 'var(--accent)' : 'var(--bg-input)',
            border: 'none', color: commitMessage.trim() ? 'white' : 'var(--text-secondary)',
            borderRadius: '3px', cursor: commitMessage.trim() ? 'pointer' : 'default', fontSize: '12px'
          }
        }, 'Commit'),
        React.createElement('div', {
          key: 'view-selector', style: { display: 'flex', gap: '2px', background: 'var(--bg-tertiary)', borderRadius: '4px', padding: '2px' }
        }, [
          React.createElement('span', {
            key: 'commits',
            onClick: () => showLog ? setShowLog(false) : (setShowLog(true), setShowOpHistory(false)),
            style: {
              padding: '2px 8px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer',
              color: showLog ? 'var(--text-active)' : 'var(--text-secondary)',
              background: showLog ? 'var(--bg-active)' : 'transparent'
            }
          }, 'Commits'),
          React.createElement('span', {
            key: 'history',
            onClick: async () => {
              if (showOpHistory) { setShowOpHistory(false); return }
              const r = await window.electronAPI?.git.getHistory()
              if (r?.success && r.history) setOpHistory(r.history)
              setShowLog(false)
              setShowOpHistory(true)
            },
            style: {
              padding: '2px 8px', fontSize: '11px', borderRadius: '3px', cursor: 'pointer',
              color: showOpHistory ? 'var(--text-active)' : 'var(--text-secondary)',
              background: showOpHistory ? 'var(--bg-active)' : 'transparent'
            }
          }, 'History')
        ])
      ])
    ]),
    showOpHistory && React.createElement('div', {
      key: 'op-history', style: { borderTop: '1px solid var(--border-primary)', maxHeight: '180px', overflowY: 'auto', padding: '4px 12px' }
    }, [
      React.createElement('div', { key: 'hdr', style: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' } },
        React.createElement('span', null, 'OPERATION HISTORY')
      ),
      opHistory.length === 0
        ? React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '11px', padding: '8px 0', textAlign: 'center' } }, 'No operations recorded yet')
        : opHistory.map((op, i) =>
          React.createElement('div', { key: i, style: { padding: '3px 0', fontSize: '10px', borderBottom: '1px solid var(--bg-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' } }, [
            React.createElement('span', {
              key: 'status',
              style: { color: op.success ? '#4ec9b0' : '#f14c4c', flexShrink: 0 }
            }, op.success ? '✓' : '✗'),
            React.createElement('span', {
              key: 'op', style: { color: 'var(--text-primary)', fontWeight: 600, flexShrink: 0 }
            }, op.operation),
            op.details && React.createElement('span', {
              key: 'details', style: { color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }
            }, op.details),
            React.createElement('span', {
              key: 'time', style: { color: 'var(--text-secondary)', flexShrink: 0, fontSize: '9px' }
            }, new Date(op.timestamp).toLocaleTimeString())
          ])
        )
    ]),
    showLog && React.createElement('div', {
      key: 'log', style: { borderTop: '1px solid var(--border-primary)', maxHeight: '150px', overflowY: 'auto', padding: '4px 12px' }
    }, [
      React.createElement('div', { key: 'log-header', style: { fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 0' } }, 'RECENT COMMITS'),
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
