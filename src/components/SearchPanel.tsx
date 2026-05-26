import React, { useState, useRef, useCallback, useEffect } from 'react'

interface SearchResult {
  file: string
  line: number
  column: number
  match: string
  context: string
}

interface SearchPanelProps {
  folderPath: string | null
  fsAPI: any
  onFileClick: (path: string, line?: number) => void
  onClose: () => void
}

const MAX_RESULTS = 200
const BATCH_SIZE = 10

function fuzzyMatchFile(query: string, filename: string): { match: boolean; score: number } {
  if (!query) return { match: true, score: 0 }
  const lowerQuery = query.toLowerCase()
  const lowerFile = filename.toLowerCase()
  
  let queryIdx = 0
  let fileIdx = 0
  let score = 0
  let lastMatchIdx = -1
  
  while (queryIdx < lowerQuery.length && fileIdx < lowerFile.length) {
    if (lowerQuery[queryIdx] === lowerFile[fileIdx]) {
      if (lastMatchIdx === fileIdx - 1) score += 2
      else if (fileIdx > 0 && lowerFile[fileIdx - 1] === '/') score += 1
      else if (fileIdx > 0 && lowerFile[fileIdx - 1] === '.') score += 1
      else score += 0.5
      
      lastMatchIdx = fileIdx
      queryIdx++
    }
    fileIdx++
  }
  
  if (queryIdx === lowerQuery.length) {
    if (lowerFile.startsWith(lowerQuery)) score += 10
    if (lowerFile.endsWith(lowerQuery)) score += 5
    return { match: true, score }
  }
  
  return { match: false, score: 0 }
}

