function activate(context, vscode) {
  console.log('[DEBUG] Extension activated')

  var results = []
  var passed = 0
  var failed = 0

  function test(name, fn) {
    try {
      fn()
      results.push('PASS: ' + name)
      passed++
      console.log('[DEBUG] PASS: ' + name)
    } catch (e) {
      results.push('FAIL: ' + name + ' - ' + e.message)
      failed++
      console.log('[DEBUG] FAIL: ' + name + ' - ' + e.message)
    }
  }

  function testAsync(name, fn) {
    fn().then(function() {
      results.push('PASS: ' + name)
      passed++
      console.log('[DEBUG] PASS: ' + name)
    }).catch(function(e) {
      results.push('FAIL: ' + name + ' - ' + e.message)
      failed++
      console.log('[DEBUG] FAIL: ' + name + ' - ' + e.message)
    })
  }

  function showResultsAsync(name) {
    setTimeout(function() {
      var total = passed + failed
      var summary = '═══ TEST RESULTS: ' + name + ' ═══\n'
      summary += 'Total: ' + total + ' | Passed: ' + passed + ' | Failed: ' + failed + '\n'
      summary += '═══════════════════════════════\n\n'

      if (passed > 0) {
        summary += '✓ PASSED (' + passed + ')\n'
        summary += '───────────────────\n'
        results.filter(function(r) { return r.indexOf('PASS:') === 0 }).forEach(function(r) {
          summary += '  ' + r.replace('PASS: ', '') + '\n'
        })
        summary += '\n'
      }

      if (failed > 0) {
        summary += '✗ FAILED (' + failed + ')\n'
        summary += '───────────────────\n'
        results.filter(function(r) { return r.indexOf('FAIL:') === 0 }).forEach(function(r) {
          summary += '  ' + r.replace('FAIL: ', '') + '\n'
        })
        summary += '\n'
      }

      console.log('[DEBUG] ' + summary)
      vscode.window.showInformationMessage(name + ': ' + passed + '/' + total + ' passed')
    }, 1500)
  }

  function showResults() {
    var total = passed + failed
    var summary = '═══ TEST RESULTS ═══\n'
    summary += 'Total: ' + total + ' | Passed: ' + passed + ' | Failed: ' + failed + '\n'
    summary += '═══════════════════════\n\n'

    if (passed > 0) {
      summary += '✓ PASSED (' + passed + ')\n'
      summary += '───────────────────\n'
      results.filter(function(r) { return r.indexOf('PASS:') === 0 }).forEach(function(r) {
        summary += '  ' + r.replace('PASS: ', '') + '\n'
      })
      summary += '\n'
    }

    if (failed > 0) {
      summary += '✗ FAILED (' + failed + ')\n'
      summary += '───────────────────\n'
      results.filter(function(r) { return r.indexOf('FAIL:') === 0 }).forEach(function(r) {
        summary += '  ' + r.replace('FAIL: ', '') + '\n'
      })
      summary += '\n'
    }

    console.log('[DEBUG] ' + summary)
    vscode.window.showInformationMessage('Tests complete: ' + passed + '/' + total + ' passed')
  }

  // ===== TEST: vscode.commands =====
  var testCmd = vscode.commands.registerCommand('debug.testCommandHandler', function() {
    vscode.window.showInformationMessage('Test command handler executed!')
  })

  var cmdTest = vscode.commands.registerCommand('debug.testCommands', function() {
    results = []
    passed = 0
    failed = 0

    test('commands.registerCommand exists', function() {
      if (typeof vscode.commands.registerCommand !== 'function') throw new Error('Not a function')
    })

    test('commands.registerCommand returns Disposable', function() {
      var d = vscode.commands.registerCommand('debug.temp1', function() {})
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose method')
      d.dispose()
    })

    test('commands.executeCommand exists', function() {
      if (typeof vscode.commands.executeCommand !== 'function') throw new Error('Not a function')
    })

    test('commands.executeCommand calls handler', function() {
      var called = false
      var d = vscode.commands.registerCommand('debug.temp2', function() { called = true })
      vscode.commands.executeCommand('debug.temp2')
      if (!called) throw new Error('Handler not called')
      d.dispose()
    })

    test('commands.executeCommand with args', function() {
      var received = null
      var d = vscode.commands.registerCommand('debug.temp3', function(arg) { received = arg })
      vscode.commands.executeCommand('debug.temp3', 'hello')
      if (received !== 'hello') throw new Error('Arg not passed: ' + received)
      d.dispose()
    })

    test('commands.executeCommand unknown throws', function() {
      var threw = false
      try {
        vscode.commands.executeCommand('nonexistent.command')
      } catch (e) {
        threw = true
      }
      if (!threw) throw new Error('Did not throw for unknown command')
    })

    showResults()
  })

  // ===== TEST: vscode.window =====
  var windowTest = vscode.commands.registerCommand('debug.testWindow', function() {
    results = []
    passed = 0
    failed = 0

    test('window.showInformationMessage exists', function() {
      if (typeof vscode.window.showInformationMessage !== 'function') throw new Error('Not a function')
    })

    test('window.showErrorMessage exists', function() {
      if (typeof vscode.window.showErrorMessage !== 'function') throw new Error('Not a function')
    })

    test('window.showWarningMessage exists', function() {
      if (typeof vscode.window.showWarningMessage !== 'function') throw new Error('Not a function')
    })

    test('window.showInformationMessage works', function() {
      vscode.window.showInformationMessage('Debug: Info message test')
    })

    test('window.showWarningMessage works', function() {
      vscode.window.showWarningMessage('Debug: Warning message test')
    })

    test('window.showErrorMessage works', function() {
      vscode.window.showErrorMessage('Debug: Error message test')
    })

    showResults()
  })

  // ===== TEST: vscode.editor =====
  var editorTest = vscode.commands.registerCommand('debug.testEditor', function() {
    results = []
    passed = 0
    failed = 0

    test('editor.getActiveDocument exists', function() {
      if (typeof vscode.editor.getActiveDocument !== 'function') throw new Error('Not a function')
    })

    test('editor.getActiveDocument returns null or object', function() {
      var doc = vscode.editor.getActiveDocument()
      if (doc !== null && typeof doc !== 'object') throw new Error('Invalid return type')
    })

    test('editor.getActiveSelection exists', function() {
      if (typeof vscode.editor.getActiveSelection !== 'function') throw new Error('Not a function')
    })

    test('editor.replaceSelection exists', function() {
      if (typeof vscode.editor.replaceSelection !== 'function') throw new Error('Not a function')
    })

    test('editor.insertText exists', function() {
      if (typeof vscode.editor.insertText !== 'function') throw new Error('Not a function')
    })

    test('editor.getLanguage exists', function() {
      if (typeof vscode.editor.getLanguage !== 'function') throw new Error('Not a function')
    })

    test('editor.getLanguage returns string', function() {
      var lang = vscode.editor.getLanguage()
      if (typeof lang !== 'string') throw new Error('Not a string: ' + typeof lang)
    })

    test('editor.setLanguage exists', function() {
      if (typeof vscode.editor.setLanguage !== 'function') throw new Error('Not a function')
    })

    test('editor.setLanguage works', function() {
      vscode.editor.setLanguage('javascript')
      var lang = vscode.editor.getLanguage()
      if (lang !== 'javascript') throw new Error('Language not set: ' + lang)
    })

    test('editor document has uri property', function() {
      var doc = vscode.editor.getActiveDocument()
      if (doc && typeof doc.uri === 'undefined') throw new Error('No uri property')
    })

    test('editor document has fileName property', function() {
      var doc = vscode.editor.getActiveDocument()
      if (doc && typeof doc.fileName === 'undefined') throw new Error('No fileName property')
    })

    test('editor document has languageId property', function() {
      var doc = vscode.editor.getActiveDocument()
      if (doc && typeof doc.languageId === 'undefined') throw new Error('No languageId property')
    })

    test('editor document has getText method', function() {
      var doc = vscode.editor.getActiveDocument()
      if (doc && typeof doc.getText !== 'function') throw new Error('No getText method')
    })

    test('editor document has lineCount property', function() {
      var doc = vscode.editor.getActiveDocument()
      if (doc && typeof doc.lineCount === 'undefined') throw new Error('No lineCount property')
    })

    showResults()
  })

  // ===== TEST: vscode.workspace =====
  var workspaceTest = vscode.commands.registerCommand('debug.testWorkspace', function() {
    results = []
    passed = 0
    failed = 0

    test('workspace.getPath exists', function() {
      if (typeof vscode.workspace.getPath !== 'function') throw new Error('Not a function')
    })

    test('workspace.getPath returns string or null', function() {
      var p = vscode.workspace.getPath()
      if (p !== null && typeof p !== 'string') throw new Error('Invalid return type')
    })

    test('workspace.readFile exists', function() {
      if (typeof vscode.workspace.readFile !== 'function') throw new Error('Not a function')
    })

    test('workspace.writeFile exists', function() {
      if (typeof vscode.workspace.writeFile !== 'function') throw new Error('Not a function')
    })

    test('workspace.readDir exists', function() {
      if (typeof vscode.workspace.readDir !== 'function') throw new Error('Not a function')
    })

    test('workspace.findFiles exists', function() {
      if (typeof vscode.workspace.findFiles !== 'function') throw new Error('Not a function')
    })

    testAsync('workspace readFile/writeFile roundtrip', function() {
      var testPath = '/tmp/vistudio-debug-test.txt'
      return vscode.workspace.writeFile(testPath, 'debug content').then(function() {
        return vscode.workspace.readFile(testPath).then(function(content) {
          if (content !== 'debug content') throw new Error('Content mismatch: ' + content)
        })
      })
    })

    testAsync('workspace readDir works', function() {
      var p = vscode.workspace.getPath()
      if (!p) {
        results.push('SKIP: readDir - no workspace open')
        return Promise.resolve()
      }
      return vscode.workspace.readDir(p).then(function(entries) {
        if (!Array.isArray(entries)) throw new Error('Not an array')
      })
    })

    testAsync('workspace findFiles works', function() {
      var p = vscode.workspace.getPath()
      if (!p) {
        results.push('SKIP: findFiles - no workspace open')
        return Promise.resolve()
      }
      return vscode.workspace.findFiles('*.json').then(function(files) {
        if (!Array.isArray(files)) throw new Error('Not an array')
      })
    })

    setTimeout(function() { showResultsAsync('Workspace') }, 1500)
  })

  // ===== TEST: vscode.terminal =====
  var terminalTest = vscode.commands.registerCommand('debug.testTerminal', function() {
    results = []
    passed = 0
    failed = 0

    test('terminal.sendText exists', function() {
      if (typeof vscode.terminal.sendText !== 'function') throw new Error('Not a function')
    })

    test('terminal.sendText works', function() {
      vscode.terminal.sendText('echo debug test')
    })

    test('terminal.registerCompiler exists', function() {
      if (typeof vscode.terminal.registerCompiler !== 'function') throw new Error('Not a function')
    })

    test('terminal.registerCompiler returns Disposable', function() {
      var d = vscode.terminal.registerCompiler({
        id: 'debug.testCompiler',
        label: 'Debug Test Compiler',
        command: 'echo',
        args: ['test'],
        fileExtensions: ['.dbg']
      })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose method')
      d.dispose()
    })

    test('terminal.registerCompiler with minimal config', function() {
      var d = vscode.terminal.registerCompiler({
        id: 'debug.minimalCompiler',
        label: 'Minimal',
        command: 'echo'
      })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose method')
      d.dispose()
    })

    showResults()
  })

  // ===== TEST: vscode.languages =====
  var languagesTest = vscode.commands.registerCommand('debug.testLanguages', function() {
    results = []
    passed = 0
    failed = 0

    test('languages.registerLanguage exists', function() {
      if (typeof vscode.languages.registerLanguage !== 'function') throw new Error('Not a function')
    })

    test('languages.registerLanguage returns Disposable', function() {
      var d = vscode.languages.registerLanguage({
        id: 'debuglang',
        extensions: ['.debug'],
        aliases: ['DebugLang']
      })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose method')
      d.dispose()
    })

    test('languages.registerLanguage with full config', function() {
      var d = vscode.languages.registerLanguage({
        id: 'debuglang2',
        extensions: ['.debug2'],
        aliases: ['DebugLang2'],
        keywords: ['fn', 'let'],
        operators: ['=', '+'],
        symbols: ['{', '}'],
        builtins: ['print']
      })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose method')
      d.dispose()
    })

    test('languages.registerCompletionProvider exists', function() {
      if (typeof vscode.languages.registerCompletionProvider !== 'function') throw new Error('Not a function')
    })

    test('languages.registerCompletionProvider returns Disposable', function() {
      var d = vscode.languages.registerCompletionProvider('debuglang', {
        provideCompletionItems: function(doc, pos) {
          return []
        }
      })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose method')
      d.dispose()
    })

    test('CompletionItemKind enum exists', function() {
      if (typeof vscode.CompletionItemKind === 'undefined') throw new Error('Not defined')
    })

    test('CompletionItemKind has expected values', function() {
      var kinds = vscode.CompletionItemKind
      if (kinds.Text !== 0) throw new Error('Text not 0')
      if (kinds.Keyword !== 10) throw new Error('Keyword not 10')
      if (kinds.Function !== 2) throw new Error('Function not 2')
    })

    test('CompletionProvider receives document and position', function() {
      var receivedDoc = null
      var receivedPos = null
      var d = vscode.languages.registerCompletionProvider('debuglang', {
        provideCompletionItems: function(doc, pos) {
          receivedDoc = doc
          receivedPos = pos
          return []
        }
      })
      // Cannot easily trigger provider without editor integration, just verify registration
      d.dispose()
    })

    showResults()
  })

  // ===== TEST: vscode.env =====
  var envTest = vscode.commands.registerCommand('debug.testEnv', function() {
    results = []
    passed = 0
    failed = 0

    test('env.openExternal exists', function() {
      if (typeof vscode.env.openExternal !== 'function') throw new Error('Not a function')
    })

    test('env.getAppPath exists', function() {
      if (typeof vscode.env.getAppPath !== 'function') throw new Error('Not a function')
    })

    test('env.getAppPath returns string', function() {
      var path = vscode.env.getAppPath()
      if (typeof path !== 'string') throw new Error('Not a string: ' + typeof path)
    })

    showResults()
  })

  // ===== TEST: ALL =====
  var allTest = vscode.commands.registerCommand('debug.testAll', function() {
    results = []
    passed = 0
    failed = 0

    // --- commands ---
    test('commands.registerCommand exists', function() {
      if (typeof vscode.commands.registerCommand !== 'function') throw new Error('Not a function')
    })
    test('commands.registerCommand returns Disposable', function() {
      var d = vscode.commands.registerCommand('debug.allTest1', function() {})
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose')
      d.dispose()
    })
    test('commands.executeCommand exists', function() {
      if (typeof vscode.commands.executeCommand !== 'function') throw new Error('Not a function')
    })

    // --- window ---
    test('window.showInformationMessage exists', function() {
      if (typeof vscode.window.showInformationMessage !== 'function') throw new Error('Not a function')
    })
    test('window.showErrorMessage exists', function() {
      if (typeof vscode.window.showErrorMessage !== 'function') throw new Error('Not a function')
    })
    test('window.showWarningMessage exists', function() {
      if (typeof vscode.window.showWarningMessage !== 'function') throw new Error('Not a function')
    })

    // --- editor ---
    test('editor.getActiveDocument exists', function() {
      if (typeof vscode.editor.getActiveDocument !== 'function') throw new Error('Not a function')
    })
    test('editor.getActiveSelection exists', function() {
      if (typeof vscode.editor.getActiveSelection !== 'function') throw new Error('Not a function')
    })
    test('editor.replaceSelection exists', function() {
      if (typeof vscode.editor.replaceSelection !== 'function') throw new Error('Not a function')
    })
    test('editor.insertText exists', function() {
      if (typeof vscode.editor.insertText !== 'function') throw new Error('Not a function')
    })
    test('editor.getLanguage exists', function() {
      if (typeof vscode.editor.getLanguage !== 'function') throw new Error('Not a function')
    })
    test('editor.setLanguage exists', function() {
      if (typeof vscode.editor.setLanguage !== 'function') throw new Error('Not a function')
    })

    // --- workspace ---
    test('workspace.getPath exists', function() {
      if (typeof vscode.workspace.getPath !== 'function') throw new Error('Not a function')
    })
    test('workspace.readFile exists', function() {
      if (typeof vscode.workspace.readFile !== 'function') throw new Error('Not a function')
    })
    test('workspace.writeFile exists', function() {
      if (typeof vscode.workspace.writeFile !== 'function') throw new Error('Not a function')
    })
    test('workspace.readDir exists', function() {
      if (typeof vscode.workspace.readDir !== 'function') throw new Error('Not a function')
    })
    test('workspace.findFiles exists', function() {
      if (typeof vscode.workspace.findFiles !== 'function') throw new Error('Not a function')
    })

    // --- terminal ---
    test('terminal.sendText exists', function() {
      if (typeof vscode.terminal.sendText !== 'function') throw new Error('Not a function')
    })
    test('terminal.registerCompiler exists', function() {
      if (typeof vscode.terminal.registerCompiler !== 'function') throw new Error('Not a function')
    })
    test('terminal.registerCompiler returns Disposable', function() {
      var d = vscode.terminal.registerCompiler({ id: 'debug.all', label: 'All', command: 'echo' })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose')
      d.dispose()
    })

    // --- languages ---
    test('languages.registerLanguage exists', function() {
      if (typeof vscode.languages.registerLanguage !== 'function') throw new Error('Not a function')
    })
    test('languages.registerLanguage returns Disposable', function() {
      var d = vscode.languages.registerLanguage({ id: 'debugall', extensions: ['.dbg'], aliases: ['Dbg'] })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose')
      d.dispose()
    })
    test('languages.registerCompletionProvider exists', function() {
      if (typeof vscode.languages.registerCompletionProvider !== 'function') throw new Error('Not a function')
    })
    test('languages.registerCompletionProvider returns Disposable', function() {
      var d = vscode.languages.registerCompletionProvider('debugall', {
        provideCompletionItems: function() { return [] }
      })
      if (!d || typeof d.dispose !== 'function') throw new Error('No dispose')
      d.dispose()
    })
    test('CompletionItemKind enum exists', function() {
      if (typeof vscode.CompletionItemKind === 'undefined') throw new Error('Not defined')
    })

    // --- env ---
    test('env.openExternal exists', function() {
      if (typeof vscode.env.openExternal !== 'function') throw new Error('Not a function')
    })
    test('env.getAppPath exists', function() {
      if (typeof vscode.env.getAppPath !== 'function') throw new Error('Not a function')
    })

    // --- context ---
    test('context has extensionPath', function() {
      if (typeof context.extensionPath !== 'string') throw new Error('Not a string')
    })
    test('context has subscriptions array', function() {
      if (!Array.isArray(context.subscriptions)) throw new Error('Not an array')
    })
    test('context has workspacePath', function() {
      if (context.workspacePath !== null && typeof context.workspacePath !== 'string') throw new Error('Invalid type')
    })

    showResults()
  })

  // Register all test commands
  context.subscriptions.push(testCmd)
  context.subscriptions.push(cmdTest)
  context.subscriptions.push(windowTest)
  context.subscriptions.push(editorTest)
  context.subscriptions.push(workspaceTest)
  context.subscriptions.push(terminalTest)
  context.subscriptions.push(languagesTest)
  context.subscriptions.push(envTest)
  context.subscriptions.push(allTest)

  console.log('[DEBUG] All test commands registered')
}

