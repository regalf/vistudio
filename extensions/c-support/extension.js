function activate(context, vscode) {
  console.log('[C-SUPPORT] Extension activated')

  // ===== LANGUAGE DEFINITION =====
  var lang = vscode.languages.registerLanguage({
    id: 'c',
    extensions: ['.c', '.h'],
    aliases: ['C'],
    keywords: [
      'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
      'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
      'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
      'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
      'unsigned', 'void', 'volatile', 'while', '_Bool', '_Complex', '_Imaginary',
      'NULL', 'true', 'false', 'bool', 'size_t', 'ptrdiff_t', 'wchar_t',
      'int8_t', 'int16_t', 'int32_t', 'int64_t',
      'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
      'INT8_MIN', 'INT16_MIN', 'INT32_MIN', 'INT64_MIN',
      'INT8_MAX', 'INT16_MAX', 'INT32_MAX', 'INT64_MAX',
      'UINT8_MAX', 'UINT16_MAX', 'UINT32_MAX', 'UINT64_MAX'
    ],
    operators: [
      '=', '==', '!=', '<', '>', '<=', '>=',
      '+', '-', '*', '/', '%',
      '+=', '-=', '*=', '/=', '%=',
      '++', '--',
      '&', '|', '^', '~', '<<', '>>',
      '&&', '||', '!',
      '->', '.',
      '?:'
    ],
    symbols: ['{', '}', '(', ')', '[', ']', ';', ',', ':', '#', '##'],
    builtins: []
  })

  // ===== SEMANTIC TOKEN HIGHLIGHTING =====
  // Extensions register custom highlighting rules with match patterns and colors
  var highlightRules = vscode.languages.registerTokenHighlighter('c', [
    // stdio.h
    { match: 'printf', color: '4EC9B0' },
    { match: 'fprintf', color: '4EC9B0' },
    { match: 'sprintf', color: '4EC9B0' },
    { match: 'snprintf', color: '4EC9B0' },
    { match: 'scanf', color: '4EC9B0' },
    { match: 'fscanf', color: '4EC9B0' },
    { match: 'sscanf', color: '4EC9B0' },
    { match: 'fopen', color: '4EC9B0' },
    { match: 'fclose', color: '4EC9B0' },
    { match: 'fread', color: '4EC9B0' },
    { match: 'fwrite', color: '4EC9B0' },
    { match: 'fgets', color: '4EC9B0' },
    { match: 'fputs', color: '4EC9B0' },
    { match: 'fseek', color: '4EC9B0' },
    { match: 'ftell', color: '4EC9B0' },
    { match: 'rewind', color: '4EC9B0' },
    { match: 'feof', color: '4EC9B0' },
    { match: 'perror', color: '4EC9B0' },
    { match: 'fflush', color: '4EC9B0' },
    { match: 'getchar', color: '4EC9B0' },
    { match: 'putchar', color: '4EC9B0' },
    { match: 'gets', color: '4EC9B0' },
    { match: 'puts', color: '4EC9B0' },
    // stdlib.h
    { match: 'malloc', color: '4EC9B0' },
    { match: 'calloc', color: '4EC9B0' },
    { match: 'realloc', color: '4EC9B0' },
    { match: 'free', color: '4EC9B0' },
    { match: 'abs', color: '4EC9B0' },
    { match: 'labs', color: '4EC9B0' },
    { match: 'atoi', color: '4EC9B0' },
    { match: 'atol', color: '4EC9B0' },
    { match: 'atof', color: '4EC9B0' },
    { match: 'strtol', color: '4EC9B0' },
    { match: 'strtod', color: '4EC9B0' },
    { match: 'rand', color: '4EC9B0' },
    { match: 'srand', color: '4EC9B0' },
    { match: 'exit', color: '4EC9B0' },
    { match: 'system', color: '4EC9B0' },
    { match: 'qsort', color: '4EC9B0' },
    { match: 'bsearch', color: '4EC9B0' },
    // string.h
    { match: 'strlen', color: '4EC9B0' },
    { match: 'strcpy', color: '4EC9B0' },
    { match: 'strncpy', color: '4EC9B0' },
    { match: 'strcat', color: '4EC9B0' },
    { match: 'strncat', color: '4EC9B0' },
    { match: 'strcmp', color: '4EC9B0' },
    { match: 'strncmp', color: '4EC9B0' },
    { match: 'strchr', color: '4EC9B0' },
    { match: 'strrchr', color: '4EC9B0' },
    { match: 'strstr', color: '4EC9B0' },
    { match: 'strtok', color: '4EC9B0' },
    { match: 'memset', color: '4EC9B0' },
    { match: 'memcpy', color: '4EC9B0' },
    { match: 'memmove', color: '4EC9B0' },
    { match: 'memcmp', color: '4EC9B0' },
    { match: 'strerror', color: '4EC9B0' },
    // math.h
    { match: 'sqrt', color: '4EC9B0' },
    { match: 'pow', color: '4EC9B0' },
    { match: 'exp', color: '4EC9B0' },
    { match: 'log', color: '4EC9B0' },
    { match: 'log10', color: '4EC9B0' },
    { match: 'sin', color: '4EC9B0' },
    { match: 'cos', color: '4EC9B0' },
    { match: 'tan', color: '4EC9B0' },
    { match: 'asin', color: '4EC9B0' },
    { match: 'acos', color: '4EC9B0' },
    { match: 'atan', color: '4EC9B0' },
    { match: 'ceil', color: '4EC9B0' },
    { match: 'floor', color: '4EC9B0' },
    { match: 'fabs', color: '4EC9B0' },
    { match: 'fmod', color: '4EC9B0' },
    { match: 'round', color: '4EC9B0' },
    { match: 'argc', color: 'd16969' },
    { match: 'argv', color: 'd16969' },
    { match: 'envp', color: 'd16969' },
    { match: 'errno', color: 'd16969' }
  ])

  // ===== COMPLETION PROVIDER =====
  var cProvider = vscode.languages.registerCompletionProvider('c', {
    provideCompletionItems: function(document, position) {
      var items = []

      // Keywords
      var keywords = [
        { label: 'auto', kind: vscode.CompletionItemKind.Keyword, insertText: 'auto', detail: 'Storage class specifier' },
        { label: 'break', kind: vscode.CompletionItemKind.Keyword, insertText: 'break;', detail: 'Exit loop or switch' },
        { label: 'case', kind: vscode.CompletionItemKind.Keyword, insertText: 'case ', detail: 'Switch case label' },
        { label: 'const', kind: vscode.CompletionItemKind.Keyword, insertText: 'const ', detail: 'Constant qualifier' },
        { label: 'continue', kind: vscode.CompletionItemKind.Keyword, insertText: 'continue;', detail: 'Skip to next iteration' },
        { label: 'default', kind: vscode.CompletionItemKind.Keyword, insertText: 'default:', detail: 'Default switch case' },
        { label: 'do', kind: vscode.CompletionItemKind.Keyword, insertText: 'do {\n  \n} while ();', detail: 'Do-while loop' },
        { label: 'else', kind: vscode.CompletionItemKind.Keyword, insertText: 'else ', detail: 'Else branch' },
        { label: 'enum', kind: vscode.CompletionItemKind.Keyword, insertText: 'enum {\n  \n};', detail: 'Enumeration type' },
        { label: 'extern', kind: vscode.CompletionItemKind.Keyword, insertText: 'extern ', detail: 'External linkage' },
        { label: 'for', kind: vscode.CompletionItemKind.Keyword, insertText: 'for (int i = 0; i < ; i++) {\n  \n}', detail: 'For loop' },
        { label: 'if', kind: vscode.CompletionItemKind.Keyword, insertText: 'if () {\n  \n}', detail: 'If statement' },
        { label: 'ifelse', kind: vscode.CompletionItemKind.Keyword, insertText: 'if () {\n  \n} else {\n  \n}', detail: 'If-else statement' },
        { label: 'return', kind: vscode.CompletionItemKind.Keyword, insertText: 'return ;', detail: 'Return from function' },
        { label: 'sizeof', kind: vscode.CompletionItemKind.Keyword, insertText: 'sizeof()', detail: 'Size of type or variable' },
        { label: 'static', kind: vscode.CompletionItemKind.Keyword, insertText: 'static ', detail: 'Static storage class' },
        { label: 'struct', kind: vscode.CompletionItemKind.Keyword, insertText: 'struct {\n  \n};', detail: 'Structure type' },
        { label: 'switch', kind: vscode.CompletionItemKind.Keyword, insertText: 'switch () {\n  case :\n    break;\n  default:\n    break;\n}', detail: 'Switch statement' },
        { label: 'typedef', kind: vscode.CompletionItemKind.Keyword, insertText: 'typedef  ;', detail: 'Type definition' },
        { label: 'union', kind: vscode.CompletionItemKind.Keyword, insertText: 'union {\n  \n};', detail: 'Union type' },
        { label: 'void', kind: vscode.CompletionItemKind.Keyword, insertText: 'void', detail: 'Void type' },
        { label: 'while', kind: vscode.CompletionItemKind.Keyword, insertText: 'while () {\n  \n}', detail: 'While loop' }
      ]

      // Types
      var types = [
        { label: 'int', kind: vscode.CompletionItemKind.Keyword, insertText: 'int', detail: 'Integer type' },
        { label: 'char', kind: vscode.CompletionItemKind.Keyword, insertText: 'char', detail: 'Character type' },
        { label: 'float', kind: vscode.CompletionItemKind.Keyword, insertText: 'float', detail: 'Single-precision float' },
        { label: 'double', kind: vscode.CompletionItemKind.Keyword, insertText: 'double', detail: 'Double-precision float' },
        { label: 'long', kind: vscode.CompletionItemKind.Keyword, insertText: 'long', detail: 'Long integer' },
        { label: 'short', kind: vscode.CompletionItemKind.Keyword, insertText: 'short', detail: 'Short integer' },
        { label: 'unsigned', kind: vscode.CompletionItemKind.Keyword, insertText: 'unsigned', detail: 'Unsigned integer' },
        { label: 'signed', kind: vscode.CompletionItemKind.Keyword, insertText: 'signed', detail: 'Signed integer' },
        { label: 'size_t', kind: vscode.CompletionItemKind.Keyword, insertText: 'size_t', detail: 'Size type' },
        { label: 'bool', kind: vscode.CompletionItemKind.Keyword, insertText: 'bool', detail: 'Boolean type' }
      ]

      // Snippets
      var snippets = [
        { label: 'main', kind: vscode.CompletionItemKind.Snippet, insertText: 'int main(int argc, char *argv[]) {\n  \n  return 0;\n}', detail: 'Main function' },
        { label: 'func', kind: vscode.CompletionItemKind.Snippet, insertText: 'void function_name(void) {\n  \n}', detail: 'Function template' },
        { label: 'printf', kind: vscode.CompletionItemKind.Snippet, insertText: 'printf("%s\\n", );', detail: 'Print formatted output' },
        { label: 'scanf', kind: vscode.CompletionItemKind.Snippet, insertText: 'scanf("%s", &);', detail: 'Read formatted input' },
        { label: 'malloc', kind: vscode.CompletionItemKind.Snippet, insertText: 'malloc(sizeof())', detail: 'Allocate memory' },
        { label: 'free', kind: vscode.CompletionItemKind.Snippet, insertText: 'free();', detail: 'Free memory' },
        { label: 'include', kind: vscode.CompletionItemKind.Snippet, insertText: '#include <>', detail: 'Include header' },
        { label: 'define', kind: vscode.CompletionItemKind.Snippet, insertText: '#define ', detail: 'Macro definition' },
        { label: 'ifdef', kind: vscode.CompletionItemKind.Snippet, insertText: '#ifdef \n\n#endif', detail: 'Conditional compilation' },
        { label: 'ifndef', kind: vscode.CompletionItemKind.Snippet, insertText: '#ifndef \n\n#endif', detail: 'Include guard' },
        { label: 'pragma', kind: vscode.CompletionItemKind.Snippet, insertText: '#pragma once', detail: 'Include once pragma' }
      ]

      // stdio.h functions
      var stdio = [
        { label: 'printf', kind: vscode.CompletionItemKind.Function, insertText: 'printf', detail: 'stdio.h - Print formatted output' },
        { label: 'fprintf', kind: vscode.CompletionItemKind.Function, insertText: 'fprintf', detail: 'stdio.h - Print to file' },
        { label: 'sprintf', kind: vscode.CompletionItemKind.Function, insertText: 'sprintf', detail: 'stdio.h - Print to string' },
        { label: 'scanf', kind: vscode.CompletionItemKind.Function, insertText: 'scanf', detail: 'stdio.h - Read formatted input' },
        { label: 'fopen', kind: vscode.CompletionItemKind.Function, insertText: 'fopen', detail: 'stdio.h - Open file' },
        { label: 'fclose', kind: vscode.CompletionItemKind.Function, insertText: 'fclose', detail: 'stdio.h - Close file' },
        { label: 'fread', kind: vscode.CompletionItemKind.Function, insertText: 'fread', detail: 'stdio.h - Read from file' },
        { label: 'fwrite', kind: vscode.CompletionItemKind.Function, insertText: 'fwrite', detail: 'stdio.h - Write to file' },
        { label: 'fgets', kind: vscode.CompletionItemKind.Function, insertText: 'fgets', detail: 'stdio.h - Read line from file' },
        { label: 'fputs', kind: vscode.CompletionItemKind.Function, insertText: 'fputs', detail: 'stdio.h - Write line to file' },
        { label: 'fseek', kind: vscode.CompletionItemKind.Function, insertText: 'fseek', detail: 'stdio.h - Seek in file' },
        { label: 'ftell', kind: vscode.CompletionItemKind.Function, insertText: 'ftell', detail: 'stdio.h - Get file position' },
        { label: 'feof', kind: vscode.CompletionItemKind.Function, insertText: 'feof', detail: 'stdio.h - Check end of file' },
        { label: 'perror', kind: vscode.CompletionItemKind.Function, insertText: 'perror', detail: 'stdio.h - Print error message' },
        { label: 'remove', kind: vscode.CompletionItemKind.Function, insertText: 'remove', detail: 'stdio.h - Delete file' },
        { label: 'rename', kind: vscode.CompletionItemKind.Function, insertText: 'rename', detail: 'stdio.h - Rename file' },
        { label: 'fflush', kind: vscode.CompletionItemKind.Function, insertText: 'fflush', detail: 'stdio.h - Flush stream' },
        { label: 'getchar', kind: vscode.CompletionItemKind.Function, insertText: 'getchar', detail: 'stdio.h - Read character' },
        { label: 'putchar', kind: vscode.CompletionItemKind.Function, insertText: 'putchar', detail: 'stdio.h - Write character' },
        { label: 'gets', kind: vscode.CompletionItemKind.Function, insertText: 'gets', detail: 'stdio.h - Read line (unsafe)' },
        { label: 'puts', kind: vscode.CompletionItemKind.Function, insertText: 'puts', detail: 'stdio.h - Write line' }
      ]

      // stdlib.h functions
      var stdlib = [
        { label: 'malloc', kind: vscode.CompletionItemKind.Function, insertText: 'malloc', detail: 'stdlib.h - Allocate memory' },
        { label: 'calloc', kind: vscode.CompletionItemKind.Function, insertText: 'calloc', detail: 'stdlib.h - Allocate and zero memory' },
        { label: 'realloc', kind: vscode.CompletionItemKind.Function, insertText: 'realloc', detail: 'stdlib.h - Reallocate memory' },
        { label: 'free', kind: vscode.CompletionItemKind.Function, insertText: 'free', detail: 'stdlib.h - Free memory' },
        { label: 'abs', kind: vscode.CompletionItemKind.Function, insertText: 'abs', detail: 'stdlib.h - Absolute value' },
        { label: 'labs', kind: vscode.CompletionItemKind.Function, insertText: 'labs', detail: 'stdlib.h - Long absolute value' },
        { label: 'atoi', kind: vscode.CompletionItemKind.Function, insertText: 'atoi', detail: 'stdlib.h - String to int' },
        { label: 'atol', kind: vscode.CompletionItemKind.Function, insertText: 'atol', detail: 'stdlib.h - String to long' },
        { label: 'atof', kind: vscode.CompletionItemKind.Function, insertText: 'atof', detail: 'stdlib.h - String to double' },
        { label: 'strtol', kind: vscode.CompletionItemKind.Function, insertText: 'strtol', detail: 'stdlib.h - String to long' },
        { label: 'strtod', kind: vscode.CompletionItemKind.Function, insertText: 'strtod', detail: 'stdlib.h - String to double' },
        { label: 'rand', kind: vscode.CompletionItemKind.Function, insertText: 'rand', detail: 'stdlib.h - Random number' },
        { label: 'srand', kind: vscode.CompletionItemKind.Function, insertText: 'srand', detail: 'stdlib.h - Seed random' },
        { label: 'exit', kind: vscode.CompletionItemKind.Function, insertText: 'exit', detail: 'stdlib.h - Exit program' },
        { label: 'system', kind: vscode.CompletionItemKind.Function, insertText: 'system', detail: 'stdlib.h - Execute command' },
        { label: 'qsort', kind: vscode.CompletionItemKind.Function, insertText: 'qsort', detail: 'stdlib.h - Quick sort' },
        { label: 'bsearch', kind: vscode.CompletionItemKind.Function, insertText: 'bsearch', detail: 'stdlib.h - Binary search' }
      ]

      // string.h functions
      var string = [
        { label: 'strlen', kind: vscode.CompletionItemKind.Function, insertText: 'strlen', detail: 'string.h - String length' },
        { label: 'strcpy', kind: vscode.CompletionItemKind.Function, insertText: 'strcpy', detail: 'string.h - Copy string' },
        { label: 'strncpy', kind: vscode.CompletionItemKind.Function, insertText: 'strncpy', detail: 'string.h - Copy n chars' },
        { label: 'strcat', kind: vscode.CompletionItemKind.Function, insertText: 'strcat', detail: 'string.h - Concatenate strings' },
        { label: 'strncat', kind: vscode.CompletionItemKind.Function, insertText: 'strncat', detail: 'string.h - Concatenate n chars' },
        { label: 'strcmp', kind: vscode.CompletionItemKind.Function, insertText: 'strcmp', detail: 'string.h - Compare strings' },
        { label: 'strncmp', kind: vscode.CompletionItemKind.Function, insertText: 'strncmp', detail: 'string.h - Compare n chars' },
        { label: 'strchr', kind: vscode.CompletionItemKind.Function, insertText: 'strchr', detail: 'string.h - Find character' },
        { label: 'strrchr', kind: vscode.CompletionItemKind.Function, insertText: 'strrchr', detail: 'string.h - Find last char' },
        { label: 'strstr', kind: vscode.CompletionItemKind.Function, insertText: 'strstr', detail: 'string.h - Find substring' },
        { label: 'strtok', kind: vscode.CompletionItemKind.Function, insertText: 'strtok', detail: 'string.h - Tokenize string' },
        { label: 'memset', kind: vscode.CompletionItemKind.Function, insertText: 'memset', detail: 'string.h - Fill memory' },
        { label: 'memcpy', kind: vscode.CompletionItemKind.Function, insertText: 'memcpy', detail: 'string.h - Copy memory' },
        { label: 'memmove', kind: vscode.CompletionItemKind.Function, insertText: 'memmove', detail: 'string.h - Move memory' },
        { label: 'memcmp', kind: vscode.CompletionItemKind.Function, insertText: 'memcmp', detail: 'string.h - Compare memory' },
        { label: 'strerror', kind: vscode.CompletionItemKind.Function, insertText: 'strerror', detail: 'string.h - Error string' }
      ]

      // Format specifiers (for printf/scanf inside string literals)
      var formats = [
        { label: '%s', kind: vscode.CompletionItemKind.Snippet, insertText: '%s', detail: 'String format specifier' },
        { label: '%d', kind: vscode.CompletionItemKind.Snippet, insertText: '%d', detail: 'Signed int format specifier' },
        { label: '%i', kind: vscode.CompletionItemKind.Snippet, insertText: '%i', detail: 'Signed int format specifier' },
        { label: '%c', kind: vscode.CompletionItemKind.Snippet, insertText: '%c', detail: 'Character format specifier' },
        { label: '%f', kind: vscode.CompletionItemKind.Snippet, insertText: '%f', detail: 'Float format specifier' },
        { label: '%lf', kind: vscode.CompletionItemKind.Snippet, insertText: '%lf', detail: 'Double format specifier' },
        { label: '%p', kind: vscode.CompletionItemKind.Snippet, insertText: '%p', detail: 'Pointer format specifier' },
        { label: '%x', kind: vscode.CompletionItemKind.Snippet, insertText: '%x', detail: 'Hex format specifier' },
        { label: '%X', kind: vscode.CompletionItemKind.Snippet, insertText: '%X', detail: 'Hex uppercase format specifier' },
        { label: '%u', kind: vscode.CompletionItemKind.Snippet, insertText: '%u', detail: 'Unsigned int format specifier' },
        { label: '%ld', kind: vscode.CompletionItemKind.Snippet, insertText: '%ld', detail: 'Long int format specifier' },
        { label: '%lu', kind: vscode.CompletionItemKind.Snippet, insertText: '%lu', detail: 'Unsigned long format specifier' },
        { label: '%lld', kind: vscode.CompletionItemKind.Snippet, insertText: '%lld', detail: 'Long long format specifier' },
        { label: '%llu', kind: vscode.CompletionItemKind.Snippet, insertText: '%llu', detail: 'Unsigned long long format specifier' },
        { label: '%zu', kind: vscode.CompletionItemKind.Snippet, insertText: '%zu', detail: 'size_t format specifier' },
        { label: '%e', kind: vscode.CompletionItemKind.Snippet, insertText: '%e', detail: 'Scientific notation format' },
        { label: '%g', kind: vscode.CompletionItemKind.Snippet, insertText: '%g', detail: 'Compact float format specifier' },
        { label: '%o', kind: vscode.CompletionItemKind.Snippet, insertText: '%o', detail: 'Octal format specifier' },
        { label: '%%', kind: vscode.CompletionItemKind.Snippet, insertText: '%%', detail: 'Percent sign' },
        { label: '%.*s', kind: vscode.CompletionItemKind.Snippet, insertText: '%.*s', detail: 'Precision string format' },
        { label: '%02d', kind: vscode.CompletionItemKind.Snippet, insertText: '%02d', detail: 'Zero-padded int format' },
      ]

      // Escape sequences
      var escapes = [
        { label: '\\n', kind: vscode.CompletionItemKind.Snippet, insertText: '\\n', detail: 'Newline escape' },
        { label: '\\t', kind: vscode.CompletionItemKind.Snippet, insertText: '\\t', detail: 'Tab escape' },
        { label: '\\0', kind: vscode.CompletionItemKind.Snippet, insertText: '\\0', detail: 'Null terminator escape' },
        { label: '\\\\', kind: vscode.CompletionItemKind.Snippet, insertText: '\\\\', detail: 'Backslash escape' },
        { label: '\\"', kind: vscode.CompletionItemKind.Snippet, insertText: '\\"', detail: 'Double quote escape' },
        { label: '\\r', kind: vscode.CompletionItemKind.Snippet, insertText: '\\r', detail: 'Carriage return escape' },
        { label: '\\a', kind: vscode.CompletionItemKind.Snippet, insertText: '\\a', detail: 'Alert/bell escape' },
        { label: '\\b', kind: vscode.CompletionItemKind.Snippet, insertText: '\\b', detail: 'Backspace escape' },
        { label: '\\v', kind: vscode.CompletionItemKind.Snippet, insertText: '\\v', detail: 'Vertical tab escape' },
        { label: '\\f', kind: vscode.CompletionItemKind.Snippet, insertText: '\\f', detail: 'Form feed escape' },
        { label: '\\x', kind: vscode.CompletionItemKind.Snippet, insertText: '\\x', detail: 'Hex byte escape prefix' },
      ]

      // String pattern snippets (common printf patterns)
      var stringPatterns = [
        { label: '"%s\\n"', kind: vscode.CompletionItemKind.Snippet, insertText: '"%s\\n"', detail: 'String with newline pattern' },
        { label: '"%d\\n"', kind: vscode.CompletionItemKind.Snippet, insertText: '"%d\\n"', detail: 'Int with newline pattern' },
        { label: '"%s = %d\\n"', kind: vscode.CompletionItemKind.Snippet, insertText: '"%s = %d\\n"', detail: 'Name = value pattern' },
        { label: '"error: %s\\n"', kind: vscode.CompletionItemKind.Snippet, insertText: '"error: %s\\n"', detail: 'Error message pattern' },
        { label: '"%c"', kind: vscode.CompletionItemKind.Snippet, insertText: '"%c"', detail: 'Single char pattern' },
        { label: '"%p\\n"', kind: vscode.CompletionItemKind.Snippet, insertText: '"%p\\n"', detail: 'Pointer pattern' },
      ]

      // math.h functions
      var math = [
        { label: 'sqrt', kind: vscode.CompletionItemKind.Function, insertText: 'sqrt', detail: 'math.h - Square root' },
        { label: 'pow', kind: vscode.CompletionItemKind.Function, insertText: 'pow', detail: 'math.h - Power' },
        { label: 'exp', kind: vscode.CompletionItemKind.Function, insertText: 'exp', detail: 'math.h - Exponential' },
        { label: 'log', kind: vscode.CompletionItemKind.Function, insertText: 'log', detail: 'math.h - Natural log' },
        { label: 'log10', kind: vscode.CompletionItemKind.Function, insertText: 'log10', detail: 'math.h - Base-10 log' },
        { label: 'sin', kind: vscode.CompletionItemKind.Function, insertText: 'sin', detail: 'math.h - Sine' },
        { label: 'cos', kind: vscode.CompletionItemKind.Function, insertText: 'cos', detail: 'math.h - Cosine' },
        { label: 'tan', kind: vscode.CompletionItemKind.Function, insertText: 'tan', detail: 'math.h - Tangent' },
        { label: 'asin', kind: vscode.CompletionItemKind.Function, insertText: 'asin', detail: 'math.h - Arc sine' },
        { label: 'acos', kind: vscode.CompletionItemKind.Function, insertText: 'acos', detail: 'math.h - Arc cosine' },
        { label: 'atan', kind: vscode.CompletionItemKind.Function, insertText: 'atan', detail: 'math.h - Arc tangent' },
        { label: 'ceil', kind: vscode.CompletionItemKind.Function, insertText: 'ceil', detail: 'math.h - Ceiling' },
        { label: 'floor', kind: vscode.CompletionItemKind.Function, insertText: 'floor', detail: 'math.h - Floor' },
        { label: 'fabs', kind: vscode.CompletionItemKind.Function, insertText: 'fabs', detail: 'math.h - Absolute value' },
        { label: 'fmod', kind: vscode.CompletionItemKind.Function, insertText: 'fmod', detail: 'math.h - Floating modulo' },
        { label: 'round', kind: vscode.CompletionItemKind.Function, insertText: 'round', detail: 'math.h - Round' }
      ]

      // Add all items
      var allItems = keywords.concat(types, snippets, stdio, stdlib, string, formats, escapes, stringPatterns, math)
      var i
      for (i = 0; i < allItems.length; i++) {
        items.push(allItems[i])
      }

      return items
    }
  })

  // ===== COMPILER =====
  var compiler = vscode.terminal.registerCompiler({
    id: 'c.compiler',
    label: 'C Compiler (gcc)',
    command: 'gcc',
    args: ['-Wall', '-o', 'output', 'main.c'],
    fileExtensions: ['.c']
  })

  // ===== COMMANDS =====

  // C: Compile Current File
  var compileCmd = vscode.commands.registerCommand('c.compile', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) {
      vscode.window.showErrorMessage('No file open')
      return
    }
    var filePath = doc.uri
    var outputName = filePath.replace('.c', '')
    vscode.terminal.sendText('gcc -Wall -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling: ' + filePath)
  })

  // C: Compile and Run
  var runCmd = vscode.commands.registerCommand('c.run', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) {
      vscode.window.showErrorMessage('No file open')
      return
    }
    var filePath = doc.uri
    var outputName = filePath.replace('.c', '')
    vscode.terminal.sendText('gcc -Wall -o "' + outputName + '" "' + filePath + '" && ./' + outputName)
    vscode.window.showInformationMessage('Compiling and running: ' + filePath)
  })

  // C: Compile with Debug Info
  var debugCmd = vscode.commands.registerCommand('c.compileDebug', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) {
      vscode.window.showErrorMessage('No file open')
      return
    }
    var filePath = doc.uri
    var outputName = filePath.replace('.c', '')
    vscode.terminal.sendText('gcc -g -Wall -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling with debug info: ' + filePath)
  })

  // C: Compile with Optimizations
  var optCmd = vscode.commands.registerCommand('c.compileOptimized', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) {
      vscode.window.showErrorMessage('No file open')
      return
    }
    var filePath = doc.uri
    var outputName = filePath.replace('.c', '')
    vscode.terminal.sendText('gcc -O3 -Wall -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling with -O3: ' + filePath)
  })

  // C: Compile with All Warnings
  var warnCmd = vscode.commands.registerCommand('c.compileWarnings', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) {
      vscode.window.showErrorMessage('No file open')
      return
    }
    var filePath = doc.uri
    var outputName = filePath.replace('.c', '')
    vscode.terminal.sendText('gcc -Wall -Wextra -Wpedantic -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling with all warnings: ' + filePath)
  })

  // C: New C File with Template
  var newFileCmd = vscode.commands.registerCommand('c.newFile', function() {
    var template = '#include <stdio.h>\n#include <stdlib.h>\n\nint main(int argc, char *argv[]) {\n    \n    return 0;\n}\n'
    var doc = vscode.editor.getActiveDocument()
    if (doc) {
      vscode.editor.replaceSelection(template)
    } else {
      vscode.window.showErrorMessage('No file open to insert template')
    }
  })

  // ===== PROJECT TEMPLATE =====
  var cTemplate = vscode.workspace.registerProjectTemplate({
    id: 'c-basic',
    name: 'C Project',
    description: 'Basic C project with main.c and Makefile',
    language: 'c',
    files: {
      'src/main.c': '#include <stdio.h>\n#include <stdlib.h>\n\nint main(int argc, char *argv[]) {\n    printf("Hello, World!\\n");\n    return 0;\n}\n',
      'Makefile': 'CC = gcc\nCFLAGS = -Wall -Wextra -std=c11\nTARGET = main\nSRCDIR = src\nSRCS = $(wildcard $(SRCDIR)/*.c)\nOBJS = $(SRCS:.c=.o)\n\n.PHONY: all clean run\n\nall: $(TARGET)\n\n$(TARGET): $(OBJS)\n\t$(CC) $(CFLAGS) -o $@ $^\n\n$(SRCDIR)/%.o: $(SRCDIR)/%.c\n\t$(CC) $(CFLAGS) -c $< -o $@\n\nclean:\n\trm -f $(OBJS) $(TARGET)\n\nrun: $(TARGET)\n\t./$(TARGET)\n'
    }
  })

  // Register all subscriptions
  context.subscriptions.push(lang)
  context.subscriptions.push(highlightRules)
  context.subscriptions.push(cProvider)
  context.subscriptions.push(compiler)
  context.subscriptions.push(compileCmd)
  context.subscriptions.push(runCmd)
  context.subscriptions.push(debugCmd)
  context.subscriptions.push(optCmd)
  context.subscriptions.push(warnCmd)
  context.subscriptions.push(newFileCmd)
  context.subscriptions.push(cTemplate)

  console.log('[C-SUPPORT] All commands and providers registered')
}
