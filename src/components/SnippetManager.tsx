import React, { useState } from 'react'
import { CompletionItemKind } from '../types/extension'

interface Snippet {
  label: string
  kind: CompletionItemKind
  insertText: string
  detail: string
}

interface SnippetManagerProps {
  onSave: (extName: string, extDescription: string, extAuthor: string, extVersion: string, language: string, snippets: Snippet[]) => Promise<void>
  onClose: () => void
}

const KIND_NAMES: Record<number, string> = {
  [CompletionItemKind.Text]: 'Text',
  [CompletionItemKind.Method]: 'Method',
  [CompletionItemKind.Function]: 'Function',
  [CompletionItemKind.Constructor]: 'Constructor',
  [CompletionItemKind.Field]: 'Field',
  [CompletionItemKind.Variable]: 'Variable',
  [CompletionItemKind.Class]: 'Class',
  [CompletionItemKind.Interface]: 'Interface',
  [CompletionItemKind.Module]: 'Module',
  [CompletionItemKind.Property]: 'Property',
  [CompletionItemKind.Keyword]: 'Keyword',
  [CompletionItemKind.Snippet]: 'Snippet',
  [CompletionItemKind.Color]: 'Color',
  [CompletionItemKind.File]: 'File',
  [CompletionItemKind.Reference]: 'Reference'
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginBottom: '4px'
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  color: 'var(--text-button)'
}

