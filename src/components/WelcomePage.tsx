import React from 'react'

interface WelcomePageProps {
  version: string
  recentFolders: string[]
  onOpenFolder: () => void
  onNewFile: () => void
  onNewProject: () => void
  onOpenRecent: (path: string) => void
  onRemoveRecent: (path: string) => void
  onClearRecents: () => void
}

const card: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 18px',
  background: 'var(--bg-tertiary)',
  border: '1px solid var(--border-primary)',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--text-primary)',
  fontSize: '14px',
  transition: 'border-color 0.15s, background 0.15s'
}

export default function WelcomePage({
  version,
  recentFolders,
  onOpenFolder,
  onNewFile,
  onNewProject,
  onOpenRecent,
  onRemoveRecent,
  onClearRecents
}: WelcomePageProps) {
  return React.createElement('div', {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: '40px',
      background: 'var(--bg-primary)'
    }
  }, [
    React.createElement('div', {
      key: 'inner',
      style: {
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px'
      }
    }, [
      React.createElement('div', {
        key: 'header',
        style: { textAlign: 'center', marginBottom: '8px' }
      }, [
        React.createElement('h1', {
          style: {
            fontSize: '40px',
            fontWeight: 300,
            color: 'var(--text-active)',
            margin: '0 0 4px 0',
            letterSpacing: '-1px'
          }
        }, 'ViStudio'),
        React.createElement('p', {
          style: {
            margin: 0,
            fontSize: '13px',
            color: 'var(--text-secondary)'
          }
        }, 'v' + version + ' \u2014 A modern, extensible code editor')
      ]),
      React.createElement('div', {
        key: 'actions',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px'
        }
      }, [
        actionCard('\uD83D\uDCC2', 'Open Folder', 'Ctrl+Shift+O', onOpenFolder),
        actionCard('\uD83D\uDCC4', 'New File', 'Ctrl+N', onNewFile),
        actionCard('\uD83C\uDD95', 'New Project', '', onNewProject)
      ]),
      recentFolders.length > 0 && React.createElement('div', {
        key: 'recent'
      }, [
        React.createElement('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }
        }, [
          React.createElement('span', {
            style: {
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }
          }, 'Recent'),
          React.createElement('span', {
            onClick: onClearRecents,
            style: {
              fontSize: '12px',
              color: 'var(--accent)',
              cursor: 'pointer'
            }
          }, 'Clear All')
        ]),
        React.createElement('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }
        }, recentFolders.map((path) =>
          React.createElement('div', {
            key: path,
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'transparent',
              border: '1px solid transparent',
              fontSize: '13px',
              color: 'var(--text-primary)',
              transition: 'background 0.1s'
            },
            onMouseEnter: (e: React.MouseEvent) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
            },
            onMouseLeave: (e: React.MouseEvent) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
            },
            onClick: () => onOpenRecent(path)
          }, [
            React.createElement('span', {
              key: 'icon',
              style: { fontSize: '16px', flexShrink: 0 }
            }, '\uD83D\uDCC1'),
            React.createElement('span', {
              key: 'label',
              style: {
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }, path),
            React.createElement('span', {
              key: 'remove',
              onClick: (e: React.MouseEvent) => {
                e.stopPropagation()
                onRemoveRecent(path)
              },
              style: {
                fontSize: '16px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                opacity: 0,
                transition: 'opacity 0.1s',
                flexShrink: 0,
                padding: '2px 6px'
              },
              onMouseEnter: (e: React.MouseEvent) => {
                (e.currentTarget as HTMLElement).style.opacity = '1'
              },
              onMouseLeave: (e: React.MouseEvent) => {
                (e.currentTarget as HTMLElement).style.opacity = '0'
              }
            }, '\u00D7')
          ])
        ))
      ]),
      React.createElement('div', {
        key: 'bottom',
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginTop: '12px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-primary)'
        }
      }, [
        React.createElement('div', {
          key: 'shortcuts'
        }, [
          React.createElement('p', {
            style: {
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px 0'
            }
          }, 'Keyboard Shortcuts'),
          ...shortcutList([
            ['Ctrl+O', 'Open File'],
            ['Ctrl+P', 'Quick Open'],
            ['Ctrl+Shift+F', 'Search in Files'],
            ['Ctrl+B', 'Toggle Sidebar'],
            ['Ctrl+`', 'Toggle Terminal'],
            ['Ctrl+N', 'New File'],
            ['Ctrl+Shift+P', 'Command Palette']
          ])
        ]),
        React.createElement('div', {
          key: 'help'
        }, [
          React.createElement('p', {
            style: {
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px 0'
            }
          }, 'Help'),
          ...helpLinks
        ])
      ])
    ])
  ])
}

function actionCard(icon: string, label: string, shortcut: string, onClick: () => void) {
  return React.createElement('div', {
    key: label,
    onClick,
    style: card,
    onMouseEnter: (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = 'var(--accent)'
      el.style.background = 'var(--bg-hover)'
    },
    onMouseLeave: (e: React.MouseEvent) => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = 'var(--border-primary)'
      el.style.background = 'var(--bg-tertiary)'
    }
  }, [
    React.createElement('span', {
      key: 'icon',
      style: { fontSize: '22px', flexShrink: 0 }
    }, icon),
    React.createElement('div', {
      key: 'text',
      style: { display: 'flex', flexDirection: 'column', gap: '2px' }
    }, [
      React.createElement('span', {
        key: 'label',
        style: { fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }
      }, label),
      shortcut ? React.createElement('span', {
        key: 'shortcut',
        style: { fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }
      }, shortcut) : null
    ])
  ])
}

function shortcutList(items: [string, string][]) {
  return items.map(([key, desc]) =>
    React.createElement('div', {
      key: key,
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '5px 0',
        fontSize: '13px'
      }
    }, [
      React.createElement('span', {
        style: { color: 'var(--accent)', fontFamily: 'monospace', fontSize: '12px' }
      }, key),
      React.createElement('span', {
        style: { color: 'var(--text-secondary)', fontSize: '12px' }
      }, desc)
    ])
  )
}

const helpLinks = [
  { label: '\uD83D\uDCD6 Documentation', action: 'help-docs' },
  { label: '\uD83C\uDF10 GitHub', action: 'help-github' },
  { label: '\uD83D\uDCE6 Manage Extensions', action: 'manage-extensions' },
  { label: '\uD83D\uDD04 Check for Updates', action: 'check-updates' },
].map(item => {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('welcome-action', { detail: item.action }))
  }

  return React.createElement('div', {
    key: item.label,
    onClick: handleClick,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '5px 0',
      fontSize: '13px',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      transition: 'color 0.1s'
    },
    onMouseEnter: (e: React.MouseEvent) => {
      (e.currentTarget as HTMLElement).style.color = 'var(--accent)'
    },
    onMouseLeave: (e: React.MouseEvent) => {
      (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'
    }
  }, [
    React.createElement('span', { key: 'label' }, item.label)
  ])
})