const SearchPanel: React.FC<SearchPanelProps> = ({ folderPath, fsAPI, onFileClick, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [replaceQuery, setReplaceQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [fileResults, setFileResults] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchStatus, setSearchStatus] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [matchCase, setMatchCase] = useState(false)
  const [matchWholeWord, setMatchWholeWord] = useState(false)
  const [excludePattern, setExcludePattern] = useState('**/node_modules,**/.git,**/dist,**/build')
  const [showReplace, setShowReplace] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchMode, setSearchMode] = useState<'content' | 'filename'>('content')
  
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef(false)

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus()
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]')
      if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const shouldExclude = useCallback((filePath: string): boolean => {
    if (!excludePattern) return false
    const patterns = excludePattern.split(',').map(p => p.trim())
    const relativePath = filePath.replace(folderPath + '/', '')
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'))
      return regex.test(relativePath)
    })
  }, [excludePattern, folderPath])

  const searchInFile = async (filePath: string, query: string): Promise<SearchResult[]> => {
    try {
      const result = await fsAPI.readFile(filePath)
      if (!result.success || !result.content) return []

      const lines = result.content.split('\n')
      const fileResults: SearchResult[] = []

      let searchPattern: RegExp
      if (useRegex) {
        const flags = matchCase ? 'g' : 'gi'
        try {
          searchPattern = new RegExp(query, flags)
        } catch {
          return []
        }
      } else {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = matchWholeWord ? `\\b${escaped}\\b` : escaped
        const flags = matchCase ? 'g' : 'gi'
        searchPattern = new RegExp(pattern, flags)
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const matches = line.match(searchPattern)
        if (matches) {
          for (const match of matches) {
            const index = line.indexOf(match)
            fileResults.push({
              file: filePath,
              line: i + 1,
              column: index + 1,
              match,
              context: line.trim().substring(0, 150)
            })
          }
        }
      }

      return fileResults
    } catch {
      return []
    }
  }

  const collectFiles = async (dirPath: string): Promise<string[]> => {
    try {
      const result = await fsAPI.readDir(dirPath)
      if (!result.success || !result.items) return []

      let files: string[] = []
      for (const item of result.items) {
        if (shouldExclude(item.path)) continue
        if (item.isDirectory) {
          const subFiles = await collectFiles(item.path)
          files = files.concat(subFiles)
        } else {
          files.push(item.path)
        }
      }
      return files
    } catch {
      return []
    }
  }

  const searchFilesByName = async (query: string) => {
    const allFiles = await collectFiles(folderPath!)
    const matches = allFiles
      .map(file => ({
        path: file,
        ...fuzzyMatchFile(query, file.replace(folderPath + '/', ''))
      }))
      .filter(f => f.match)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(f => f.path)
    
    setFileResults(matches)
    setSearchStatus(`Found ${matches.length} files`)
  }

  const handleSearch = async () => {
    if (!searchQuery || !folderPath || isSearching) return

    abortRef.current = false
    setIsSearching(true)
    setResults([])
    setFileResults([])
    
    if (searchMode === 'filename') {
      setSearchStatus('Searching files...')
      await searchFilesByName(searchQuery)
      setIsSearching(false)
      return
    }

    setSearchStatus('Searching...')

    try {
      const allFiles = await collectFiles(folderPath)
      setSearchStatus(`Scanning ${allFiles.length} files...`)

      let allResults: SearchResult[] = []
      let processedCount = 0

      for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
        if (abortRef.current) break

        const batch = allFiles.slice(i, i + BATCH_SIZE)
        const batchResults = await Promise.all(
          batch.map(filePath => searchInFile(filePath, searchQuery))
        )

        batchResults.forEach(fileResults => {
          allResults = allResults.concat(fileResults)
        })

        processedCount += batch.length
        setSearchStatus(`Scanned ${processedCount}/${allFiles.length} files...`)

        if (allResults.length >= MAX_RESULTS) {
          allResults = allResults.slice(0, MAX_RESULTS)
          break
        }

        await new Promise(resolve => setTimeout(resolve, 0))
      }

      setResults(allResults)
      setSearchStatus(allResults.length >= MAX_RESULTS 
        ? `Found ${MAX_RESULTS}+ results (limited)`
        : `Found ${allResults.length} results`)
    } catch (error) {
      console.error('Search error:', error)
      setSearchStatus('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleCancel = () => {
    abortRef.current = true
    setIsSearching(false)
    setSearchStatus('Search cancelled')
  }

  const handleReplace = async (result: SearchResult) => {
    try {
      const fileResult = await fsAPI.readFile(result.file)
      if (!fileResult.success || !fileResult.content) return

      const lines = fileResult.content.split('\n')
      const lineIndex = result.line - 1
      const line = lines[lineIndex]

      const escapedMatch = result.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escapedMatch, matchCase ? '' : 'i')
      lines[lineIndex] = line.replace(regex, replaceQuery)

      await fsAPI.writeFile(result.file, lines.join('\n'))
      
      const newResults = results.filter(
        r => !(r.file === result.file && r.line === result.line && r.match === result.match)
      )
      setResults(newResults)
    } catch (error) {
      console.error('Replace error:', error)
    }
  }

  const handleReplaceAll = async () => {
    if (!replaceQuery || results.length === 0) return

    const filesToReplace = new Map<string, SearchResult[]>()
    results.forEach(r => {
      if (!filesToReplace.has(r.file)) filesToReplace.set(r.file, [])
      filesToReplace.get(r.file)!.push(r)
    })

    for (const [filePath, fileResults] of filesToReplace) {
      try {
        const fileResult = await fsAPI.readFile(filePath)
        if (!fileResult.success || !fileResult.content) continue

        let content = fileResult.content
        const sortedResults = [...fileResults].sort((a, b) => b.line - a.line)

        for (const r of sortedResults) {
          const lines = content.split('\n')
          const lineIndex = r.line - 1
          const line = lines[lineIndex]
          const escapedMatch = r.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(escapedMatch, matchCase ? '' : 'i')
          lines[lineIndex] = line.replace(regex, replaceQuery)
          content = lines.join('\n')
        }

        await fsAPI.writeFile(filePath, content)
      } catch (error) {
        console.error('Replace all error:', error)
      }
    }

    setResults([])
    setSearchStatus('Replace complete')
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        onFileClick(results[selectedIndex].file, results[selectedIndex].line)
        onClose()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [results, selectedIndex, onFileClick, onClose])

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 2000,
      display: 'flex',
      justifyContent: 'center',
      paddingTop: '40px'
    },
    onClick: onClose
  }, [
    React.createElement('div', {
      key: 'panel',
      style: {
        width: '950px',
        maxWidth: '90vw',
        height: 'fit-content',
        maxHeight: '850px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: '8px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      },
      onClick: (e: any) => e.stopPropagation()
    }, [
      React.createElement('div', {
        key: 'input-container',
        style: {
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }
      }, [
        React.createElement('div', {
          key: 'search-row',
          style: { display: 'flex', alignItems: 'center', gap: '10px' }
        }, [
          React.createElement('span', {
            key: 'icon',
            style: { fontSize: '20px', color: 'var(--text-secondary)' }
          }, searchMode === 'filename' ? '📁' : '🔍'),
          React.createElement('input', {
            ref: inputRef as any,
            type: 'text',
            value: searchQuery,
            onChange: (e: any) => setSearchQuery(e.target.value),
            onKeyDown: (e: any) => {
              if (e.key === 'Enter') handleSearch()
              else handleKeyDown(e)
            },
            placeholder: searchMode === 'filename' ? 'Search files by name...' : 'Search across files...',
            style: {
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '18px',
              outline: 'none'
            }
          }),
          isSearching 
            ? React.createElement('button', {
                key: 'cancel-btn',
                onClick: handleCancel,
                style: {
                    background: 'var(--danger)',
                  border: 'none',
                  color: 'var(--text-active)',
                  padding: '6px 10px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }
              }, 'Cancel')
            : React.createElement('span', {
                key: 'status',
                style: {               color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }
              }, searchStatus || `${searchMode === 'filename' ? fileResults.length : results.length} results`)
        ]),

        React.createElement('div', {
          key: 'mode-toggle',
          style: { display: 'flex', gap: '4px', paddingLeft: '30px', marginBottom: '6px' }
        }, [
          React.createElement('button', {
            onClick: () => {
              setSearchMode('content')
              setResults([])
              setFileResults([])
              setSearchStatus('')
            },
            style: {
              background: searchMode === 'content' ? 'var(--bg-active)' : 'transparent',
              border: 'none',
              color: searchMode === 'content' ? 'var(--text-active)' : 'var(--text-secondary)',
              padding: '4px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '2px'
            }
          }, 'Content'),
          React.createElement('button', {
            onClick: () => {
              setSearchMode('filename')
              setResults([])
              setFileResults([])
              setSearchStatus('')
            },
            style: {
              background: searchMode === 'filename' ? 'var(--bg-active)' : 'transparent',
              border: 'none',
              color: searchMode === 'filename' ? 'var(--text-active)' : 'var(--text-secondary)',
              padding: '4px 12px',
              fontSize: '13px',
              cursor: 'pointer',
              borderRadius: '2px'
            }
          }, 'File Name')
        ]),

        showReplace && searchMode === 'content' && React.createElement('div', {
          key: 'replace-row',
          style: { display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '30px' }
        }, [
          React.createElement('span', {
            key: 'replace-icon',
            style: { fontSize: '16px', color: 'var(--text-secondary)' }
          }, '↔'),
          React.createElement('input', {
            type: 'text',
            value: replaceQuery,
            onChange: (e: any) => setReplaceQuery(e.target.value),
            placeholder: 'Replace with...',
            style: {
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '16px',
              outline: 'none'
            }
          }),
          React.createElement('button', {
            onClick: handleReplaceAll,
            disabled: !replaceQuery || results.length === 0,
            style: {
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--text-active)',
              padding: '4px 10px',
              fontSize: '12px',
              cursor: !replaceQuery || results.length === 0 ? 'not-allowed' : 'pointer',
              borderRadius: '2px',
              opacity: !replaceQuery || results.length === 0 ? 0.5 : 1
            }
          }, 'All')
        ]),

        React.createElement('div', {
          key: 'options',
          style: { display: 'flex', gap: '14px', alignItems: 'center', fontSize: '13px',               color: 'var(--text-secondary)', paddingLeft: '30px' }
        }, searchMode === 'content' ? [
          React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } }, [
            React.createElement('input', { type: 'checkbox', checked: useRegex, onChange: (e: any) => setUseRegex(e.target.checked), style: { margin: 0 } }),
            '.*'
          ]),
          React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } }, [
            React.createElement('input', { type: 'checkbox', checked: matchCase, onChange: (e: any) => setMatchCase(e.target.checked), style: { margin: 0 } }),
            'Aa'
          ]),
          React.createElement('label', { style: { display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } }, [
            React.createElement('input', { type: 'checkbox', checked: matchWholeWord, onChange: (e: any) => setMatchWholeWord(e.target.checked), style: { margin: 0 } }),
            'ab'
          ]),
          React.createElement('button', {
            onClick: () => setShowReplace(!showReplace),
            style: {
              background: 'none',
              border: 'none',
              color: showReplace ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '0'
            }
          }, showReplace ? 'Hide Replace' : 'Replace')
        ] : [
          React.createElement('span', { key: 'hint', style: { opacity: 0.7, fontSize: '13px' } }, 'Fuzzy match on file names')
        ])
      ]),

      React.createElement('div', {
        ref: listRef as any,
        key: 'list',
        style: {
          maxHeight: '700px',
          overflowY: 'auto',
          padding: '4px 0'
        }
      }, searchMode === 'filename'
        ? fileResults.length === 0 && !isSearching && searchQuery
        ? React.createElement('div', {
            key: 'empty',
            style: { padding: '16px', textAlign: 'center',               color: 'var(--text-secondary)', fontSize: '14px' }
          }, 'No files found')
        : fileResults.length === 0 && !searchQuery
        ? React.createElement('div', {
            key: 'hint',
            style: { padding: '16px', textAlign: 'center',               color: 'var(--text-secondary)', fontSize: '14px' }
          }, 'Type to search files by name')
          : fileResults.map((filePath, idx) => {
              const relativePath = filePath.replace(folderPath + '/', '')
              return React.createElement('div', {
                key: filePath,
                'data-selected': idx === selectedIndex,
                onClick: () => {
                  onFileClick(filePath)
                  onClose()
                },
                onMouseEnter: () => setSelectedIndex(idx),
                style: {
                  padding: '6px 14px',
                  background: idx === selectedIndex ? 'var(--bg-active)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  color: idx === selectedIndex ? 'var(--text-active)' : 'var(--text-primary)',
                  borderBottom: '1px solid var(--bg-tertiary)'
                }
              }, [
                React.createElement('span', {
                  key: 'icon',
                  style: { fontSize: '16px', opacity: 0.7 }
                }, '📄'),
                React.createElement('span', {
                  key: 'path',
                  style: { fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }
                }, relativePath)
              ])
            })
        : results.length === 0 && !isSearching && searchQuery
          ? React.createElement('div', {
              key: 'empty',
              style: { padding: '16px', textAlign: 'center',               color: 'var(--text-secondary)', fontSize: '14px' }
            }, 'No results found')
          : results.length === 0 && !searchQuery
          ? React.createElement('div', {
              key: 'hint',
              style: { padding: '16px', textAlign: 'center',               color: 'var(--text-secondary)', fontSize: '14px' }
            }, 'Type to search across files')
          : results.map((result, idx) =>
            React.createElement('div', {
              key: `${result.file}-${result.line}-${idx}`,
              'data-selected': idx === selectedIndex,
              onClick: () => {
                onFileClick(result.file, result.line)
                onClose()
              },
              onMouseEnter: () => setSelectedIndex(idx),
              style: {
                padding: '6px 14px',
                background: idx === selectedIndex ? 'var(--bg-active)' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: idx === selectedIndex ? 'var(--text-active)' : 'var(--text-primary)',
                borderBottom: '1px solid var(--bg-tertiary)'
              }
            }, [
              React.createElement('div', {
                key: 'left',
                style: { display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden', flex: 1 }
              }, [
                React.createElement('span', {
                  key: 'file',
                  style: { fontSize: '13px', opacity: 0.7, minWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                }, result.file.replace(folderPath + '/', '')),
                React.createElement('span', {
                  key: 'line',
                  style: { fontSize: '12px', opacity: 0.5, minWidth: '50px' }
                }, `Ln ${result.line}`),
                React.createElement('span', {
                  key: 'context',
                  style: { fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                }, result.context)
              ]),
              showReplace && React.createElement('button', {
                key: 'replace-btn',
                onClick: (e: any) => {
                  e.stopPropagation()
                  handleReplace(result)
                },
                style: {
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '0 6px',
                  marginLeft: '10px'
                }
              }, '→')
            ])
          )
      ),

      React.createElement('div', {
        key: 'footer',
        style: {
          padding: '6px 14px',
          borderTop: '1px solid var(--border-primary)',
          display: 'flex',
          gap: '14px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }
      }, [
        React.createElement('span', { key: 'nav' }, '↑↓ navigate'),
        React.createElement('span', { key: 'select' }, '↵ select'),
        React.createElement('span', { key: 'close' }, 'esc close'),
        React.createElement('span', { key: 'mode', style: { marginLeft: 'auto', fontSize: '12px' } }, 
          searchMode === 'filename' ? 'File Name Search' : 'Content Search')
      ])
    ])
  ])
}

export default SearchPanel
