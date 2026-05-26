import React, { useState } from 'react'
import { EditorSettings, SettingsKey } from '../types'

interface AvailableTheme {
  id: string
  label: string
  type: 'dark' | 'light'
}

interface SettingsPanelProps {
  settings: EditorSettings
  onApply: (settings: EditorSettings) => void
  onClose: () => void
  availableThemes: AvailableTheme[]
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-secondary)',
  color: 'var(--text-primary)',
  borderRadius: '4px',
  fontSize: '13px',
  boxSizing: 'border-box',
  outline: 'none'
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer'
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginBottom: '4px'
}

const SettingInput: React.FC<{
  setting: { key: SettingsKey; label: string; type: string; options?: string[] }
  value: any
  onChange: (key: SettingsKey, value: any) => void
}> = ({ setting, value, onChange }) => {
  if (setting.type === 'boolean') {
    return React.createElement('div', {
      style: { display: 'flex', alignItems: 'center', gap: '8px' }
    }, [
      React.createElement('input', {
        key: 'cb',
        type: 'checkbox',
        checked: !!value,
        onChange: (e: any) => onChange(setting.key, e.target.checked),
        style: { cursor: 'pointer', accentColor: 'var(--accent)' }
      }),
      React.createElement('span', { key: 'lbl', style: { fontSize: '13px', color: 'var(--text-primary)' } }, setting.label)
    ])
  }

  if (setting.type === 'select') {
    return React.createElement('div', null, [
      React.createElement('label', { key: 'lbl', style: labelStyle }, setting.label),
      React.createElement('select', {
        key: 'sel',
        value: value ?? '',
        onChange: (e: any) => onChange(setting.key, e.target.value),
        style: selectStyle
      }, (setting.options || []).map(opt =>
        React.createElement('option', { key: opt, value: opt }, opt)
      ))
    ])
  }

  if (setting.type === 'number') {
    return React.createElement('div', null, [
      React.createElement('label', { key: 'lbl', style: labelStyle }, setting.label),
      React.createElement('input', {
        key: 'num',
        type: 'number',
        value: value ?? '',
        onChange: (e: any) => onChange(setting.key, Number(e.target.value)),
        style: inputStyle
      })
    ])
  }

  return React.createElement('div', null, [
    React.createElement('label', { key: 'lbl', style: labelStyle }, setting.label),
    React.createElement('input', {
      key: 'txt',
      type: 'text',
      value: value ?? '',
      onChange: (e: any) => onChange(setting.key, e.target.value),
      style: inputStyle
    })
  ])
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onApply, onClose, availableThemes }) => {
  const [pending, setPending] = useState<EditorSettings>({ ...settings })

  const handleChange = (key: SettingsKey, value: any) => {
    setPending(prev => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    onApply(pending)
    onClose()
  }

  const workbenchKeys = [
    {
      key: 'workbench.colorTheme' as SettingsKey,
      label: 'Color Theme',
      type: 'select' as const,
      options: availableThemes.map(t => t.id)
    }
  ]

  const editorGroup = {
    label: 'Editor',
    keys: [
      { key: 'editor.fontSize' as SettingsKey, label: 'Font Size', type: 'number' as const },
      { key: 'editor.fontFamily' as SettingsKey, label: 'Font Family', type: 'string' as const },
      { key: 'editor.tabSize' as SettingsKey, label: 'Tab Size', type: 'number' as const },
      { key: 'editor.wordWrap' as SettingsKey, label: 'Word Wrap', type: 'select' as const, options: ['off', 'on', 'wordWrapColumn', 'bounded'] },
      { key: 'editor.lineNumbers' as SettingsKey, label: 'Line Numbers', type: 'select' as const, options: ['on', 'off', 'relative', 'interval'] },
      { key: 'editor.minimap' as SettingsKey, label: 'Minimap', type: 'boolean' as const },
      { key: 'editor.fontLigatures' as SettingsKey, label: 'Font Ligatures', type: 'boolean' as const },
      { key: 'editor.smoothScrolling' as SettingsKey, label: 'Smooth Scrolling', type: 'boolean' as const },
      { key: 'editor.cursorBlinking' as SettingsKey, label: 'Cursor Blinking', type: 'select' as const, options: ['blink', 'smooth', 'phase', 'expand', 'solid'] },
      { key: 'editor.renderWhitespace' as SettingsKey, label: 'Render Whitespace', type: 'select' as const, options: ['none', 'boundary', 'selection', 'trailing', 'all'] },
      { key: 'editor.scrollBeyondLastLine' as SettingsKey, label: 'Scroll Beyond Last Line', type: 'boolean' as const },
      { key: 'editor.bracketPairColorization' as SettingsKey, label: 'Bracket Pair Colorization', type: 'boolean' as const },
      { key: 'editor.bracketPairGuides' as SettingsKey, label: 'Bracket Pair Guides', type: 'boolean' as const },
      { key: 'editor.indentationGuides' as SettingsKey, label: 'Indentation Guides', type: 'boolean' as const }
    ]
  }

  const filesGroup = {
    label: 'Files',
    keys: [
      { key: 'files.autoSave' as SettingsKey, label: 'Auto Save', type: 'select' as const, options: ['off', 'afterDelay', 'onFocusChange', 'onWindowChange'] },
      { key: 'files.autoSaveDelay' as SettingsKey, label: 'Auto Save Delay (ms)', type: 'number' as const }
    ]
  }

  const themeLabel = availableThemes.find(t => t.id === pending['workbench.colorTheme'])?.label || pending['workbench.colorTheme']

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }
  }, [
    React.createElement('div', {
      style: {
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-primary)',
        width: '520px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }
    }, [
      React.createElement('div', {
        key: 'header',
        style: {
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      }, [
        React.createElement('span', { key: 'title', style: { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' } }, 'Settings'),
        React.createElement('span', {
          key: 'close',
          onClick: onClose,
          style: { cursor: 'pointer', fontSize: '18px', color: 'var(--text-secondary)' }
        }, '\u2715')
      ]),
      React.createElement('div', {
        key: 'body',
        style: {
          flex: 1,
          overflowY: 'auto',
          padding: '16px'
        }
      }, [
        React.createElement('div', { key: 'editor-g', style: { marginBottom: '20px' } }, [
          React.createElement('div', {
            key: 'title',
            style: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }
          }, editorGroup.label),
          ...editorGroup.keys.map(s =>
            React.createElement('div', { key: s.key, style: { marginBottom: '10px' } },
              React.createElement(SettingInput, { setting: s, value: pending[s.key], onChange: handleChange })
            )
          )
        ]),
        React.createElement('div', { key: 'files-g', style: { marginBottom: '20px' } }, [
          React.createElement('div', {
            key: 'title',
            style: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }
          }, filesGroup.label),
          ...filesGroup.keys.map(s =>
            React.createElement('div', { key: s.key, style: { marginBottom: '10px' } },
              React.createElement(SettingInput, { setting: s, value: pending[s.key], onChange: handleChange })
            )
          )
        ]),
        React.createElement('div', { key: 'workbench-g', style: { marginBottom: '20px' } }, [
          React.createElement('div', {
            key: 'title',
            style: { fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }
          }, 'Workbench'),
          React.createElement('div', { style: { marginBottom: '10px' } },
            React.createElement(SettingInput, {
              setting: workbenchKeys[0],
              value: pending['workbench.colorTheme'],
              onChange: handleChange
            })
          ),
          React.createElement('div', {
            style: { fontSize: '12px', color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-tertiary)', borderRadius: '4px' }
          }, themeLabel)
        ])
      ]),
      React.createElement('div', {
        key: 'footer',
        style: {
          padding: '12px 16px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }
      }, [
        React.createElement('button', {
          key: 'cancel',
          onClick: onClose,
          style: {
            padding: '6px 18px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-secondary)',
            color: 'var(--text-primary)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px'
          }
        }, 'Cancel'),
        React.createElement('button', {
          key: 'apply',
          onClick: handleApply,
          style: {
            padding: '6px 18px',
            background: 'var(--accent)',
            border: 'none',
            color: 'var(--text-button)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }
        }, 'Apply')
      ])
    ])
  ])
}

export default SettingsPanel
