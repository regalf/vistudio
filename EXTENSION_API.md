# ViStudio Extension API - Documentazione Completa

## 📦 Struttura di un'Estensione

Ogni estensione ViStudio è una cartella contenente almeno due file:

```
my-extension/
├── extension.json    # Manifest (obbligatorio)
└── extension.js      # Codice dell'estensione (obbligatorio)
```

### Posizione delle Estensioni

Le estensioni si trovano in:
```
~/.config/vistudio/extensions/
```

Ogni sottocartella rappresenta un'estensione separata.

---

## 📋 extension.json (Manifest)

Il manifest definisce metadati e configurazioni dell'estensione.

### Struttura Completa

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "Descrizione dell'estensione",
  "author": "Il Tuo Nome",
  "main": "extension.js",
  "activationEvents": ["*"],
  "contributes": {
    "commands": [
      {
        "command": "myExt.hello",
        "title": "Hello World",
        "category": "My Extension"
      }
    ],
    "languages": [
      {
        "id": "mylang",
        "extensions": [".mylang"],
        "aliases": ["MyLang"]
      }
    ]
  }
}
```

### Campi del Manifest

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `name` | string | ✅ | Identificativo univoco dell'estensione |
| `version` | string | ✅ | Versione semantica (es. "1.0.0") |
| `description` | string | ❌ | Descrizione leggibile |
| `author` | string | ❌ | Autore dell'estensione |
| `main` | string | ✅ | File JavaScript principale (relativo alla cartella) |
| `activationEvents` | string[] | ❌ | Eventi che attivano l'estensione ("*" = sempre) |
| `contributes` | object | ❌ | Contributi all'IDE (comandi, linguaggi, temi) |

### Activation Events

- `"*"` - Attiva all'avvio dell'IDE
- `"onCommand:myExt.hello"` - Attiva quando viene eseguito il comando
- `"onLanguage:typescript"` - Attiva quando si apre un file TypeScript

---

## ⚡ extension.js (Codice)

Il codice dell'estensione è JavaScript puro eseguito in un contesto sandboxato.

### Pattern Base

```javascript
function activate(context, vs) {
  // Il tuo codice qui
  console.log('Estensione attivata!')
}

// Chiamata obbligatoria per l'attivazione
activate(context, vs)
```

### Parametri della Funzione `activate`

| Parametro | Tipo | Descrizione |
|-----------|------|-------------|
| `context` | `ExtensionContext` | Contesto dell'estensione (path, subscriptions, workspace) |
| `vs` | `ExtensionAPI` | API di ViStudio per interagire con l'editor |

---

## 🔌 Extension API Reference

### `vs.commands` - Registrazione ed Esecuzione Comandi

#### `registerCommand(id, handler) → Disposable`

Registra un nuovo comando eseguibile dall'utente.

```javascript
const cmd = vs.commands.registerCommand('myExt.hello', function() {
  vs.window.showInformationMessage('Ciao da My Extension!')
})

