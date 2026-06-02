import React, { useState, useEffect, useCallback, useRef } from 'react'

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  total: number
  transferred: number
}

interface UpdatePanelProps {
  onClose: () => void
  settings: Record<string, any>
  onSettingChange: (key: string, value: any) => void
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function UpdatePanel({ onClose, settings, onSettingChange }: UpdatePanelProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error'>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [errorUrl, setErrorUrl] = useState('')
  const [currentVersion, setCurrentVersion] = useState('—')
  const [installType, setInstallType] = useState<{ type: string; pkg: string; needsElevation: boolean } | null>(null)
  const checkNotifOn = settings['update.checkOnStartup'] !== false
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    window.electronAPI?.getVersion().then(v => {
      if (mountedRef.current) setCurrentVersion(v)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    window.electronAPI?.update.installType().then(t => {
      if (mountedRef.current) setInstallType(t)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const onAvailable = window.electronAPI?.update.onAvailable
    if (onAvailable) {
      onAvailable((info: UpdateInfo) => {
        if (!mountedRef.current) return
        setUpdateInfo(info)
        setStatus('available')
      })
    }

    const onNotAvailable = window.electronAPI?.update.onNotAvailable
    if (onNotAvailable) {
      onNotAvailable(() => {
        if (!mountedRef.current) return
        setStatus('up-to-date')
      })
    }

    const onProgress = window.electronAPI?.update.onDownloadProgress
    if (onProgress) {
      onProgress((p: DownloadProgress) => {
        if (!mountedRef.current) return
        setProgress(p)
        setStatus('downloading')
      })
    }

    const onDownloaded = window.electronAPI?.update.onDownloaded
    if (onDownloaded) {
      onDownloaded(() => {
        if (!mountedRef.current) return
        setProgress(null)
        setStatus('downloaded')
      })
    }

    const onError = window.electronAPI?.update.onError
    if (onError) {
      onError((msg: { message: string; url?: string }) => {
        if (!mountedRef.current) return
        setStatus('error')
        setErrorMsg(typeof msg === 'string' ? msg : msg.message)
        if (typeof msg !== 'string' && msg.url) {
          setErrorUrl(msg.url)
        }
      })
    }

    // Auto-check for updates when opening the modal
    const timer = setTimeout(() => {
      setStatus('checking')
      setErrorMsg('')
      setErrorUrl('')
      setUpdateInfo(null)
      setProgress(null)
      window.electronAPI?.update.check().catch(() => {})
    }, 100)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const handleCheck = useCallback(async () => {
    setStatus('checking')
    setErrorMsg('')
    setErrorUrl('')
    setUpdateInfo(null)
    setProgress(null)
    try {
      await window.electronAPI?.update.check()
    } catch (e: any) {
      if (mountedRef.current) {
        setStatus('error')
        setErrorMsg(e.message || 'Failed to check for updates')
      }
    }
  }, [])

  const handleDownload = useCallback(async () => {
    setStatus('downloading')
    setProgress({ percent: 0, bytesPerSecond: 0, total: 0, transferred: 0 })
    try {
      await window.electronAPI?.update.download()
    } catch (e: any) {
      if (mountedRef.current) {
        setStatus('error')
        setErrorMsg(e.message || 'Download failed')
      }
    }
  }, [])

  const handleCancel = useCallback(async () => {
    try {
      await (window.electronAPI?.update as any)?.cancel?.()
    } catch (_) {}
    if (mountedRef.current) {
      setStatus('idle')
      setProgress(null)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    try {
      await window.electronAPI?.update.install()
    } catch (_) {}
  }, [])

  const handleVisitReleases = useCallback(() => {
    if (errorUrl) {
      window.electronAPI?.util?.openExternal(errorUrl)
    }
  }, [errorUrl])

  const toggleNotify = useCallback(() => {
    onSettingChange('update.checkOnStartup', !checkNotifOn)
  }, [checkNotifOn, onSettingChange])

  const btnStyle: React.CSSProperties = {
    padding: '8px 20px',
    background: 'var(--accent)',
    border: 'none',
    color: 'var(--text-button)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px'
  }

  const btnSecondary: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    marginLeft: '8px'
  }

  const btnDanger: React.CSSProperties = {
    ...btnStyle,
    background: 'var(--danger)',
    marginLeft: '8px'
  }

  let statusContent = null

  switch (status) {
    case 'idle':
      statusContent = React.createElement('p', {
        style: { color: 'var(--text-secondary)', fontSize: '13px' }
      }, 'Click "Check for Updates" to see if a new version is available.')
      break

    case 'checking':
      statusContent = React.createElement('p', {
        style: { color: 'var(--text-secondary)', fontSize: '13px' }
      }, 'Checking for updates...')
      break

    case 'available':
      statusContent = React.createElement('div', null, [
        React.createElement('p', {
          key: 'msg',
          style: { color: 'var(--text-primary)', fontSize: '13px', marginBottom: '8px' }
        }, 'A new version is available: ' + (updateInfo?.version || 'unknown')),
        updateInfo?.releaseDate && React.createElement('p', {
          key: 'date',
          style: { color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }
        }, 'Released: ' + new Date(updateInfo.releaseDate).toLocaleDateString()),
        installType && React.createElement('p', {
          key: 'pkg',
          style: { color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '8px' }
        }, 'Package: ' + installType.pkg),
        React.createElement('button', {
          key: 'download-btn',
          onClick: handleDownload,
          style: btnStyle
        }, 'Download Update')
      ])
      break

    case 'downloading':
      statusContent = React.createElement('div', null, [
        React.createElement('p', {
          key: 'label',
          style: { color: 'var(--text-primary)', fontSize: '13px', marginBottom: '8px' }
        }, 'Downloading update...'),
        progress && React.createElement('div', {
          key: 'progress-bar',
          style: {
            width: '100%',
            height: '8px',
            background: 'var(--bg-input)',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '6px'
          }
        }, [
          React.createElement('div', {
            key: 'fill',
            style: {
              width: (progress.percent || 0) + '%',
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 0.3s ease',
              borderRadius: '4px'
            }
          })
        ]),
        progress && React.createElement('p', {
          key: 'stats',
          style: { color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }
        }, Math.round(progress.percent || 0) + '% - ' + formatBytes(progress.transferred || 0) + ' / ' + formatBytes(progress.total || 0)),
        React.createElement('button', {
          key: 'cancel-btn',
          onClick: handleCancel,
          style: btnDanger
        }, 'Cancel')
      ])
      break

    case 'downloaded':
      statusContent = React.createElement('div', null, [
        React.createElement('p', {
          key: 'msg',
          style: { color: 'var(--text-primary)', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }
        }, 'Update downloaded!'),
        installType?.needsElevation && React.createElement('div', {
          key: 'elevation-warning',
          style: {
            background: 'rgba(255, 193, 7, 0.15)',
            border: '1px solid rgba(255, 193, 7, 0.4)',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '10px',
            fontSize: '12px',
            color: 'var(--text-primary)'
          }
        }, [
          React.createElement('p', {
            key: 'warn-title',
            style: { margin: '0 0 4px 0', fontWeight: 'bold', color: '#ffc107' }
          }, 'Administrative privileges required'),
          React.createElement('p', {
            key: 'warn-text',
            style: { margin: '0', color: 'var(--text-secondary)' }
          }, 'The update will be installed using pkexec. You will be prompted for your administrator password.')
        ]),
        React.createElement('button', {
          key: 'install-btn',
          onClick: handleInstall,
          style: btnStyle
        }, 'Restart & Install'),
        React.createElement('button', {
          key: 'later-btn',
          onClick: onClose,
          style: btnSecondary
        }, 'Later')
      ])
      break

    case 'up-to-date':
      statusContent = React.createElement('p', {
        style: { color: '#4ec94e', fontSize: '13px' }
      }, 'You have the latest version (' + currentVersion + ').')
      break

    case 'error':
      statusContent = React.createElement('div', null, [
        React.createElement('p', {
          key: 'msg',
          style: { color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }
        }, errorMsg || 'An error occurred'),
        errorUrl && React.createElement('button', {
          key: 'releases-btn',
          onClick: handleVisitReleases,
          style: { ...btnStyle, marginBottom: '8px' }
        }, 'Visit Releases Page'),
        React.createElement('button', {
          key: 'retry',
          onClick: handleCheck,
          style: btnSecondary
        }, 'Retry')
      ])
      break
  }

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001
    }
  }, [
    React.createElement('div', {
      key: 'modal',
      style: {
        background: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: '8px',
        minWidth: '420px',
        maxWidth: '520px',
        border: '1px solid var(--border-primary)'
      }
    }, [
      React.createElement('h2', {
        key: 'title',
        style: { margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '18px' }
      }, 'Updates'),
      React.createElement('p', {
        key: 'version',
        style: { margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '13px' }
      }, 'Current version: ' + currentVersion),
      React.createElement('div', {
        key: 'status',
        style: { marginBottom: '16px' }
      }, statusContent),
      React.createElement('hr', {
        key: 'divider',
        style: { border: 'none', borderTop: '1px solid var(--border-primary)', margin: '16px 0' }
      }),
      React.createElement('label', {
        key: 'toggle',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: '13px',
          marginBottom: '16px'
        }
      }, [
        React.createElement('input', {
          key: 'checkbox',
          type: 'checkbox',
          checked: checkNotifOn,
          onChange: toggleNotify,
          style: { cursor: 'pointer' }
        }),
        'Check for updates on startup'
      ]),
      React.createElement('div', {
        key: 'buttons',
        style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }
      }, [
        status === 'idle' && React.createElement('button', {
          key: 'check',
          onClick: handleCheck,
          style: btnStyle
        }, 'Check for Updates'),
        React.createElement('button', {
          key: 'close',
          onClick: onClose,
          style: btnSecondary
        }, 'Close')
      ])
    ])
  ])
}
