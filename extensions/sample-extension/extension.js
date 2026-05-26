function activate(context, vscode) {
  console.log('[SAMPLE] Extension activated')

  var helloCmd = vscode.commands.registerCommand('sample.helloWorld', function() {
    vscode.window.showInformationMessage('Hello from ViStudio Extension!')
  })

  var lang = vscode.languages.registerLanguage({
    id: 'samplelang',
    extensions: ['.sample'],
    aliases: ['Sample Language']
  })

  context.subscriptions.push(helloCmd)
  context.subscriptions.push(lang)

  console.log('[SAMPLE] Extension ready')
}

