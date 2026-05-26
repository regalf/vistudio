import React, { useState, useEffect, useRef } from 'react'

interface MenuItem {
  label?: string
  action?: string
  shortcut?: string
  separator?: boolean
}

interface MenuBarProps {
  onAction: (action: string) => void
}

const menuTemplate: { label: string; items: MenuItem[] }[] = [
  {
    label: 'File',
    items: [
      { label: 'New File', action: 'menu:new-file', shortcut: 'Ctrl+N' },
      { label: 'New Folder...', action: 'menu:new-folder' },
      { label: 'New Project...', action: 'menu:new-project' },
      { separator: true },
      { label: 'Open File...', action: 'menu:open-file', shortcut: 'Ctrl+O' },
      { label: 'Open Folder...', action: 'menu:open-folder', shortcut: 'Ctrl+Shift+O' },
      { label: 'Open Project...', action: 'menu:open-project' },
      { separator: true },
      { label: 'Save', action: 'menu:save', shortcut: 'Ctrl+S' },
      { label: 'Save As...', action: 'menu:save-as', shortcut: 'Ctrl+Shift+S' },
      { separator: true },
      { label: 'Exit', action: 'menu:exit' }
    ]
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', action: 'menu:undo', shortcut: 'Ctrl+Z' },
      { label: 'Redo', action: 'menu:redo', shortcut: 'Ctrl+Y' },
      { separator: true },
      { label: 'Cut', action: 'menu:cut', shortcut: 'Ctrl+X' },
      { label: 'Copy', action: 'menu:copy', shortcut: 'Ctrl+C' },
      { label: 'Paste', action: 'menu:paste', shortcut: 'Ctrl+V' },
      { separator: true },
      { label: 'Find', action: 'menu:find', shortcut: 'Ctrl+F' },
      { label: 'Replace', action: 'menu:replace', shortcut: 'Ctrl+H' }
    ]
  },
  {
    label: 'View',
    items: [
      { label: 'Toggle Sidebar', action: 'menu:toggle-sidebar', shortcut: 'Ctrl+B' },
      { label: 'Toggle Terminal', action: 'menu:toggle-terminal', shortcut: 'Ctrl+`' },
      { label: 'Toggle Console', action: 'menu:toggle-console', shortcut: 'Ctrl+Shift+U' },
      { label: 'Command Palette', action: 'menu:command-palette', shortcut: 'Ctrl+Shift+P' },
      { separator: true },
      { label: 'Settings', action: 'menu:settings', shortcut: 'Ctrl+,' },
      { label: 'Zoom In', action: 'menu:zoom-in', shortcut: 'Ctrl+=' },
      { label: 'Zoom Out', action: 'menu:zoom-out', shortcut: 'Ctrl+-' },
      { label: 'Reset Zoom', action: 'menu:zoom-reset' }
    ]
  },
  {
    label: 'Source Control',
    items: [
      { label: 'View Source Control', action: 'menu:source-control' },
      { separator: true },
      { label: 'Git Status', action: 'menu:git-status' },
      { label: 'Git Commit...', action: 'menu:git-commit' },
      { separator: true },
      { label: 'Git Pull', action: 'menu:git-pull' },
      { label: 'Git Push', action: 'menu:git-push' },
      { separator: true },
      { label: 'Git Init', action: 'menu:git-init' },
      { label: 'Git Clone...', action: 'menu:git-clone' }
    ]
  },
  {
    label: 'Extensions',
    items: [
      { label: 'Manage Extensions...', action: 'menu:manage-extensions' },
      { separator: true },
      { label: 'Load Extension...', action: 'menu:load-extension' },
      { label: 'Install Extension...', action: 'menu:install-extension' },
      { separator: true },
      { label: 'Refresh Extensions', action: 'menu:refresh-extensions' }
    ]
  },
  {
    label: 'Help',
    items: [
      { label: 'Run Debug Tests', action: 'menu:debug-test-all', shortcut: 'Ctrl+Shift+T' },
      { label: 'About ViStudio', action: 'menu:about' }
    ]
  }
]

