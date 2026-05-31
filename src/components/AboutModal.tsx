import React from 'react'

interface AboutModalProps {
  onClose: () => void
  version: string
}

const AboutModal: React.FC<AboutModalProps> = ({ onClose, version }) => {

  return React.createElement('div', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }
  }, [
    React.createElement('div', {
      style: {
        background: 'var(--bg-secondary)', borderRadius: '10px', width: '380px',
        border: '1px solid var(--border-primary)', overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }
    }, [
      React.createElement('div', {
        style: { padding: '28px 24px 20px', textAlign: 'center' }
      }, [
        React.createElement('img', {
          src: '/icons/logo.svg',
          style: { width: '64px', height: '64px', marginBottom: '12px', display: 'inline-block' }
        }),
        React.createElement('h2', {
          style: { margin: '0 0 2px', fontSize: '22px', fontWeight: 700, color: 'var(--text-active)', letterSpacing: '-0.5px' }
        }, 'ViStudio'),
        React.createElement('p', {
          style: { margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }
        }, `v${version}`),
        React.createElement('div', {
          style: { fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '20px' }
        }, [
          React.createElement('div', null, 'A modern, extensible code editor'),
          React.createElement('div', null, 'Built with Electron + React + TypeScript'),
          React.createElement('div', { style: { marginTop: '8px', color: 'var(--accent)' } },
            '\u00A9 2026 regalf'
          )
        ])
      ]),
      React.createElement('div', {
        style: { padding: '12px 24px', borderTop: '1px solid var(--border-primary)', textAlign: 'right' }
      }, [
        React.createElement('button', {
          onClick: onClose,
          style: {
            padding: '6px 20px', background: 'var(--accent)', border: 'none',
            color: 'white', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600
          }
        }, 'OK')
      ])
    ])
  ])
}

export default AboutModal
