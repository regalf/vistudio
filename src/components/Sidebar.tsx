import React from 'react'
import ProjectExplorer from './ProjectExplorer'
import GitPanel from './GitPanel'

interface SidebarProps {
  isOpen: boolean
  width: number
  folderPath: string | null
  refreshPath: string | null
  onOpenFolder: () => void
  onFileClick: (path: string) => void
  onProjectLoad: (projectPath: string) => void
  onNewFile: (parentPath: string) => void
  onNewFolder: (parentPath: string) => void
  onRefreshPathConsumed: () => void
  onRefresh: () => void
  activePanel: 'explorer' | 'git'
  onPanelChange: (panel: 'explorer' | 'git') => void
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, width, folderPath, refreshPath, onOpenFolder, onFileClick, onProjectLoad, onNewFile, onNewFolder, onRefreshPathConsumed, onRefresh, activePanel, onPanelChange }) => {

  return React.createElement('div', {
    style: {
      width: isOpen ? `${width}px` : '0',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-primary)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: isOpen ? 'none' : 'width 0.2s'
    }
  }, [
    React.createElement('div', {
      key: 'tabs',
      style: { display: 'flex', borderBottom: '1px solid var(--border-primary)', flexShrink: 0 }
    }, [
      React.createElement('div', {
        onClick: () => onPanelChange('explorer'),
        style: {
          flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.5px', textAlign: 'center', cursor: 'pointer',
          color: activePanel === 'explorer' ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: activePanel === 'explorer' ? 'var(--bg-tertiary)' : 'transparent',
          borderBottom: activePanel === 'explorer' ? '2px solid var(--accent)' : '2px solid transparent'
        }
      }, 'EXPLORER'),
      React.createElement('div', {
        onClick: () => onPanelChange('git'),
        style: {
          flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: 600,
          letterSpacing: '0.5px', textAlign: 'center', cursor: 'pointer',
          color: activePanel === 'git' ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: activePanel === 'git' ? 'var(--bg-tertiary)' : 'transparent',
          borderBottom: activePanel === 'git' ? '2px solid var(--accent)' : '2px solid transparent'
        }
      }, 'SOURCE CONTROL')
    ]),
    activePanel === 'explorer'
      ? React.createElement('div', { key: 'explorer', style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }, [
          React.createElement('div', {
            style: { padding: '6px 12px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.8px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-primary)' }
          }, 'EXPLORER'),
          React.createElement('div', {
            style: { padding: '6px 12px', borderBottom: '1px solid var(--border-primary)' }
          }, [
            React.createElement('button', {
              onClick: onOpenFolder, title: 'Open Folder',
              style: { width: '100%', padding: '4px 8px', background: 'var(--accent)', color: 'var(--text-button)', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }
            }, 'Open Folder')
          ]),
          React.createElement('div', { style: { flex: 1, overflowY: 'auto' } },
            React.createElement(ProjectExplorer, {
              folderPath, refreshPath, onFileClick, onProjectLoad,
              onNewFile, onNewFolder, onRefreshPathConsumed, onRefresh
            })
          )
        ])
      : React.createElement('div', { key: 'git', style: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }, [
          React.createElement('div', {
            style: { padding: '6px 12px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-primary)' }
          }, 'SOURCE CONTROL'),
          React.createElement('div', { style: { flex: 1, overflowY: 'auto' } },
            React.createElement(GitPanel, { folderPath, onFileClick })
          )
        ])
  ])
}

export default Sidebar
