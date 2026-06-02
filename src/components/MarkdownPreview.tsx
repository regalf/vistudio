import React, { useMemo } from 'react'
import { parse } from 'marked'

interface MarkdownPreviewProps {
  content: string
}

function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const html = useMemo(() => {
    try {
      return parse(content || '', { async: false }) as string
    } catch {
      return '<p>Failed to render Markdown</p>'
    }
  }, [content])

  return React.createElement('div', {
    className: 'markdown-preview',
    style: {
      padding: '24px 32px',
      overflowY: 'auto',
      height: '100%',
      boxSizing: 'border-box',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontSize: '15px',
      lineHeight: '1.7'
    },
    dangerouslySetInnerHTML: { __html: html }
  })
}

export default MarkdownPreview