// Aggiungi alle subscriptions per pulizia automatica
context.subscriptions.push(cmd)
```

#### `executeCommand(id, ...args) → Promise<any>`

Esegue un comando registrato (può chiamare comandi di altre estensioni).

```javascript
vs.commands.executeCommand('myExt.hello')
vs.commands.executeCommand('editor.formatDocument')
```

---

### `vs.window` - Interazione con l'Utente

#### `showInformationMessage(message)`

Mostra un popup informativo.

```javascript
vs.window.showInformationMessage('Operazione completata!')
```

#### `showErrorMessage(message)`

Mostra un popup di errore.

```javascript
vs.window.showErrorMessage('Si è verificato un errore!')
```

#### `showWarningMessage(message)`

Mostra un popup di avviso.

```javascript
vs.window.showWarningMessage('Attenzione: file non salvato')
```

---

### `vs.editor` - Manipolazione dell'Editor

#### `getActiveDocument() → EditorDocument | null`

Ottiene il documento attualmente attivo.

```javascript
const doc = vs.editor.getActiveDocument()
if (doc) {
  console.log('File:', doc.fileName)
  console.log('Linguaggio:', doc.languageId)
  console.log('Contenuto:', doc.getText())
  console.log('Righe:', doc.lineCount)
}
```

#### `getActiveSelection() → Selection | null`

Ottiene la selezione corrente (non ancora implementato completamente).

#### `replaceSelection(text)`

Sostituisce il testo selezionato.

```javascript
vs.editor.replaceSelection('testo sostituito')
```

#### `insertText(text)`

Inserisce testo alla fine del documento.

```javascript
vs.editor.insertText('\n// Aggiunto dall\'estensione')
```

#### `getLanguage() → string`

Ottiene il linguaggio del file attivo.

```javascript
const lang = vs.editor.getLanguage()
console.log('Linguaggio corrente:', lang)
```

#### `setLanguage(languageId)`

Cambia il linguaggio del file attivo.

```javascript
vs.editor.setLanguage('javascript')
```

---

### `vs.workspace` - Accesso al Filesystem

#### `getPath() → string | null`

Ottiene il percorso della cartella di lavoro aperta.

```javascript
const workspacePath = vs.workspace.getPath()
if (workspacePath) {
  console.log('Workspace:', workspacePath)
}
```

#### `readFile(path) → Promise<string>`

Legge il contenuto di un file.

```javascript
const content = await vs.workspace.readFile('/percorso/file.txt')
console.log('Contenuto:', content)
```

#### `writeFile(path, content) → Promise<void>`

Scrive contenuto in un file.

```javascript
await vs.workspace.writeFile('/percorso/file.txt', 'Nuovo contenuto')
```

#### `readDir(path) → Promise<FileSystemEntry[]>`

Legge il contenuto di una directory.

```javascript
const entries = await vs.workspace.readDir('/percorso/cartella')
entries.forEach(entry => {
  console.log(entry.name, entry.isDirectory ? '(cartella)' : '(file)')
})
```

#### `findFiles(pattern) → Promise<string[]>`

Cerca file con un pattern (supporta `*` e `?`).

```javascript
const jsFiles = await vs.workspace.findFiles('*.js')
const testFiles = await vs.workspace.findFiles('test_*.py')
```

#### `registerProjectTemplate(template) → Disposable`

Registra un template di progetto che appare nel modale "New Project".

```javascript
const template = vs.workspace.registerProjectTemplate({
  id: 'c-basic',
  name: 'C Project',
  description: 'A basic C project with main.c and Makefile',
  language: 'c',
  files: {
    'src/main.c': '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    'Makefile': 'CC=gcc\nCFLAGS=-Wall -Wextra\n\nall: main\n\nmain: src/main.c\n\t$(CC) $(CFLAGS) -o main src/main.c\n\nclean:\n\trm -f main'
  }
})

context.subscriptions.push(template)
```

**Struttura del template:**

| Campo | Tipo | Obbligatorio | Descrizione |
|-------|------|--------------|-------------|
| `id` | string | ✅ | Identificativo univoco del template |
| `name` | string | ✅ | Nome visualizzato nel dropdown |
| `description` | string | ❌ | Descrizione opzionale |
| `language` | string | ✅ | Linguaggio del progetto |
| `files` | object | ✅ | Mappa `path → contenuto` dei file da creare |

**Nota:** I percorsi nei file sono relativi alla cartella del progetto. Le directory vengono create automaticamente.

---

### `vs.terminal` - Interazione con il Terminale

#### `sendText(text)`

Invia testo al terminale integrato.

```javascript
vs.terminal.sendText('npm run build')
vs.terminal.sendText('ls -la')
```

#### `registerCompiler(compiler) → Disposable`

Registra un compilatore per un tipo di file.

```javascript
const compiler = vs.terminal.registerCompiler({
  id: 'myExt.compiler',
  label: 'My Compiler',
  command: 'tsc',
  args: ['--outDir', './dist'],
  fileExtensions: ['.ts']
})

context.subscriptions.push(compiler)
```

---

### `vs.languages` - Definizione Linguaggi e Autocompletamento

#### `registerLanguage(language) → Disposable`

Registra un nuovo linguaggio con sintassi personalizzata.

```javascript
const lang = vs.languages.registerLanguage({
  id: 'mylang',
  extensions: ['.mylang'],
  aliases: ['MyLang', 'my-language'],
  keywords: ['fn', 'let', 'const', 'if', 'else', 'for'],
  operators: ['=', '==', '!=', '<', '>', '+', '-'],
  symbols: ['{', '}', '(', ')', '[', ']', ';'],
  builtins: ['print', 'input', 'len']
})

