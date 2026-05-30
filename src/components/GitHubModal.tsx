import React, { useState, useEffect } from 'react'

interface GitHubModalProps {
  folderPath: string | null
  onClose: () => void
}

const sectionTitle: Record<string, string | number> = {
  fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px'
}
const label: Record<string, string | number> = {
  display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px'
}

const GitHubModal: React.FC<GitHubModalProps> = ({ folderPath, onClose }) => {
  const [authUser, setAuthUser] = useState<string | null>(null)
  const [repo, setRepo] = useState<any>(null)
  const [pulls, setPulls] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createPublic, setCreatePublic] = useState(true)
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'issues' | 'prs'>('issues')

  const repoName = repo ? `${repo.owner?.login || ''}/${repo.name}` : ''

  const loadData = async () => {
    if (!window.electronAPI) return
    setLoading(true)
    setError('')
    const auth = await window.electronAPI.github.authStatus()
    if (!auth.loggedIn) { setAuthUser(null); setLoading(false); return }
    setAuthUser(auth.username || 'unknown')

    if (!folderPath) { setLoading(false); return }
    const repoRes = await window.electronAPI.github.repoView(folderPath)
    if (repoRes.success && repoRes.repo) {
      setRepo(repoRes.repo)
      const rn = repoRes.repo.owner?.login
        ? `${repoRes.repo.owner.login}/${repoRes.repo.name}`
        : undefined
      const [prRes, issueRes] = await Promise.all([
        window.electronAPI.github.prList(folderPath, rn),
        window.electronAPI.github.issueList(folderPath, rn)
      ])
      if (prRes.success && prRes.pulls) setPulls(prRes.pulls)
      if (issueRes.success && issueRes.issues) setIssues(issueRes.issues)
    } else if (repoRes.hasRemote === false) {
      setRepo(null)
    } else {
      setError(repoRes.error || 'Failed to load repo info')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreate = async () => {
    if (!window.electronAPI || !folderPath || !createName.trim()) return
    setCreating(true)
    const r = await window.electronAPI.github.repoCreate(folderPath, createName.trim(), createPublic, createDesc.trim() || undefined)
    if (r.success) {
      setShowCreate(false)
      setCreateName('')
      setCreateDesc('')
      loadData()
    } else {
      setError(r.error || 'Failed to create repo')
    }
    setCreating(false)
  }

  const handleBrowse = async () => {
    if (!window.electronAPI || !folderPath) return
    window.electronAPI.github.browse(folderPath)
  }

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
        background: 'var(--bg-secondary)', borderRadius: '8px',
        minWidth: '580px', maxWidth: '640px', maxHeight: '85vh',
        border: '1px solid var(--border-primary)',
        display: 'flex', flexDirection: 'column'
      }
    }, [
      // Header
      React.createElement('div', {
        key: 'header',
        style: {
          padding: '16px 20px', borderBottom: '1px solid var(--border-primary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }
      }, [
        React.createElement('span', {
          key: 'title', style: { fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }
        }, 'GitHub Dashboard'),
        React.createElement('button', {
          key: 'close', onClick: onClose,
          style: { background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }
        }, '×')
      ]),
      // Body (scrollable)
      React.createElement('div', {
        key: 'body',
        style: { padding: '20px', overflowY: 'auto', flex: 1 }
      }, [
        // Auth status
        React.createElement('div', {
          key: 'auth',
          style: {
            padding: '10px 14px', borderRadius: '6px', marginBottom: '16px',
            background: authUser ? 'rgba(78,201,176,0.1)' : 'rgba(241,76,76,0.1)',
            border: `1px solid ${authUser ? 'rgba(78,201,176,0.3)' : 'rgba(241,76,76,0.3)'}`,
            color: authUser ? '#4ec9b0' : '#f14c4c',
            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
          }
        }, [
          React.createElement('span', { key: 'icon', style: { fontSize: '16px' } }, authUser ? '✓' : '✗'),
          React.createElement('span', { key: 'text' },
            authUser ? `Authenticated as @${authUser}` : 'Not logged in — install gh CLI and run gh auth login'
          )
        ]),
        // Loading
        loading && React.createElement('div', {
          key: 'loading',
          style: { textAlign: 'center', color: 'var(--text-secondary)', padding: '30px 0', fontSize: '13px' }
        }, 'Loading...'),
        // Error
        !loading && error && React.createElement('div', {
          key: 'error',
          style: { color: 'var(--danger)', fontSize: '12px', marginBottom: '12px', padding: '8px 12px', background: 'rgba(241,76,76,0.1)', borderRadius: '4px' }
        }, error),
        // No remote — show create form
        !loading && authUser && repo === null && !error && React.createElement('div', {
          key: 'no-repo',
          style: { textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)', fontSize: '13px' }
        }, [
          React.createElement('div', { style: { marginBottom: '12px' } }, 'This project is not yet on GitHub.'),
          React.createElement('button', {
            onClick: () => setShowCreate(true),
            style: { padding: '8px 20px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }
          }, 'Publish to GitHub')
        ]),
        // Repo info card
        !loading && repo && React.createElement('div', {
          key: 'repo-card',
          style: {
            background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '14px',
            marginBottom: '16px', border: '1px solid var(--border-primary)'
          }
        }, [
          React.createElement('div', {
            key: 'top-row',
            style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }
          }, [
            React.createElement('div', { key: 'info', style: { flex: 1 } }, [
              React.createElement('div', {
                style: { fontSize: '15px', fontWeight: 600, color: 'var(--accent)', marginBottom: '4px', cursor: 'pointer' }
              }, repoName),
              repo.description && React.createElement('div', {
                style: { fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }
              }, repo.description),
              React.createElement('div', {
                style: { display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--text-secondary)', flexWrap: 'wrap' }
              }, [
                repo.primaryLanguage && React.createElement('span', { key: 'lang' }, `⬤ ${repo.primaryLanguage.name}`),
                React.createElement('span', { key: 'stars' }, `★ ${repo.stargazerCount || 0}`),
                React.createElement('span', { key: 'forks' }, `⑂ ${repo.forkCount || 0}`),
                React.createElement('span', { key: 'visibility' }, repo.isPrivate ? '🔒 Private' : '🌍 Public'),
                repo.updatedAt && React.createElement('span', { key: 'updated' }, `Updated ${new Date(repo.updatedAt).toLocaleDateString()}`)
              ])
            ])
          ]),
          React.createElement('div', {
            key: 'actions',
            style: { display: 'flex', gap: '8px', marginTop: '12px' }
          }, [
            React.createElement('button', {
              onClick: handleBrowse,
              style: { padding: '6px 14px', background: 'var(--accent)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }
            }, 'Open in Browser'),
            React.createElement('button', {
              onClick: () => setShowCreate(!showCreate),
              style: { padding: '6px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }
            }, showCreate ? 'Cancel' : 'Create Another Repo'),
            React.createElement('button', {
              onClick: loadData,
              style: { padding: '6px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-secondary)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', marginLeft: 'auto' }
            }, '🔄 Refresh')
          ])
        ]),
        // Create repo form
        showCreate && React.createElement('div', {
          key: 'create-form',
          style: {
            background: 'var(--bg-tertiary)', borderRadius: '6px', padding: '14px',
            marginBottom: '16px', border: '1px solid var(--border-primary)'
          }
        }, [
          React.createElement('div', { key: 'ctitle', style: sectionTitle }, 'Create Repository'),
          React.createElement('label', { key: 'name-label', style: label }, 'Repository Name'),
          React.createElement('input', {
            key: 'name-input',
            value: createName, onChange: (e: any) => setCreateName(e.target.value),
            placeholder: 'my-new-repo',
            style: {
              width: '100%', padding: '7px 10px', marginBottom: '10px', boxSizing: 'border-box',
              background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)', borderRadius: '4px', fontSize: '12px'
            }
          }),
          React.createElement('label', { key: 'desc-label', style: label }, 'Description (optional)'),
          React.createElement('input', {
            key: 'desc-input',
            value: createDesc, onChange: (e: any) => setCreateDesc(e.target.value),
            placeholder: 'Brief description of the project',
            style: {
              width: '100%', padding: '7px 10px', marginBottom: '10px', boxSizing: 'border-box',
              background: 'var(--bg-input)', border: '1px solid var(--border-secondary)',
              color: 'var(--text-primary)', borderRadius: '4px', fontSize: '12px'
            }
          }),
          React.createElement('div', {
            key: 'visibility',
            style: { display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'center' }
          }, [
            React.createElement('label', { style: { fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' } },
              React.createElement('input', {
                type: 'radio', name: 'visibility', checked: createPublic,
                onChange: () => setCreatePublic(true),
                style: { accentColor: 'var(--accent)', margin: 0 }
              }),
              '🌍 Public'
            ),
            React.createElement('label', { style: { fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' } },
              React.createElement('input', {
                type: 'radio', name: 'visibility', checked: !createPublic,
                onChange: () => setCreatePublic(false),
                style: { accentColor: 'var(--accent)', margin: 0 }
              }),
              '🔒 Private'
            )
          ]),
          React.createElement('button', {
            onClick: handleCreate, disabled: creating || !createName.trim(),
            style: {
              padding: '7px 20px',
              background: createName.trim() ? 'var(--accent)' : 'var(--bg-input)',
              border: 'none',
              color: createName.trim() ? 'white' : 'var(--text-secondary)',
              borderRadius: '4px', cursor: createName.trim() ? 'pointer' : 'default', fontSize: '12px'
            }
          }, creating ? 'Creating...' : 'Create Repository')
        ]),
        // Issues / PRs tabs
        !loading && repo && React.createElement('div', {
          key: 'tabs'
        }, [
          React.createElement('div', {
            key: 'tab-bar',
            style: { display: 'flex', gap: '0', borderBottom: '2px solid var(--border-primary)', marginBottom: '10px' }
          }, [
            React.createElement('div', {
              key: 'issues-tab', onClick: () => setActiveTab('issues'),
              style: {
                padding: '6px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                color: activeTab === 'issues' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'issues' ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-2px'
              }
            }, `Issues (${issues.length})`),
            React.createElement('div', {
              key: 'prs-tab', onClick: () => setActiveTab('prs'),
              style: {
                padding: '6px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                color: activeTab === 'prs' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'prs' ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: '-2px'
              }
            }, `Pull Requests (${pulls.length})`)
          ]),
          activeTab === 'issues' && React.createElement('div', { key: 'issue-list' }, [
            issues.length === 0
              ? React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '12px', padding: '10px 0', textAlign: 'center' } }, 'No open issues')
              : issues.map((iss: any) =>
                React.createElement('div', {
                  key: iss.number,
                  style: { padding: '8px 10px', borderBottom: '1px solid var(--bg-tertiary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }
                }, [
                  React.createElement('span', {
                    key: 'state',
                    style: { color: iss.state === 'open' ? '#3fb950' : '#8b949e', fontSize: '14px', flexShrink: 0 }
                  }, iss.state === 'open' ? '🟢' : '🔴'),
                  React.createElement('div', { key: 'info', style: { flex: 1, overflow: 'hidden' } }, [
                    React.createElement('div', {
                      key: 'title',
                      style: { color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                    }, `#${iss.number} ${iss.title}`),
                    React.createElement('div', {
                      key: 'meta',
                      style: { color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }
                    }, `by ${iss.author?.login || 'unknown'} — ${new Date(iss.createdAt).toLocaleDateString()}`)
                  ]),
                  iss.labels?.length > 0 && React.createElement('div', {
                    key: 'labels', style: { display: 'flex', gap: '4px', flexShrink: 0 }
                  }, iss.labels.map((l: any) =>
                    React.createElement('span', {
                      key: l.name,
                      style: {
                        padding: '1px 6px', borderRadius: '10px', fontSize: '10px',
                        background: `#${l.color}22`, color: `#${l.color}`, border: `1px solid #${l.color}44`
                      }
                    }, l.name)
                  ))
                ])
              )
          ]),
          activeTab === 'prs' && React.createElement('div', { key: 'pr-list' }, [
            pulls.length === 0
              ? React.createElement('div', { style: { color: 'var(--text-secondary)', fontSize: '12px', padding: '10px 0', textAlign: 'center' } }, 'No open pull requests')
              : pulls.map((pr: any) =>
                React.createElement('div', {
                  key: pr.number,
                  style: { padding: '8px 10px', borderBottom: '1px solid var(--bg-tertiary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }
                }, [
                  React.createElement('span', {
                    key: 'state',
                    style: { color: pr.state === 'open' ? '#3fb950' : '#8b949e', fontSize: '14px', flexShrink: 0 }
                  }, pr.state === 'open' ? '🟢' : pr.state === 'merged' ? '💜' : '🔴'),
                  React.createElement('div', { key: 'info', style: { flex: 1, overflow: 'hidden' } }, [
                    React.createElement('div', {
                      key: 'title',
                      style: { color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
                    }, `#${pr.number} ${pr.title}`),
                    React.createElement('div', {
                      key: 'meta',
                      style: { color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }
                    }, `${pr.headRefName} by ${pr.author?.login || 'unknown'} — ${new Date(pr.createdAt).toLocaleDateString()}`)
                  ])
                ])
              )
          ])
        ])
      ]),
      // Footer
      React.createElement('div', {
        key: 'footer',
        style: {
          padding: '10px 20px', borderTop: '1px solid var(--border-primary)',
          textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)'
        }
      }, 'GitHub CLI integration — requires gh CLI')
    ])
  ])
}

export default GitHubModal