function SnippetManager({ onSave, onClose }: SnippetManagerProps) {
  const [extName, setExtName] = useState('my-snippets')
  const [extDescription, setExtDescription] = useState('Custom snippets extension')
  const [extAuthor, setExtAuthor] = useState('')
  const [extVersion, setExtVersion] = useState('1.0.0')
  const [language, setLanguage] = useState('javascript')
  const [snippets, setSnippets] = useState<Snippet[]>([
    { label: 'log', kind: CompletionItemKind.Snippet, insertText: 'console.log()', detail: 'Console log snippet' }
  ])
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editSnippet, setEditSnippet] = useState<Snippet | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const addSnippet = () => {
    const newSnip: Snippet = { label: '', kind: CompletionItemKind.Snippet, insertText: '', detail: '' }
    setSnippets([...snippets, newSnip])
    setEditingIdx(snippets.length)
    setEditSnippet(newSnip)
  }

  const startEdit = (idx: number) => {
    setEditingIdx(idx)
    setEditSnippet({ ...snippets[idx] })
  }

  const saveEdit = () => {
    if (editingIdx === null || !editSnippet) return
    if (!editSnippet.label.trim()) { setError('Label is required'); return }
    if (!editSnippet.insertText.trim()) { setError('Insert text is required'); return }
    setError('')
    const updated = [...snippets]
    updated[editingIdx] = editSnippet
    setSnippets(updated)
    setEditingIdx(null)
    setEditSnippet(null)
  }

  const deleteSnippet = (idx: number) => {
    setSnippets(snippets.filter((_, i) => i !== idx))
    if (editingIdx === idx) {
      setEditingIdx(null)
      setEditSnippet(null)
    }
  }

  const handleSave = async () => {
    if (!extName.trim()) { setError('Extension name is required'); return }
    if (!language.trim()) { setError('Language is required'); return }
    if (snippets.length === 0) { setError('Add at least one snippet'); return }
    setError('')
    setSaving(true)
    try {
      await onSave(extName, extDescription, extAuthor, extVersion, language, snippets)
    } catch (e: any) {
      setError('Failed to save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: '30px',
      left: '0',
      right: '0',
      bottom: '22px',
      background: 'var(--bg-secondary)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }
  }, [
    React.createElement('div', {
      key: 'header',
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border-primary)' }
    }, [
      React.createElement('h3', { key: 'title', style: { margin: 0, color: 'var(--text-primary)', fontSize: '14px' } }, 'Snippet Extension Creator'),
      React.createElement('span', { key: 'close', onClick: onClose, style: { cursor: 'pointer', fontSize: '18px', color: 'var(--text-primary)' } }, '\u00D7')
    ]),
    React.createElement('div', {
      key: 'body',
      style: { flex: 1, display: 'flex', overflow: 'hidden' }
    }, [
      React.createElement('div', {
        key: 'metadata',
        style: { width: '300px', padding: '16px', borderRight: '1px solid var(--border-primary)', overflowY: 'auto', flexShrink: 0 }
      }, [
        React.createElement('h4', { style: { margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 } }, 'Extension Info'),
        React.createElement('div', { style: { marginBottom: '10px' } }, [
          React.createElement('label', { style: labelStyle }, 'Extension Name'),
          React.createElement('input', { style: inputStyle, value: extName, onChange: (e: any) => setExtName(e.target.value), placeholder: 'my-snippets' })
        ]),
        React.createElement('div', { style: { marginBottom: '10px' } }, [
          React.createElement('label', { style: labelStyle }, 'Description'),
          React.createElement('input', { style: inputStyle, value: extDescription, onChange: (e: any) => setExtDescription(e.target.value), placeholder: 'Custom snippets' })
        ]),
        React.createElement('div', { style: { marginBottom: '10px' } }, [
          React.createElement('label', { style: labelStyle }, 'Author'),
          React.createElement('input', { style: inputStyle, value: extAuthor, onChange: (e: any) => setExtAuthor(e.target.value), placeholder: 'Your name' })
        ]),
        React.createElement('div', { style: { marginBottom: '10px' } }, [
          React.createElement('label', { style: labelStyle }, 'Version'),
          React.createElement('input', { style: inputStyle, value: extVersion, onChange: (e: any) => setExtVersion(e.target.value), placeholder: '1.0.0' })
        ]),
        React.createElement('div', { style: { marginBottom: '10px' } }, [
          React.createElement('label', { style: labelStyle }, 'Language ID'),
          React.createElement('input', { style: inputStyle, value: language, onChange: (e: any) => setLanguage(e.target.value), placeholder: 'javascript' })
        ]),
        error && React.createElement('div', { style: { color: '#f44336', fontSize: '12px', marginTop: '8px' } }, error),
        React.createElement('button', {
          onClick: handleSave,
          disabled: saving,
          style: { ...btnStyle, background: 'var(--accent)', width: '100%', marginTop: '16px', opacity: saving ? 0.7 : 1 }
        }, saving ? 'Saving...' : 'Generate & Save Extension')
      ]),
      React.createElement('div', {
        key: 'snippets',
        style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }
      }, [
        React.createElement('div', {
          style: { padding: '10px 16px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          React.createElement('h4', { style: { margin: 0, color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 } }, 'Snippets (' + snippets.length + ')'),
          React.createElement('button', { onClick: addSnippet, style: { ...btnStyle, background: 'var(--accent)' } }, '+ Add Snippet')
        ]),
        React.createElement('div', {
          style: { flex: 1, overflowY: 'auto', padding: '10px 16px' }
        }, snippets.length === 0
          ? React.createElement('div', { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' } }, 'No snippets yet. Click "+ Add Snippet" to create one.')
          : snippets.map((snip, idx) =>
            React.createElement('div', {
              key: idx,
              style: {
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                padding: '10px 12px',
                marginBottom: '8px',
                border: editingIdx === idx ? '1px solid var(--accent)' : '1px solid var(--border-primary)'
              }
            }, editingIdx === idx && editSnippet
              ? React.createElement('div', null, [
                  React.createElement('div', { style: { marginBottom: '8px' } }, [
                    React.createElement('label', { style: labelStyle }, 'Label'),
                    React.createElement('input', { style: inputStyle, value: editSnippet.label, onChange: (e: any) => setEditSnippet({ ...editSnippet, label: e.target.value }), placeholder: 'mySnippet' })
                  ]),
                  React.createElement('div', { style: { marginBottom: '8px' } }, [
                    React.createElement('label', { style: labelStyle }, 'Kind'),
                    React.createElement('select', {
                      style: inputStyle,
                      value: editSnippet.kind,
                      onChange: (e: any) => setEditSnippet({ ...editSnippet, kind: Number(e.target.value) })
                    }, Object.entries(KIND_NAMES).map(([val, name]) =>
                      React.createElement('option', { key: val, value: val }, name)
                    ))
                  ]),
                  React.createElement('div', { style: { marginBottom: '8px' } }, [
                    React.createElement('label', { style: labelStyle }, 'Insert Text'),
                    React.createElement('textarea', {
                      style: { ...inputStyle, minHeight: '60px', resize: 'vertical', fontFamily: 'monospace' },
                      value: editSnippet.insertText,
                      onChange: (e: any) => setEditSnippet({ ...editSnippet, insertText: e.target.value }),
                      placeholder: 'console.log(\"text\")'
                    })
                  ]),
                  React.createElement('div', { style: { marginBottom: '8px' } }, [
                    React.createElement('label', { style: labelStyle }, 'Detail (description)'),
                    React.createElement('input', { style: inputStyle, value: editSnippet.detail, onChange: (e: any) => setEditSnippet({ ...editSnippet, detail: e.target.value }), placeholder: 'Log to console' })
                  ]),
                  React.createElement('div', { style: { display: 'flex', gap: '8px' } }, [
                    React.createElement('button', { onClick: saveEdit, style: { ...btnStyle, background: '#4caf50' } }, 'Save'),
                    React.createElement('button', { onClick: () => { setEditingIdx(null); setEditSnippet(null) }, style: { ...btnStyle, background: 'var(--border-secondary)' } }, 'Cancel'),
                    React.createElement('button', { onClick: () => deleteSnippet(idx), style: { ...btnStyle, background: '#f44336' } }, 'Delete')
                  ])
                ])
              : React.createElement('div', null, [
                  React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }, onClick: () => startEdit(idx) }, [
                    React.createElement('div', null, [
                      React.createElement('span', { style: { color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px' } }, snip.label || 'untitled'),
                      React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '11px', marginLeft: '8px' } }, KIND_NAMES[snip.kind] || 'Text'),
                    ]),
                    React.createElement('span', { style: { color: 'var(--text-secondary)', fontSize: '11px' } }, snip.detail)
                  ]),
                  snip.insertText && React.createElement('div', {
                    style: { color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace', marginTop: '4px', padding: '4px 6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                  }, snip.insertText)
                ])
            )
          )
        )
      ])
    ])
  ])
}

export default SnippetManager