context.subscriptions.push(lang)
```

#### `registerCompletionProvider(languageId, provider) → Disposable`

Registra un provider di autocompletamento per un linguaggio.

```javascript
const provider = vs.languages.registerCompletionProvider('mylang', {
  provideCompletionItems: function(document, position) {
    return [
      {
        label: 'fn',
        kind: vs.CompletionItemKind.Keyword,
        insertText: 'fn',
        detail: 'Dichiarazione funzione'
      },
      {
        label: 'println',
        kind: vs.CompletionItemKind.Function,
        insertText: 'println()',
        detail: 'Stampa a console'
      }
    ]
  }
})

context.subscriptions.push(provider)
```

---

### `vs.env` - Informazioni Ambiente

#### `openExternal(url)`

Apre un URL nel browser predefinito.

```javascript
vs.env.openExternal('https://example.com')
```

#### `getAppPath() → string`

Ottiene il percorso di installazione di ViStudio.

```javascript
const appPath = vs.env.getAppPath()
console.log('ViStudio installato in:', appPath)
```

---

### `vs.CompletionItemKind` - Tipi di Completamento

Enum per specificare il tipo di elemento di autocompletamento:

| Valore | Descrizione |
|--------|-------------|
| `vs.CompletionItemKind.Text` | Testo semplice |
| `vs.CompletionItemKind.Method` | Metodo di una classe |
| `vs.CompletionItemKind.Function` | Funzione |
| `vs.CompletionItemKind.Constructor` | Costruttore |
| `vs.CompletionItemKind.Field` | Campo |
| `vs.CompletionItemKind.Variable` | Variabile |
| `vs.CompletionItemKind.Class` | Classe |
| `vs.CompletionItemKind.Interface` | Interfaccia |
| `vs.CompletionItemKind.Module` | Modulo |
| `vs.CompletionItemKind.Property` | Proprietà |
| `vs.CompletionItemKind.Keyword` | Parola chiave |
| `vs.CompletionItemKind.Snippet` | Snippet |
| `vs.CompletionItemKind.Color` | Colore |
| `vs.CompletionItemKind.File` | File |
| `vs.CompletionItemKind.Reference` | Riferimento |

---

## 🧩 ExtensionContext

Il `context` passato a `activate()` contiene:

| Proprietà | Tipo | Descrizione |
|-----------|------|-------------|
| `extensionPath` | string | Percorso assoluto della cartella dell'estensione |
| `subscriptions` | Disposable[] | Array di oggetti da pulire alla disattivazione |
| `workspacePath` | string \| null | Percorso del workspace corrente |

### Disposable

Ogni metodo `register*` restituisce un `Disposable` con un metodo `dispose()`.

```javascript
const cmd = vs.commands.registerCommand('myExt.hello', handler)
context.subscriptions.push(cmd)

