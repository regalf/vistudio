function activate(context, vscode) {
  console.log('[MARKDOWN-SUPPORT] Extension activated')

  // ===== LANGUAGE DEFINITION =====
  var lang = vscode.languages.registerLanguage({
    id: 'markdown',
    extensions: ['.md', '.mdx', '.markdown'],
    aliases: ['Markdown'],
    keywords: [
      // Headings
      '#', '##', '###', '####', '#####', '######',
      // Text formatting
      '**', '*', '~~', '`', '```',
      // List markers
      '-', '*', '+',
      // Links & images
      '[', ']', '(', ')', '![', '](', '![](', ')(',
      // Blockquotes
      '>',
      // Tables
      '|', ':-', '-:', ':-:',
      // Task lists
      '[ ]', '[x]',
      // Code fences
      '```', '~~~',
      // Horizontal rules
      '---', '***', '___',
      // Footnotes
      '[^',
      // Definition lists
      ':',
      // Strikethrough
      '~',
      // Highlight
      '==',
      // Subscript / superscript
      '~', '^',
      // Emoji shortcodes
      ':',
      // Math
      '$', '$$'
    ],
    operators: [
      '=>', '->', '|>', '<|'
    ],
    symbols: [
      '{', '}', '(', ')', '[', ']', '<', '>', ':', ';', ',', '.', '!', '?', '"', "'", '|', '/', '\\', '@', '&', '%', '^', '~', '=', '+', '-', '*', '_'
    ],
    builtins: [
      // Common HTML elements used in Markdown
      'div', 'span', 'p', 'br', 'hr',
      'strong', 'em', 'del', 'ins', 'sub', 'sup', 'mark', 'small',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'a', 'img', 'figure', 'figcaption',
      'pre', 'code', 'kbd', 'samp', 'var',
      'blockquote', 'cite', 'q', 'abbr', 'dfn',
      'details', 'summary',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'section', 'article', 'nav', 'aside', 'header', 'footer', 'main',
      'style', 'script', 'link', 'meta',
      'input', 'label', 'textarea', 'select', 'button', 'form'
    ]
  })

  // ===== SEMANTIC TOKEN HIGHLIGHTING =====
  var highlightRules = vscode.languages.registerTokenHighlighter('markdown', [
    // Heading markers
    { match: /^#{1,6}\s/g, color: 'C586C0' },
    // Heading text (after #)
    { match: /^#{1,6}\s+.+/g, color: 'DCDCAA' },
    // Bold (**text** or __text__)
    { match: /\*\*[^*]+\*\*/g, color: 'CE9178' },
    { match: /__[^_]+__/g, color: 'CE9178' },
    // Italic (*text* or _text_)
    { match: /\*[^*]+\*/g, color: '569CD6' },
    { match: /_[^_]+_/g, color: '569CD6' },
    // Strikethrough
    { match: /~~[^~]+~~/g, color: '858585' },
    // Inline code
    { match: /`[^`]+`/g, color: 'CE9178' },
    // Code fence start
    { match: /^```[a-zA-Z0-9+#.]*/g, color: '6A9955' },
    { match: /^~~~[a-zA-Z0-9+#.]*/g, color: '6A9955' },
    // Code fence end
    { match: /^```$/g, color: '6A9955' },
    { match: /^~~~$/g, color: '6A9955' },
    // Links [text](url)
    { match: /\[([^\]]+)\]\(([^)]+)\)/g, color: '569CD6' },
    // Images ![alt](url)
    { match: /!\[([^\]]*)\]\(([^)]+)\)/g, color: 'CE9178' },
    // Reference links [text][ref]
    { match: /\[([^\]]+)\]\[([^\]]*)\]/g, color: '569CD6' },
    // Reference definitions [ref]: url
    { match: /^\[.+\]:\s*.+/g, color: '6A9955' },
    // Blockquotes
    { match: /^>\s/g, color: '6A9955' },
    { match: /^>>\s/g, color: '6A9955' },
    // Lists bullets
    { match: /^[\s]*[-*+]\s/g, color: 'DCDCAA' },
    // Ordered lists
    { match: /^[\s]*\d+\.\s/g, color: 'DCDCAA' },
    // Task lists - unchecked
    { match: /- \[ \]/g, color: '858585' },
    // Task lists - checked
    { match: /- \[[xX]\]/g, color: '6A9955' },
    // Tables - header separators
    { match: /^\|.+\|$/g, color: 'D4D4D4' },
    // Horizontal rules
    { match: /^---$/g, color: '858585' },
    { match: /^\*\*\*$/g, color: '858585' },
    { match: /^___$/g, color: '858585' },
    // HTML tags
    { match: /<\/?[a-zA-Z][^>]*>/g, color: '569CD6' },
    // Footnote references [^label]
    { match: /\[\^[^\]]+\]/g, color: 'CE9178' },
    // Highlight ==text==
    { match: /==[^=]+==/g, color: 'DCDCAA' },
    // URL auto-links
    { match: /<https?:\/\/[^>]+>/g, color: '569CD6' },
    // Email auto-links
    { match: /<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>/g, color: '569CD6' },
    // Plain URLs
    { match: /https?:\/\/[^\s<>"]+/g, color: '569CD6' },
  ])

  // ===== COMPLETION PROVIDER =====
  var mdProvider = vscode.languages.registerCompletionProvider('markdown', {
    provideCompletionItems: function(document, position) {
      var items = []

      // Heading snippets
      var headings = [
        { label: 'h1', kind: vscode.CompletionItemKind.Snippet, insertText: '# Heading 1\n\n', detail: 'Heading 1' },
        { label: 'h2', kind: vscode.CompletionItemKind.Snippet, insertText: '## Heading 2\n\n', detail: 'Heading 2' },
        { label: 'h3', kind: vscode.CompletionItemKind.Snippet, insertText: '### Heading 3\n\n', detail: 'Heading 3' },
        { label: 'h4', kind: vscode.CompletionItemKind.Snippet, insertText: '#### Heading 4\n\n', detail: 'Heading 4' },
        { label: 'h5', kind: vscode.CompletionItemKind.Snippet, insertText: '##### Heading 5\n\n', detail: 'Heading 5' },
        { label: 'h6', kind: vscode.CompletionItemKind.Snippet, insertText: '###### Heading 6\n\n', detail: 'Heading 6' },
      ]

      // Text formatting snippets
      var format = [
        { label: 'bold', kind: vscode.CompletionItemKind.Snippet, insertText: '**text**', detail: 'Bold text' },
        { label: 'italic', kind: vscode.CompletionItemKind.Snippet, insertText: '*text*', detail: 'Italic text' },
        { label: 'strikethrough', kind: vscode.CompletionItemKind.Snippet, insertText: '~~text~~', detail: 'Strikethrough text' },
        { label: 'code', kind: vscode.CompletionItemKind.Snippet, insertText: '`code`', detail: 'Inline code' },
        { label: 'highlight', kind: vscode.CompletionItemKind.Snippet, insertText: '==text==', detail: 'Highlighted text' },
        { label: 'subscript', kind: vscode.CompletionItemKind.Snippet, insertText: '~text~', detail: 'Subscript' },
        { label: 'superscript', kind: vscode.CompletionItemKind.Snippet, insertText: '^text^', detail: 'Superscript' },
      ]

      // Link snippets
      var links = [
        { label: 'link', kind: vscode.CompletionItemKind.Snippet, insertText: '[text](url)', detail: 'Hyperlink' },
        { label: 'link-ref', kind: vscode.CompletionItemKind.Snippet, insertText: '[text][ref]', detail: 'Reference link' },
        { label: 'link-ref-def', kind: vscode.CompletionItemKind.Snippet, insertText: '[ref]: url "title"', detail: 'Reference definition' },
        { label: 'image', kind: vscode.CompletionItemKind.Snippet, insertText: '![alt](url)', detail: 'Image' },
        { label: 'image-ref', kind: vscode.CompletionItemKind.Snippet, insertText: '![alt][ref]', detail: 'Reference image' },
        { label: 'autolink', kind: vscode.CompletionItemKind.Snippet, insertText: '<url>', detail: 'Auto-link URL' },
        { label: 'email', kind: vscode.CompletionItemKind.Snippet, insertText: '<email@example.com>', detail: 'Email link' },
        { label: 'footnote', kind: vscode.CompletionItemKind.Snippet, insertText: '[^label]', detail: 'Footnote reference' },
        { label: 'footnote-def', kind: vscode.CompletionItemKind.Snippet, insertText: '[^label]: Footnote text', detail: 'Footnote definition' },
      ]

      // Code snippets
      var code = [
        { label: 'codeblock', kind: vscode.CompletionItemKind.Snippet, insertText: '```language\ncode\n```\n', detail: 'Fenced code block' },
        { label: 'codeblock-tilde', kind: vscode.CompletionItemKind.Snippet, insertText: '~~~language\ncode\n~~~\n', detail: 'Tilde code block' },
        { label: 'codeblock-js', kind: vscode.CompletionItemKind.Snippet, insertText: '```javascript\ncode\n```\n', detail: 'JavaScript code block' },
        { label: 'codeblock-py', kind: vscode.CompletionItemKind.Snippet, insertText: '```python\ncode\n```\n', detail: 'Python code block' },
        { label: 'codeblock-ts', kind: vscode.CompletionItemKind.Snippet, insertText: '```typescript\ncode\n```\n', detail: 'TypeScript code block' },
        { label: 'codeblock-html', kind: vscode.CompletionItemKind.Snippet, insertText: '```html\ncode\n```\n', detail: 'HTML code block' },
        { label: 'codeblock-css', kind: vscode.CompletionItemKind.Snippet, insertText: '```css\ncode\n```\n', detail: 'CSS code block' },
        { label: 'codeblock-json', kind: vscode.CompletionItemKind.Snippet, insertText: '```json\ncode\n```\n', detail: 'JSON code block' },
        { label: 'codeblock-bash', kind: vscode.CompletionItemKind.Snippet, insertText: '```bash\ncode\n```\n', detail: 'Bash code block' },
        { label: 'codeblock-c', kind: vscode.CompletionItemKind.Snippet, insertText: '```c\ncode\n```\n', detail: 'C code block' },
        { label: 'codeblock-cpp', kind: vscode.CompletionItemKind.Snippet, insertText: '```cpp\ncode\n```\n', detail: 'C++ code block' },
        { label: 'codeblock-yaml', kind: vscode.CompletionItemKind.Snippet, insertText: '```yaml\ncode\n```\n', detail: 'YAML code block' },
        { label: 'codeblock-diff', kind: vscode.CompletionItemKind.Snippet, insertText: '```diff\ncode\n```\n', detail: 'Diff code block' },
      ]

      // List snippets
      var lists = [
        { label: 'ul', kind: vscode.CompletionItemKind.Snippet, insertText: '- item\n- item\n- item\n', detail: 'Unordered list' },
        { label: 'ol', kind: vscode.CompletionItemKind.Snippet, insertText: '1. item\n2. item\n3. item\n', detail: 'Ordered list' },
        { label: 'task', kind: vscode.CompletionItemKind.Snippet, insertText: '- [ ] task', detail: 'Unchecked task' },
        { label: 'task-done', kind: vscode.CompletionItemKind.Snippet, insertText: '- [x] task', detail: 'Checked task' },
        { label: 'tasklist', kind: vscode.CompletionItemKind.Snippet, insertText: '- [ ] Task 1\n- [ ] Task 2\n- [x] Task 3\n', detail: 'Task list' },
        { label: 'dl', kind: vscode.CompletionItemKind.Snippet, insertText: 'term\n: definition\n', detail: 'Definition list' },
      ]

      // Table snippets
      var tables = [
        { label: 'table', kind: vscode.CompletionItemKind.Snippet, insertText: '| Header 1 | Header 2 | Header 3 |\n| :--- | :---: | ---: |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n', detail: 'Markdown table' },
        { label: 'table-2', kind: vscode.CompletionItemKind.Snippet, insertText: '| Header 1 | Header 2 |\n| :--- | ---: |\n| Cell 1 | Cell 2 |\n', detail: '2-column table' },
        { label: 'table-3', kind: vscode.CompletionItemKind.Snippet, insertText: '| Header 1 | Header 2 | Header 3 |\n| :--- | :---: | ---: |\n| Cell 1 | Cell 2 | Cell 3 |\n', detail: '3-column table' },
        { label: 'table-4', kind: vscode.CompletionItemKind.Snippet, insertText: '| Header 1 | Header 2 | Header 3 | Header 4 |\n| :--- | :---: | ---: | ---: |\n| Cell 1 | Cell 2 | Cell 3 | Cell 4 |\n', detail: '4-column table' },
      ]

      // Block elements
      var blocks = [
        { label: 'blockquote', kind: vscode.CompletionItemKind.Snippet, insertText: '> text\n> text\n', detail: 'Blockquote' },
        { label: 'blockquote-nested', kind: vscode.CompletionItemKind.Snippet, insertText: '> Outer quote\n>> Nested quote\n> Back to outer\n', detail: 'Nested blockquote' },
        { label: 'hr', kind: vscode.CompletionItemKind.Snippet, insertText: '---\n\n', detail: 'Horizontal rule' },
        { label: 'hr-stars', kind: vscode.CompletionItemKind.Snippet, insertText: '***\n\n', detail: 'Horizontal rule (stars)' },
        { label: 'hr-underscore', kind: vscode.CompletionItemKind.Snippet, insertText: '___\n\n', detail: 'Horizontal rule (underscore)' },
        { label: 'details', kind: vscode.CompletionItemKind.Snippet, insertText: '<details>\n<summary>Click to expand</summary>\n\ncontent\n\n</details>\n', detail: 'Collapsible details' },
      ]

      // HTML snippets
      var html = [
        { label: 'html-comment', kind: vscode.CompletionItemKind.Snippet, insertText: '<!-- comment -->', detail: 'HTML comment' },
        { label: 'html-a', kind: vscode.CompletionItemKind.Snippet, insertText: '<a href="url">text</a>', detail: 'HTML link' },
        { label: 'html-img', kind: vscode.CompletionItemKind.Snippet, insertText: '<img src="url" alt="text" width="">', detail: 'HTML image' },
        { label: 'html-center', kind: vscode.CompletionItemKind.Snippet, insertText: '<div align="center">\n\ncontent\n\n</div>\n', detail: 'Centered content' },
        { label: 'html-right', kind: vscode.CompletionItemKind.Snippet, insertText: '<div align="right">\n\ncontent\n\n</div>\n', detail: 'Right-aligned content' },
      ]

      // Math snippets
      var math = [
        { label: 'math', kind: vscode.CompletionItemKind.Snippet, insertText: '$formula$', detail: 'Inline math' },
        { label: 'math-block', kind: vscode.CompletionItemKind.Snippet, insertText: '$$\nformula\n$$\n', detail: 'Math block' },
      ]

      // Badge / shield snippets
      var badge = [
        { label: 'badge', kind: vscode.CompletionItemKind.Snippet, insertText: '[![label](badge-url)](link)', detail: 'Shields.io badge' },
        { label: 'badge-gh', kind: vscode.CompletionItemKind.Snippet, insertText: '![GitHub stars/issues/forks](https://img.shields.io/github/user/repo)', detail: 'GitHub badge' },
      ]

      // YAML front matter
      var frontmatter = [
        { label: 'frontmatter', kind: vscode.CompletionItemKind.Snippet, insertText: '---\ntitle: Title\ndescription: Description\ndate: 2024-01-01\n---\n', detail: 'YAML front matter' },
        { label: 'frontmatter-blog', kind: vscode.CompletionItemKind.Snippet, insertText: '---\ntitle: Title\ndate: 2024-01-01\nauthor: Author\ntags: [tag1, tag2]\ncategories: [category]\ndraft: true\n---\n', detail: 'Blog front matter' },
      ]

      // TOC snippets
      var toc = [
        { label: 'toc', kind: vscode.CompletionItemKind.Snippet, insertText: '- [Section](#section)\n  - [Subsection](#subsection)\n', detail: 'Table of contents' },
      ]

      // Warning / callout snippets
      var callouts = [
        { label: 'note', kind: vscode.CompletionItemKind.Snippet, insertText: '> **Note:** text\n', detail: 'Note callout' },
        { label: 'tip', kind: vscode.CompletionItemKind.Snippet, insertText: '> **Tip:** text\n', detail: 'Tip callout' },
        { label: 'warning', kind: vscode.CompletionItemKind.Snippet, insertText: '> **Warning:** text\n', detail: 'Warning callout' },
        { label: 'danger', kind: vscode.CompletionItemKind.Snippet, insertText: '> **⚠️ Danger:** text\n', detail: 'Danger callout' },
        { label: 'info', kind: vscode.CompletionItemKind.Snippet, insertText: '> **ℹ️ Info:** text\n', detail: 'Info callout' },
        { label: 'success', kind: vscode.CompletionItemKind.Snippet, insertText: '> **✅ Success:** text\n', detail: 'Success callout' },
      ]

      // Emoji reference
      var emoji = [
        { label: 'emoji-smile', kind: vscode.CompletionItemKind.Snippet, insertText: ':smile:', detail: '😄 Smiley emoji' },
        { label: 'emoji-warn', kind: vscode.CompletionItemKind.Snippet, insertText: ':warning:', detail: '⚠️ Warning emoji' },
        { label: 'emoji-check', kind: vscode.CompletionItemKind.Snippet, insertText: ':white_check_mark:', detail: '✅ Checkmark emoji' },
        { label: 'emoji-rocket', kind: vscode.CompletionItemKind.Snippet, insertText: ':rocket:', detail: '🚀 Rocket emoji' },
        { label: 'emoji-fire', kind: vscode.CompletionItemKind.Snippet, insertText: ':fire:', detail: '🔥 Fire emoji' },
        { label: 'emoji-star', kind: vscode.CompletionItemKind.Snippet, insertText: ':star:', detail: '⭐ Star emoji' },
        { label: 'emoji-heart', kind: vscode.CompletionItemKind.Snippet, insertText: ':heart:', detail: '❤️ Heart emoji' },
        { label: 'emoji-thumbsup', kind: vscode.CompletionItemKind.Snippet, insertText: ':thumbsup:', detail: '👍 Thumbs up emoji' },
        { label: 'emoji-thumbsdown', kind: vscode.CompletionItemKind.Snippet, insertText: ':thumbsdown:', detail: '👎 Thumbs down emoji' },
        { label: 'emoji-bug', kind: vscode.CompletionItemKind.Snippet, insertText: ':bug:', detail: '🐛 Bug emoji' },
        { label: 'emoji-book', kind: vscode.CompletionItemKind.Snippet, insertText: ':book:', detail: '📖 Book emoji' },
        { label: 'emoji-pencil', kind: vscode.CompletionItemKind.Snippet, insertText: ':pencil:', detail: '📝 Pencil emoji' },
        { label: 'emoji-memo', kind: vscode.CompletionItemKind.Snippet, insertText: ':memo:', detail: '📝 Memo emoji' },
        { label: 'emoji-construction', kind: vscode.CompletionItemKind.Snippet, insertText: ':construction:', detail: '🚧 Construction emoji' },
        { label: 'emoji-sparkles', kind: vscode.CompletionItemKind.Snippet, insertText: ':sparkles:', detail: '✨ Sparkles emoji' },
      ]

      var allItems = headings.concat(format, links, code, lists, tables, blocks, html, math, badge, frontmatter, toc, callouts, emoji)
      var i
      for (i = 0; i < allItems.length; i++) {
        items.push(allItems[i])
      }

      return items
    }
  })

  // ===== COMMANDS =====

  // Markdown: Toggle Preview
  var previewCmd = vscode.commands.registerCommand('markdown.preview', function() {
    vscode.window.showInformationMessage('Toggle Markdown Preview (use the preview dropdown in the editor toolbar)')
  })

  // Markdown: Toggle Bold
  var boldCmd = vscode.commands.registerCommand('markdown.toggleBold', function() {
    var sel = vscode.editor.getActiveSelection()
    if (sel) {
      vscode.editor.replaceSelection('**' + sel + '**')
    }
  })

  // Markdown: Toggle Italic
  var italicCmd = vscode.commands.registerCommand('markdown.toggleItalic', function() {
    var sel = vscode.editor.getActiveSelection()
    if (sel) {
      vscode.editor.replaceSelection('*' + sel + '*')
    }
  })

  // Markdown: Toggle Inline Code
  var codeCmd = vscode.commands.registerCommand('markdown.toggleCode', function() {
    var sel = vscode.editor.getActiveSelection()
    if (sel) {
      vscode.editor.replaceSelection('`' + sel + '`')
    }
  })

  // Markdown: Toggle Strikethrough
  var strikeCmd = vscode.commands.registerCommand('markdown.toggleStrikethrough', function() {
    var sel = vscode.editor.getActiveSelection()
    if (sel) {
      vscode.editor.replaceSelection('~~' + sel + '~~')
    }
  })

  // Markdown: Format Table (simple alignment-based formatting)
  var tableFormatCmd = vscode.commands.registerCommand('markdown.tableFormat', function() {
    vscode.window.showInformationMessage('Table formatting: select a Markdown table and run this command')
  })

  // ===== PROJECT TEMPLATE =====
  var mdTemplate = vscode.workspace.registerProjectTemplate({
    id: 'markdown-docs',
    name: 'Markdown Documentation',
    description: 'Markdown documentation project with README, CHANGELOG, and docs folder',
    language: 'markdown',
    files: {
      'README.md': '# Project Name\n\n## Description\n\nA brief description of your project.\n\n## Installation\n\n```bash\n# Installation commands\n```\n\n## Usage\n\n```javascript\n// Usage example\n```\n\n## Contributing\n\nPull requests are welcome.\n\n## License\n\n[MIT](LICENSE)\n',
      'CHANGELOG.md': '# Changelog\n\n## [1.0.0] - 2024-01-01\n\n### Added\n\n- Initial release\n',
      'docs/index.md': '# Documentation\n\n## Getting Started\n\n## API Reference\n\n## Examples\n',
      '.vistproj': '{\n  "name": "Project Name",\n  "version": "1.0.0",\n  "description": "Documentation project",\n  "language": "markdown",\n  "entryPoint": "README.md",\n  "exclude": ["node_modules", "dist"]\n}\n'
    }
  })

  // Register all subscriptions
  context.subscriptions.push(lang)
  context.subscriptions.push(highlightRules)
  context.subscriptions.push(mdProvider)
  context.subscriptions.push(previewCmd)
  context.subscriptions.push(boldCmd)
  context.subscriptions.push(italicCmd)
  context.subscriptions.push(codeCmd)
  context.subscriptions.push(strikeCmd)
  context.subscriptions.push(tableFormatCmd)
  context.subscriptions.push(mdTemplate)

  console.log('[MARKDOWN-SUPPORT] All commands and providers registered')
}