const MenuBar: React.FC<MenuBarProps> = ({ onAction }) => {
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuClick = (index: number) => {
    setActiveMenu(activeMenu === index ? null : index)
  }

  const handleItemClick = (action?: string) => {
    if (action) {
      onAction(action)
    }
    setActiveMenu(null)
  }

  return React.createElement('div', {
    ref: containerRef,
    style: {
      height: '30px',
      background: 'var(--bg-titlebar)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 8px',
      fontSize: '13px',
      color: 'var(--text-primary)',
      userSelect: 'none',
      borderBottom: '1px solid var(--border-primary)',
      WebkitAppRegion: 'drag' as any
    }
  }, [
    React.createElement('div', {
      key: 'logo',
      style: { marginRight: '12px', fontWeight: 600, color: 'var(--accent)', fontSize: '14px', WebkitAppRegion: 'no-drag' as any }
    }, 'ViStudio'),
    ...menuTemplate.map((menu, menuIndex) => {
      const isActive = activeMenu === menuIndex
      return React.createElement('div', {
        key: menu.label,
        style: { position: 'relative' }
      }, [
        React.createElement('div', {
          key: 'label',
          onClick: () => handleMenuClick(menuIndex),
          onMouseEnter: () => { if (activeMenu !== null) setActiveMenu(menuIndex) },
          style: {
            padding: '4px 10px',
            cursor: 'pointer',
            background: isActive ? 'var(--bg-hover)' : 'transparent',
            borderRadius: '3px',
            WebkitAppRegion: 'no-drag' as any
          }
        }, menu.label),
        isActive && React.createElement('div', {
          key: 'dropdown',
          style: {
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'var(--bg-dropdown)',
            border: '1px solid var(--border-dropdown)',
            borderRadius: '4px',
            padding: '4px 0',
            minWidth: '220px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }
        }, menu.items.map((item, itemIndex) => {
          if (item.separator) {
            return React.createElement('div', {
              key: itemIndex,
              style: { height: '1px', background: 'var(--border-dropdown)', margin: '4px 0' }
            })
          }
          return React.createElement('div', {
            key: itemIndex,
            onClick: () => handleItemClick(item.action),
            onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.background = 'var(--accent-hover)'
              e.currentTarget.style.color = 'var(--text-active)'
            },
            onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-primary)'
            },
            style: {
              padding: '6px 24px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--text-primary)',
              WebkitAppRegion: 'no-drag' as any
            }
          }, [
            React.createElement('span', { key: 'label' }, item.label),
            item.shortcut && React.createElement('span', {
              key: 'shortcut',
              style: { color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '30px' }
            }, item.shortcut)
          ])
        }))
      ])
    }),
    React.createElement('div', {
      key: 'window-controls',
      style: { display: 'flex', gap: '4px', marginLeft: 'auto', WebkitAppRegion: 'no-drag' as any }
    }, [
      React.createElement('div', {
        key: 'minimize',
        onClick: () => window.electronAPI?.windowControls.minimize(),
        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent' },
        style: { width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', borderRadius: '3px', padding: '2px', color: 'var(--text-primary)' },
        title: 'Minimize'
      }, '\u2014'),
      React.createElement('div', {
        key: 'maximize',
        onClick: () => window.electronAPI?.windowControls.maximize(),
        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'var(--bg-hover)' },
        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent' },
        style: { width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', borderRadius: '3px', padding: '2px', color: 'var(--text-primary)' },
        title: 'Maximize'
      }, '\u25a1'),
      React.createElement('div', {
        key: 'close',
        onClick: () => window.electronAPI?.windowControls.close(),
        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = 'var(--text-button)' },
        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)' },
        style: { width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer', borderRadius: '3px', padding: '2px', color: 'var(--text-secondary)' },
        title: 'Close'
      }, '\u2715')
    ])
  ])
}

export default MenuBar