// Alla disattivazione, dispose() viene chiamato automaticamente
```

---

## 🔄 Ciclo di Vita di un'Estensione

### 1. Caricamento (Load)

Quando ViStudio si avvia:
1. Scansiona `~/.config/vistudio/extensions/`
2. Per ogni sottocartella, legge `extension.json`
3. Crea un `ExtensionInfo` con `isActive: false`

### 2. Attivazione (Activate)

Quando un activation event si verifica:
1. Legge il file `main` (es. `extension.js`)
2. Esegue il codice in un contesto sandboxato (`new Function`)
3. Chiama `activate(context, vs)`
4. Imposta `isActive: true`
5. Salva le subscriptions per pulizia futura

### 3. Disattivazione (Deactivate)

Quando l'utente disattiva l'estensione:
1. Chiama `dispose()` su tutte le subscriptions
2. Rimuove comandi e compilatori registrati
3. Imposta `isActive: false`

### 4. Eliminazione (Delete)

Quando l'utente elimina l'estensione:
1. Disattiva l'estensione
2. Elimina ricorsivamente la cartella
3. Rimuove dal registro interno

---

## 🛡️ Sandboxing e Sicurezza

### Come Funziona il Sandbox

Le estensioni vengono eseguite tramite `new Function('context', 'vscode', code)`:
- **Nessun accesso a `require()`** - Non può caricare moduli Node.js
- **Nessun accesso a `process`** - Non può leggere variabili d'ambiente
- **Nessun accesso a `window`** - Non può manipolare il DOM direttamente
- **Accesso limitato** - Può solo usare le API esposte tramite `vs`

### API Disponibili nel Sandbox

| API | Accesso | Descrizione |
|-----|---------|-------------|
| `context` | ✅ | Contesto dell'estensione |
| `vscode` | ✅ | API di ViStudio (passato come secondo parametro) |
| `console` | ✅ | Logging (visibile in DevTools) |
| `require` | ❌ | Bloccato |
| `process` | ❌ | Bloccato |
| `fetch` | ❌ | Bloccato |

---

## 🐛 Debug di un'Estensione

### Log delle Estensioni

ViStudio scrive log dettagliati in:
```
~/.config/vistudio/extension-debug.log
```

### Log del Main Process

```bash
tail -f /tmp/vistudio.log
```

### Log del Renderer

Apri DevTools con `Ctrl+Shift+I` (se disponibile) e controlla la console.

### Errori Comuni

| Errore | Causa | Soluzione |
|--------|-------|-----------|
| `Unexpected token '{'` | Regex sbagliata nel codice | Controlla la sintassi JavaScript |
| `vs.commands.registerCommand is not a function` | API non esposta | Usa `vs.commands` non `vs.command` |
| `Extension not found` | Manifest mancante o errato | Verifica `extension.json` |
| `Failed to read main file` | File main non trovato | Controlla il campo `main` nel manifest |

---

## 📝 Esempi Completi

### Esempio 1: Estensione "Hello World"

```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "description": "Saluta l'utente",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

```javascript
function activate(context, vs) {
  var cmd = vs.commands.registerCommand('hello.greet', function() {
    vs.window.showInformationMessage('Ciao, sviluppatore!')
  })
  context.subscriptions.push(cmd)
}

activate(context, vs)
```

### Esempio 2: Estensione per Linguaggio Personalizzato

```json
{
  "name": "mylang-support",
  "version": "1.0.0",
  "description": "Supporto per MyLang",
  "main": "extension.js",
  "activationEvents": ["*"],
  "contributes": {
    "languages": [
      {
        "id": "mylang",
        "extensions": [".mylang"],
        "aliases": ["MyLang"]
      }
    ]
  }
}
```

```javascript
function activate(context, vs) {
  // Registra il linguaggio
  var lang = vs.languages.registerLanguage({
    id: 'mylang',
    extensions: ['.mylang'],
    aliases: ['MyLang'],
    keywords: ['fn', 'let', 'const', 'if', 'else', 'for', 'while', 'return'],
    operators: ['=', '==', '!=', '<', '>', '+', '-', '*', '/'],
    symbols: ['{', '}', '(', ')', '[', ']', ';', ',']
  })

  // Registra autocompletamento
  var provider = vs.languages.registerCompletionProvider('mylang', {
    provideCompletionItems: function(document, position) {
      return [
        { label: 'fn', kind: vs.CompletionItemKind.Keyword, insertText: 'fn', detail: 'Funzione' },
        { label: 'let', kind: vs.CompletionItemKind.Keyword, insertText: 'let', detail: 'Variabile' },
        { label: 'println', kind: vs.CompletionItemKind.Function, insertText: 'println()', detail: 'Stampa' }
      ]
    }
  })

  context.subscriptions.push(lang)
  context.subscriptions.push(provider)
}

activate(context, vs)
```

### Esempio 3: Estensione con Compilatore

```json
{
  "name": "typescript-compiler",
  "version": "1.0.0",
  "description": "Compilatore TypeScript integrato",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

```javascript
function activate(context, vs) {
  // Registra compilatore
  var compiler = vs.terminal.registerCompiler({
    id: 'ts.compiler',
    label: 'TypeScript Compiler',
    command: 'tsc',
    args: ['--noEmit'],
    fileExtensions: ['.ts', '.tsx']
  })

  // Comando per compilare
  var buildCmd = vs.commands.registerCommand('ts.build', function() {
    vs.terminal.sendText('tsc --noEmit')
    vs.window.showInformationMessage('Build TypeScript avviato')
  })

  context.subscriptions.push(compiler)
  context.subscriptions.push(buildCmd)
}

