import { CompletionItemKind } from '../types/extension'

interface Snippet {
  label: string
  kind: CompletionItemKind
  insertText: string
  detail: string
}

export function generateExtensionFiles(
  extName: string,
  extDescription: string,
  extAuthor: string,
  extVersion: string,
  language: string,
  snippets: Snippet[]
): { 'extension.json': string; 'extension.js': string } {
  const manifest = {
    name: extName,
    version: extVersion,
    description: extDescription,
    author: extAuthor || undefined,
    main: 'extension.js',
    activationEvents: ['*'],
    contributes: {
      languages: [
        {
          id: language,
          extensions: ['.' + language.replace(/.*\./, '')],
          aliases: [language.charAt(0).toUpperCase() + language.slice(1)]
        }
      ] as any[]
    }
  }

  const snippetItems = snippets.map(s => ({
    label: s.label,
    kind: s.kind,
    insertText: s.insertText,
    detail: s.detail
  }))

  const snippetItemsJSON = JSON.stringify(snippetItems, null, 2)

  const extensionCode = `function activate(context, vscode) {
  console.log('[${extName}] Extension activated')

  var snippets = ${snippetItemsJSON}

  var lang = vscode.languages.registerLanguage({
    id: '${language}',
    extensions: ['.${language.replace(/.*\./, '')}'],
    aliases: ['${language.charAt(0).toUpperCase() + language.slice(1)}']
  })

  var provider = vscode.languages.registerCompletionProvider('${language}', {
    provideCompletionItems: function(document, position) {
      var items = []
      for (var i = 0; i < snippets.length; i++) {
        items.push({
          label: snippets[i].label,
          kind: snippets[i].kind,
          insertText: snippets[i].insertText,
          detail: snippets[i].detail
        })
      }
      return items
    }
  })

  context.subscriptions.push(lang)
  context.subscriptions.push(provider)

  console.log('[${extName}] ${snippets.length} snippets registered')
}
`

  return {
    'extension.json': JSON.stringify(manifest, null, 2),
    'extension.js': extensionCode
  }
}

export function getExtensionId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
}
