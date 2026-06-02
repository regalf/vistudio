import React, { useMemo, useRef, useEffect } from 'react'
import { parse } from 'marked'

interface MarkdownPreviewProps {
  content: string
}

function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    try {
      return parse(content || '', { async: false }) as string
    } catch {
      return '<p>Failed to render Markdown</p>'
    }
  }, [content])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handler = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null
      while (target && target.tagName !== 'A') {
        target = target.parentElement
      }
      if (!target) return
      const anchor = target as HTMLAnchorElement
      const href = anchor.getAttribute('href')
      if (!href) return
      if (href.startsWith('http://') || href.startsWith('https://')) {
        e.preventDefault()
        window.electronAPI?.util?.openExternal(href)
      }
    }

    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [])

  return React.createElement('div', {
    ref: containerRef,
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