activate(context, vs)
```

### Esempio 4: Estensione con Accesso al Workspace

```json
{
  "name": "file-counter",
  "version": "1.0.0",
  "description": "Conta i file nel workspace",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

```javascript
function activate(context, vs) {
  var cmd = vs.commands.registerCommand('counter.count', function() {
    var workspacePath = vs.workspace.getPath()
    if (!workspacePath) {
      vs.window.showErrorMessage('Nessun workspace aperto')
      return
    }

    vs.workspace.findFiles('*').then(function(files) {
      vs.window.showInformationMessage('File trovati: ' + files.length)
    })
  })

  context.subscriptions.push(cmd)
}

activate(context, vs)
```

### Esempio 5: Estensione con Template Progetto

```json
{
  "name": "c-project-template",
  "version": "1.0.0",
  "description": "Template per progetti C con Makefile",
  "main": "extension.js",
  "activationEvents": ["*"]
}
```

```javascript
function activate(context, vs) {
  var template = vs.workspace.registerProjectTemplate({
    id: 'c-basic',
    name: 'C Project',
    description: 'Basic C project with main.c and Makefile',
    language: 'c',
    files: {
      'src/main.c': '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
      'Makefile': 'CC=gcc\nCFLAGS=-Wall -Wextra\n\nall: main\n\nmain: src/main.c\n\t$(CC) $(CFLAGS) -o main src/main.c\n\nclean:\n\trm -f main'
    }
  })

  context.subscriptions.push(template)
}

activate(context, vs)
```

---

## 🚀 Installazione di un'Estensione

### Metodo 1: Copia Manuale

1. Crea una cartella in `~/.config/vistudio/extensions/`
2. Copia `extension.json` e `extension.js`
3. Riavvia ViStudio o usa "Refresh Extensions" dal menu

### Metodo 2: Dall'IDE

1. Menu **Extensions** → **Install Extension...**
2. Seleziona la cartella dell'estensione
3. L'estensione viene caricata e attivata automaticamente

### Metodo 3: Gestione Estensioni

1. Menu **Extensions** → **Manage Extensions...**
2. Pannello laterale con lista estensioni
3. Toggle switch per attivare/disattivare
4. Pulsante "Delete" per rimuovere

---

## 📊 Architettura Interna

```
┌─────────────────────────────────────────────┐
│           ExtensionHost                     │
│  - Map<id, ExtensionInfo>                   │
│  - Map<id, RegisteredCommand>               │
│  - Map<id, RegisteredCompiler>              │
│  - Map<id, LanguageDefinition>              │
│  - Map<id, CompletionProvider[]>            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│           ExtensionAPIImpl                  │
│  - commands: registerCommand, executeCommand│
│  - window: show*Message                     │
│  - editor: getActiveDocument, insertText    │
│  - workspace: readFile, writeFile, findFiles│
│  - terminal: sendText, registerCompiler     │
│  - languages: registerLanguage, register... │
│  - env: openExternal, getAppPath            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│           Sandbox (new Function)            │
│  - context: ExtensionContext                │
│  - vscode: ExtensionAPI                     │
│  - NO require, NO process, NO window        │
└─────────────────────────────────────────────┘
```

### Flusso di Attivazione

```
1. loadExtension(path)
   ↓
2. Leggi extension.json
   ↓
3. Crea ExtensionInfo (isActive: false)
   ↓
4. activateExtensionsByEvent("*")
   ↓
5. Per ogni estensione con activationEvents["*"]:
   a. Leggi extension.js
   b. Trasforma codice (module.exports → funzione globale)
   c. Crea ExtensionAPIImpl
   d. Esegui: new Function('context', 'vscode', code)
   e. Chiama activate(context, vscode)
   f. Salva subscriptions
   g. Imposta isActive: true
```

---

*Documentazione ViStudio Extension API v1.1.0*
*Ultimo aggiornamento: 2026-05-19*
