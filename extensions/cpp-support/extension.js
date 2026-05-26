function activate(context, vscode) {
  console.log('[CPP-SUPPORT] Extension activated')

  var lang = vscode.languages.registerLanguage({
    id: 'cpp',
    extensions: ['.cpp', '.hpp', '.cc', '.cxx', '.hxx', '.h'],
    aliases: ['C++', 'Cpp'],
    keywords: [
      'alignas', 'alignof', 'auto', 'bool', 'break', 'case', 'catch', 'char',
      'char8_t', 'char16_t', 'char32_t', 'class', 'concept', 'const', 'consteval',
      'constexpr', 'constinit', 'continue', 'decltype', 'default', 'delete',
      'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export',
      'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline',
      'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'nullptr',
      'operator', 'override', 'private', 'protected', 'public', 'register',
      'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof',
      'static', 'static_cast', 'struct', 'switch', 'template', 'this', 'throw',
      'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned',
      'using', 'virtual', 'void', 'volatile', 'while', 'wchar_t',
      'NULL', 'nullptr_t', 'size_t', 'ptrdiff_t', 'int8_t', 'int16_t',
      'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t'
    ],
    operators: [
      '=', '==', '!=', '<', '>', '<=', '>=', '<=>',
      '+', '-', '*', '/', '%', '+=', '-=', '*=', '/=', '%=',
      '++', '--', '&', '|', '^', '~', '<<', '>>',
      '&&', '||', '!', '->', '.', '::', '?:', '->*', '.*',
      'new', 'delete'
    ],
    symbols: ['{', '}', '(', ')', '[', ']', ';', ',', ':', '#', '##', '<', '>'],
    builtins: [
      'cout', 'cin', 'cerr', 'clog', 'endl', 'string', 'vector', 'map',
      'set', 'unordered_map', 'unordered_set', 'list', 'deque', 'queue',
      'stack', 'pair', 'tuple', 'shared_ptr', 'unique_ptr', 'weak_ptr',
      'make_shared', 'make_unique', 'ifstream', 'ofstream', 'fstream',
      'stringstream', 'sort', 'find', 'reverse', 'binary_search',
      'thread', 'mutex', 'lock_guard', 'unique_lock', 'this_thread',
      'async', 'future', 'promise', 'packaged_task'
    ]
  })

  var highlightRules = vscode.languages.registerTokenHighlighter('cpp', [
    // iostream
    { match: 'cout', color: '4EC9B0' }, { match: 'cin', color: '4EC9B0' },
    { match: 'cerr', color: '4EC9B0' }, { match: 'clog', color: '4EC9B0' },
    { match: 'endl', color: '4EC9B0' },
    // string
    { match: 'string', color: '4EC9B0' }, { match: 'getline', color: '4EC9B0' },
    { match: 'to_string', color: '4EC9B0' }, { match: 'stoi', color: '4EC9B0' },
    { match: 'stod', color: '4EC9B0' }, { match: 'stol', color: '4EC9B0' },
    { match: 'stof', color: '4EC9B0' }, { match: 'substr', color: '4EC9B0' },
    { match: 'find', color: '4EC9B0' }, { match: 'rfind', color: '4EC9B0' },
    { match: 'replace', color: '4EC9B0' },
    // vector
    { match: 'vector', color: '4EC9B0' }, { match: 'push_back', color: '4EC9B0' },
    { match: 'pop_back', color: '4EC9B0' }, { match: 'emplace_back', color: '4EC9B0' },
    { match: 'resize', color: '4EC9B0' }, { match: 'reserve', color: '4EC9B0' },
    { match: 'shrink_to_fit', color: '4EC9B0' }, { match: 'data', color: '4EC9B0' },
    { match: 'size', color: '4EC9B0' }, { match: 'empty', color: '4EC9B0' },
    { match: 'clear', color: '4EC9B0' }, { match: 'erase', color: '4EC9B0' },
    { match: 'at', color: '4EC9B0' }, { match: 'front', color: '4EC9B0' },
    { match: 'back', color: '4EC9B0' }, { match: 'begin', color: '4EC9B0' },
    { match: 'end', color: '4EC9B0' }, { match: 'rbegin', color: '4EC9B0' },
    { match: 'rend', color: '4EC9B0' }, { match: 'insert', color: '4EC9B0' },
    { match: 'assign', color: '4EC9B0' },
    // algorithm
    { match: 'sort', color: '4EC9B0' }, { match: 'reverse', color: '4EC9B0' },
    { match: 'binary_search', color: '4EC9B0' }, { match: 'lower_bound', color: '4EC9B0' },
    { match: 'upper_bound', color: '4EC9B0' }, { match: 'equal_range', color: '4EC9B0' },
    { match: 'count', color: '4EC9B0' }, { match: 'count_if', color: '4EC9B0' },
    { match: 'for_each', color: '4EC9B0' }, { match: 'transform', color: '4EC9B0' },
    { match: 'copy', color: '4EC9B0' }, { match: 'copy_if', color: '4EC9B0' },
    { match: 'fill', color: '4EC9B0' }, { match: 'generate', color: '4EC9B0' },
    { match: 'remove', color: '4EC9B0' }, { match: 'remove_if', color: '4EC9B0' },
    { match: 'unique', color: '4EC9B0' }, { match: 'accumulate', color: '4EC9B0' },
    { match: 'inner_product', color: '4EC9B0' }, { match: 'adjacent_find', color: '4EC9B0' },
    { match: 'all_of', color: '4EC9B0' }, { match: 'any_of', color: '4EC9B0' },
    { match: 'none_of', color: '4EC9B0' },
    // memory
    { match: 'shared_ptr', color: '4EC9B0' }, { match: 'make_shared', color: '4EC9B0' },
    { match: 'unique_ptr', color: '4EC9B0' }, { match: 'make_unique', color: '4EC9B0' },
    { match: 'weak_ptr', color: '4EC9B0' }, { match: 'enable_shared_from_this', color: '4EC9B0' },
    { match: 'dynamic_pointer_cast', color: '4EC9B0' },
    // containers
    { match: 'map', color: '4EC9B0' }, { match: 'multimap', color: '4EC9B0' },
    { match: 'set', color: '4EC9B0' }, { match: 'multiset', color: '4EC9B0' },
    { match: 'unordered_map', color: '4EC9B0' }, { match: 'unordered_set', color: '4EC9B0' },
    { match: 'unordered_multimap', color: '4EC9B0' }, { match: 'unordered_multiset', color: '4EC9B0' },
    { match: 'list', color: '4EC9B0' }, { match: 'deque', color: '4EC9B0' },
    { match: 'queue', color: '4EC9B0' }, { match: 'priority_queue', color: '4EC9B0' },
    { match: 'stack', color: '4EC9B0' }, { match: 'array', color: '4EC9B0' },
    { match: 'span', color: '4EC9B0' }, { match: 'string_view', color: '4EC9B0' },
    { match: 'optional', color: '4EC9B0' }, { match: 'variant', color: '4EC9B0' },
    { match: 'any', color: '4EC9B0' },
    // utility
    { match: 'pair', color: '4EC9B0' }, { match: 'make_pair', color: '4EC9B0' },
    { match: 'tuple', color: '4EC9B0' }, { match: 'make_tuple', color: '4EC9B0' },
    { match: 'get', color: '4EC9B0' }, { match: 'tie', color: '4EC9B0' },
    { match: 'forward', color: '4EC9B0' }, { match: 'move', color: '4EC9B0' },
    { match: 'swap', color: '4EC9B0' }, { match: 'exchange', color: '4EC9B0' },
    // iterator
    { match: 'back_inserter', color: '4EC9B0' }, { match: 'front_inserter', color: '4EC9B0' },
    { match: 'inserter', color: '4EC9B0' }, { match: 'make_move_iterator', color: '4EC9B0' },
    // thread  
    { match: 'thread', color: '4EC9B0' }, { match: 'mutex', color: '4EC9B0' },
    { match: 'lock_guard', color: '4EC9B0' }, { match: 'unique_lock', color: '4EC9B0' },
    { match: 'shared_lock', color: '4EC9B0' }, { match: 'scoped_lock', color: '4EC9B0' },
    { match: 'condition_variable', color: '4EC9B0' }, { match: 'async', color: '4EC9B0' },
    { match: 'future', color: '4EC9B0' }, { match: 'promise', color: '4EC9B0' },
    { match: 'packaged_task', color: '4EC9B0' }, { match: 'this_thread', color: '4EC9B0' },
    // fstream
    { match: 'ifstream', color: '4EC9B0' }, { match: 'ofstream', color: '4EC9B0' },
    { match: 'fstream', color: '4EC9B0' }, { match: 'stringstream', color: '4EC9B0' },
    { match: 'istringstream', color: '4EC9B0' }, { match: 'ostringstream', color: '4EC9B0' },
    // filesystem
    { match: 'filesystem', color: '4EC9B0' }, { match: 'path', color: '4EC9B0' },
    { match: 'directory_entry', color: '4EC9B0' }, { match: 'directory_iterator', color: '4EC9B0' },
    { match: 'recursive_directory_iterator', color: '4EC9B0' },
    // chrono
    { match: 'duration', color: '4EC9B0' }, { match: 'time_point', color: '4EC9B0' },
    { match: 'clock', color: '4EC9B0' }, { match: 'system_clock', color: '4EC9B0' },
    { match: 'steady_clock', color: '4EC9B0' }, { match: 'high_resolution_clock', color: '4EC9B0' },
    { match: 'milliseconds', color: '4EC9B0' }, { match: 'seconds', color: '4EC9B0' },
    { match: 'minutes', color: '4EC9B0' }, { match: 'hours', color: '4EC9B0' },
    // regex
    { match: 'regex', color: '4EC9B0' }, { match: 'smatch', color: '4EC9B0' },
    { match: 'sregex_iterator', color: '4EC9B0' }, { match: 'regex_search', color: '4EC9B0' },
    { match: 'regex_match', color: '4EC9B0' }, { match: 'regex_replace', color: '4EC9B0' },
    // numeric
    { match: 'numeric_limits', color: '4EC9B0' }, { match: 'iota', color: '4EC9B0' },
    { match: 'gcd', color: '4EC9B0' }, { match: 'lcm', color: '4EC9B0' },
    { match: 'midpoint', color: '4EC9B0' }, { match: 'lerp', color: '4EC9B0' },
    // functional
    { match: 'function', color: '4EC9B0' }, { match: 'bind', color: '4EC9B0' },
    { match: 'ref', color: '4EC9B0' }, { match: 'cref', color: '4EC9B0' },
    { match: 'mem_fn', color: '4EC9B0' },
    // type traits
    { match: 'is_same', color: '4EC9B0' }, { match: 'is_const', color: '4EC9B0' },
    { match: 'is_pointer', color: '4EC9B0' }, { match: 'is_reference', color: '4EC9B0' },
    { match: 'remove_reference', color: '4EC9B0' }, { match: 'decay', color: '4EC9B0' },
    { match: 'enable_if', color: '4EC9B0' }, { match: 'conditional', color: '4EC9B0' },
    { match: 'invoke_result', color: '4EC9B0' },
    // C++20 concepts
    { match: 'same_as', color: '4EC9B0' }, { match: 'derived_from', color: '4EC9B0' },
    { match: 'convertible_to', color: '4EC9B0' }, { match: 'integral', color: '4EC9B0' },
    { match: 'floating_point', color: '4EC9B0' }, { match: 'copy_constructible', color: '4EC9B0' },
    // exceptions
    { match: 'exception', color: '4EC9B0' }, { match: 'runtime_error', color: '4EC9B0' },
    { match: 'logic_error', color: '4EC9B0' }, { match: 'invalid_argument', color: '4EC9B0' },
    { match: 'out_of_range', color: '4EC9B0' }, { match: 'bad_alloc', color: '4EC9B0' },
    // io manipulators
    { match: 'setw', color: '4EC9B0' }, { match: 'setprecision', color: '4EC9B0' },
    { match: 'setfill', color: '4EC9B0' }, { match: 'fixed', color: '4EC9B0' },
    { match: 'scientific', color: '4EC9B0' }, { match: 'hex', color: '4EC9B0' },
    { match: 'oct', color: '4EC9B0' }, { match: 'dec', color: '4EC9B0' },
    { match: 'boolalpha', color: '4EC9B0' },
    // C++ cast operators
    { match: 'static_cast', color: '4EC9B0' }, { match: 'dynamic_cast', color: '4EC9B0' },
    { match: 'const_cast', color: '4EC9B0' }, { match: 'reinterpret_cast', color: '4EC9B0' },
    // stream members
    { match: 'good', color: '4EC9B0' }, { match: 'eof', color: '4EC9B0' },
    { match: 'fail', color: '4EC9B0' }, { match: 'bad', color: '4EC9B0' },
    { match: 'open', color: '4EC9B0' }, { match: 'close', color: '4EC9B0' },
    { match: 'is_open', color: '4EC9B0' }, { match: 'rdbuf', color: '4EC9B0' },
    { match: 'tellg', color: '4EC9B0' }, { match: 'tellp', color: '4EC9B0' },
    { match: 'seekg', color: '4EC9B0' }, { match: 'seekp', color: '4EC9B0' },
    { match: 'ignore', color: '4EC9B0' }, { match: 'peek', color: '4EC9B0' },
    { match: 'putback', color: '4EC9B0' }, { match: 'unget', color: '4EC9B0' },
    { match: 'read', color: '4EC9B0' }, { match: 'write', color: '4EC9B0' },
    { match: 'gcount', color: '4EC9B0' }, { match: 'precision', color: '4EC9B0' },
    { match: 'width', color: '4EC9B0' }, { match: 'fill', color: '4EC9B0' },
    { match: 'flush', color: '4EC9B0' },
    // memory
    { match: 'allocator', color: '4EC9B0' }, { match: 'addressof', color: '4EC9B0' },
    { match: 'to_address', color: '4EC9B0' },
    // random
    { match: 'random_device', color: '4EC9B0' }, { match: 'mt19937', color: '4EC9B0' },
    { match: 'uniform_int_distribution', color: '4EC9B0' },
    { match: 'uniform_real_distribution', color: '4EC9B0' },
    { match: 'normal_distribution', color: '4EC9B0' },
    // atomic
    { match: 'atomic', color: '4EC9B0' }, { match: 'atomic_flag', color: '4EC9B0' },
    { match: 'memory_order', color: '4EC9B0' },
    // cmath
    { match: 'sqrt', color: '4EC9B0' }, { match: 'cbrt', color: '4EC9B0' },
    { match: 'hypot', color: '4EC9B0' }, { match: 'pow', color: '4EC9B0' },
    { match: 'exp', color: '4EC9B0' }, { match: 'log', color: '4EC9B0' },
    { match: 'log2', color: '4EC9B0' }, { match: 'log10', color: '4EC9B0' },
    { match: 'sin', color: '4EC9B0' }, { match: 'cos', color: '4EC9B0' },
    { match: 'tan', color: '4EC9B0' }, { match: 'asin', color: '4EC9B0' },
    { match: 'acos', color: '4EC9B0' }, { match: 'atan', color: '4EC9B0' },
    { match: 'atan2', color: '4EC9B0' }, { match: 'sinh', color: '4EC9B0' },
    { match: 'cosh', color: '4EC9B0' }, { match: 'tanh', color: '4EC9B0' },
    { match: 'ceil', color: '4EC9B0' }, { match: 'floor', color: '4EC9B0' },
    { match: 'round', color: '4EC9B0' }, { match: 'trunc', color: '4EC9B0' },
    { match: 'abs', color: '4EC9B0' }, { match: 'fabs', color: '4EC9B0' },
    { match: 'fmod', color: '4EC9B0' }, { match: 'remainder', color: '4EC9B0' },
    { match: 'fmax', color: '4EC9B0' }, { match: 'fmin', color: '4EC9B0' },
    { match: 'fdim', color: '4EC9B0' }, { match: 'nan', color: '4EC9B0' },
    { match: 'isfinite', color: '4EC9B0' }, { match: 'isinf', color: '4EC9B0' },
    { match: 'isnan', color: '4EC9B0' }, { match: 'isnormal', color: '4EC9B0' },
    // cstdlib
    { match: 'malloc', color: '4EC9B0' }, { match: 'calloc', color: '4EC9B0' },
    { match: 'realloc', color: '4EC9B0' }, { match: 'free', color: '4EC9B0' },
    { match: 'atexit', color: '4EC9B0' }, { match: 'exit', color: '4EC9B0' },
    { match: 'abort', color: '4EC9B0' }, { match: 'getenv', color: '4EC9B0' },
    { match: 'system', color: '4EC9B0' }, { match: 'qsort', color: '4EC9B0' },
    { match: 'bsearch', color: '4EC9B0' }, { match: 'rand', color: '4EC9B0' },
    { match: 'srand', color: '4EC9B0' }, { match: 'atoi', color: '4EC9B0' },
    { match: 'atol', color: '4EC9B0' }, { match: 'atoll', color: '4EC9B0' },
    { match: 'atof', color: '4EC9B0' }, { match: 'strtol', color: '4EC9B0' },
    { match: 'strtoll', color: '4EC9B0' }, { match: 'strtoul', color: '4EC9B0' },
    { match: 'strtoull', color: '4EC9B0' }, { match: 'strtof', color: '4EC9B0' },
    { match: 'strtod', color: '4EC9B0' }, { match: 'strtold', color: '4EC9B0' },
    // cstdio
    { match: 'printf', color: '4EC9B0' }, { match: 'fprintf', color: '4EC9B0' },
    { match: 'sprintf', color: '4EC9B0' }, { match: 'snprintf', color: '4EC9B0' },
    { match: 'scanf', color: '4EC9B0' }, { match: 'fscanf', color: '4EC9B0' },
    { match: 'sscanf', color: '4EC9B0' }, { match: 'fopen', color: '4EC9B0' },
    { match: 'fclose', color: '4EC9B0' }, { match: 'fread', color: '4EC9B0' },
    { match: 'fwrite', color: '4EC9B0' }, { match: 'fseek', color: '4EC9B0' },
    { match: 'ftell', color: '4EC9B0' }, { match: 'rewind', color: '4EC9B0' },
    { match: 'fgets', color: '4EC9B0' }, { match: 'fputs', color: '4EC9B0' },
    { match: 'feof', color: '4EC9B0' }, { match: 'ferror', color: '4EC9B0' },
    { match: 'clearerr', color: '4EC9B0' }, { match: 'perror', color: '4EC9B0' },
    { match: 'fflush', color: '4EC9B0' }, { match: 'getchar', color: '4EC9B0' },
    { match: 'putchar', color: '4EC9B0' }, { match: 'gets', color: '4EC9B0' },
    { match: 'puts', color: '4EC9B0' }, { match: 'remove', color: '4EC9B0' },
    { match: 'rename', color: '4EC9B0' }, { match: 'tmpfile', color: '4EC9B0' },
    { match: 'tmpnam', color: '4EC9B0' }, { match: 'setbuf', color: '4EC9B0' },
    { match: 'setvbuf', color: '4EC9B0' },
    // cstring
    { match: 'strlen', color: '4EC9B0' }, { match: 'strcpy', color: '4EC9B0' },
    { match: 'strncpy', color: '4EC9B0' }, { match: 'strcat', color: '4EC9B0' },
    { match: 'strncat', color: '4EC9B0' }, { match: 'strcmp', color: '4EC9B0' },
    { match: 'strncmp', color: '4EC9B0' }, { match: 'strchr', color: '4EC9B0' },
    { match: 'strrchr', color: '4EC9B0' }, { match: 'strstr', color: '4EC9B0' },
    { match: 'strtok', color: '4EC9B0' }, { match: 'memset', color: '4EC9B0' },
    { match: 'memcpy', color: '4EC9B0' }, { match: 'memmove', color: '4EC9B0' },
    { match: 'memcmp', color: '4EC9B0' }, { match: 'memchr', color: '4EC9B0' },
    { match: 'strerror', color: '4EC9B0' }, { match: 'strcoll', color: '4EC9B0' },
    { match: 'strxfrm', color: '4EC9B0' },
    // ctype
    { match: 'isalnum', color: '4EC9B0' }, { match: 'isalpha', color: '4EC9B0' },
    { match: 'islower', color: '4EC9B0' }, { match: 'isupper', color: '4EC9B0' },
    { match: 'isdigit', color: '4EC9B0' }, { match: 'isxdigit', color: '4EC9B0' },
    { match: 'iscntrl', color: '4EC9B0' }, { match: 'isgraph', color: '4EC9B0' },
    { match: 'isspace', color: '4EC9B0' }, { match: 'isblank', color: '4EC9B0' },
    { match: 'ispunct', color: '4EC9B0' }, { match: 'isprint', color: '4EC9B0' },
    { match: 'tolower', color: '4EC9B0' }, { match: 'toupper', color: '4EC9B0' },
    // C++20 ranges
    { match: 'begin', color: '4EC9B0' }, { match: 'end', color: '4EC9B0' },
    { match: 'rbegin', color: '4EC9B0' }, { match: 'rend', color: '4EC9B0' },
    { match: 'size', color: '4EC9B0' }, { match: 'empty', color: '4EC9B0' },
    { match: 'data', color: '4EC9B0' },
    // Initializer list
    { match: 'initializer_list', color: '4EC9B0' },
    // Type info
    { match: 'type_info', color: '4EC9B0' }, { match: 'type_index', color: '4EC9B0' },
    { match: 'typeid', color: '4EC9B0' },
    // Ratio
    { match: 'ratio', color: '4EC9B0' },
    // bitset
    { match: 'bitset', color: '4EC9B0' },
    // valarray
    { match: 'valarray', color: '4EC9B0' }, { match: 'slice', color: '4EC9B0' },
    { match: 'gslice', color: '4EC9B0' },
    // locale
    { match: 'locale', color: '4EC9B0' }, { match: 'collate', color: '4EC9B0' },
    { match: 'ctype', color: '4EC9B0' }, { match: 'numpunct', color: '4EC9B0' },
    { match: 'numpunct_byname', color: '4EC9B0' }, { match: 'num_get', color: '4EC9B0' },
    { match: 'num_put', color: '4EC9B0' }, { match: 'moneypunct', color: '4EC9B0' },
    { match: 'moneypunct_byname', color: '4EC9B0' }, { match: 'money_get', color: '4EC9B0' },
    { match: 'money_put', color: '4EC9B0' },
    { match: 'std', color: '5ce65c' },
    { match: 'argc', color: 'd16969' },
    { match: 'argv', color: 'd16969' },
    { match: 'envp', color: 'd16969' },
    { match: 'errno', color: 'd16969' }
  ])

  var cppProvider = vscode.languages.registerCompletionProvider('cpp', {
    provideCompletionItems: function(document, position) {
      var items = []
      var keywords = [
        { label: 'auto', kind: vscode.CompletionItemKind.Keyword, insertText: 'auto', detail: 'Automatic type deduction' },
        { label: 'class', kind: vscode.CompletionItemKind.Keyword, insertText: 'class ', detail: 'Class definition' },
        { label: 'constexpr', kind: vscode.CompletionItemKind.Keyword, insertText: 'constexpr ', detail: 'Constant expression' },
        { label: 'delete', kind: vscode.CompletionItemKind.Keyword, insertText: 'delete', detail: 'Delete object' },
        { label: 'explicit', kind: vscode.CompletionItemKind.Keyword, insertText: 'explicit ', detail: 'Explicit constructor' },
        { label: 'friend', kind: vscode.CompletionItemKind.Keyword, insertText: 'friend ', detail: 'Friend declaration' },
        { label: 'mutable', kind: vscode.CompletionItemKind.Keyword, insertText: 'mutable ', detail: 'Mutable member' },
        { label: 'namespace', kind: vscode.CompletionItemKind.Keyword, insertText: 'namespace ', detail: 'Namespace definition' },
        { label: 'noexcept', kind: vscode.CompletionItemKind.Keyword, insertText: 'noexcept', detail: 'No exception specifier' },
        { label: 'nullptr', kind: vscode.CompletionItemKind.Keyword, insertText: 'nullptr', detail: 'Null pointer literal' },
        { label: 'operator', kind: vscode.CompletionItemKind.Keyword, insertText: 'operator ', detail: 'Operator overloading' },
        { label: 'override', kind: vscode.CompletionItemKind.Keyword, insertText: 'override', detail: 'Override specifier' },
        { label: 'private', kind: vscode.CompletionItemKind.Keyword, insertText: 'private:', detail: 'Private access' },
        { label: 'protected', kind: vscode.CompletionItemKind.Keyword, insertText: 'protected:', detail: 'Protected access' },
        { label: 'public', kind: vscode.CompletionItemKind.Keyword, insertText: 'public:', detail: 'Public access' },
        { label: 'template', kind: vscode.CompletionItemKind.Keyword, insertText: 'template <typename T>', detail: 'Template declaration' },
        { label: 'throw', kind: vscode.CompletionItemKind.Keyword, insertText: 'throw ', detail: 'Throw exception' },
        { label: 'try', kind: vscode.CompletionItemKind.Keyword, insertText: 'try {\\n  \\n} catch () {\\n  \\n}', detail: 'Try-catch block' },
        { label: 'typename', kind: vscode.CompletionItemKind.Keyword, insertText: 'typename', detail: 'Type name in template' },
        { label: 'using', kind: vscode.CompletionItemKind.Keyword, insertText: 'using ', detail: 'Using declaration' },
        { label: 'virtual', kind: vscode.CompletionItemKind.Keyword, insertText: 'virtual ', detail: 'Virtual function' }
      ]
      var snippets = [
        { label: 'main', kind: vscode.CompletionItemKind.Snippet, insertText: 'int main(int argc, char *argv[]) {\\n  \\n  return 0;\\n}', detail: 'Main function' },
        { label: 'class', kind: vscode.CompletionItemKind.Snippet, insertText: 'class  {\\npublic:\\n  ();\\n  ~();\\n  \\nprivate:\\n  \\n};', detail: 'Class template' },
        { label: 'struct', kind: vscode.CompletionItemKind.Snippet, insertText: 'struct  {\\n  \\n};', detail: 'Struct template' },
        { label: 'func', kind: vscode.CompletionItemKind.Snippet, insertText: 'void function_name() {\\n  \\n}', detail: 'Function template' },
        { label: 'for', kind: vscode.CompletionItemKind.Snippet, insertText: 'for (int i = 0; i < ; i++) {\\n  \\n}', detail: 'For loop' },
        { label: 'foreach', kind: vscode.CompletionItemKind.Snippet, insertText: 'for (const auto& elem : ) {\\n  \\n}', detail: 'Range-based for loop' },
        { label: 'if', kind: vscode.CompletionItemKind.Snippet, insertText: 'if () {\\n  \\n}', detail: 'If statement' },
        { label: 'while', kind: vscode.CompletionItemKind.Snippet, insertText: 'while () {\\n  \\n}', detail: 'While loop' },
        { label: 'do', kind: vscode.CompletionItemKind.Snippet, insertText: 'do {\\n  \\n} while ();', detail: 'Do-while loop' },
        { label: 'switch', kind: vscode.CompletionItemKind.Snippet, insertText: 'switch () {\\n  case :\\n    break;\\n  default:\\n    break;\\n}', detail: 'Switch statement' },
        { label: 'include', kind: vscode.CompletionItemKind.Snippet, insertText: '#include <>', detail: 'Include header' },
        { label: 'include_iostream', kind: vscode.CompletionItemKind.Snippet, insertText: '#include <iostream>', detail: 'Include iostream' },
        { label: 'include_vector', kind: vscode.CompletionItemKind.Snippet, insertText: '#include <vector>', detail: 'Include vector' },
        { label: 'include_string', kind: vscode.CompletionItemKind.Snippet, insertText: '#include <string>', detail: 'Include string' },
        { label: 'using_ns', kind: vscode.CompletionItemKind.Snippet, insertText: 'using namespace std;', detail: 'Using namespace std' },
        { label: 'cout', kind: vscode.CompletionItemKind.Snippet, insertText: 'cout <<  << endl;', detail: 'Console output' },
        { label: 'cin', kind: vscode.CompletionItemKind.Snippet, insertText: 'cin >> ;', detail: 'Console input' },
        { label: 'lambda', kind: vscode.CompletionItemKind.Snippet, insertText: '[]( ) {  }', detail: 'Lambda expression' },
        { label: 'smartptr', kind: vscode.CompletionItemKind.Snippet, insertText: 'auto ptr = make_shared<type>()', detail: 'Smart pointer' }
      ]
      var allItems = keywords.concat(snippets)
      for (var i = 0; i < allItems.length; i++) items.push(allItems[i])
      return items
    }
  })

  var compiler = vscode.terminal.registerCompiler({
    id: 'cpp.compiler',
    label: 'C++ Compiler (g++)',
    command: 'g++',
    args: ['-Wall', '-std=c++17', '-o', 'output', 'main.cpp'],
    fileExtensions: ['.cpp', '.cc', '.cxx']
  })

  var compileCmd = vscode.commands.registerCommand('cpp.compile', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) { vscode.window.showErrorMessage('No file open'); return }
    var filePath = doc.uri
    var outputName = filePath.replace(/\.(cpp|cc|cxx)$/, '')
    vscode.terminal.sendText('g++ -Wall -std=c++17 -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling: ' + filePath)
  })

  var runCmd = vscode.commands.registerCommand('cpp.run', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) { vscode.window.showErrorMessage('No file open'); return }
    var filePath = doc.uri
    var outputName = filePath.replace(/\.(cpp|cc|cxx)$/, '')
    vscode.terminal.sendText('g++ -Wall -std=c++17 -o "' + outputName + '" "' + filePath + '" && "' + outputName + '"')
    vscode.window.showInformationMessage('Compiling and running: ' + filePath)
  })

  var debugCmd = vscode.commands.registerCommand('cpp.compileDebug', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) { vscode.window.showErrorMessage('No file open'); return }
    var filePath = doc.uri
    var outputName = filePath.replace(/\.(cpp|cc|cxx)$/, '')
    vscode.terminal.sendText('g++ -g -Wall -std=c++17 -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling with debug info: ' + filePath)
  })

  var optCmd = vscode.commands.registerCommand('cpp.compileOptimized', function() {
    var doc = vscode.editor.getActiveDocument()
    if (!doc || !doc.uri) { vscode.window.showErrorMessage('No file open'); return }
    var filePath = doc.uri
    var outputName = filePath.replace(/\.(cpp|cc|cxx)$/, '')
    vscode.terminal.sendText('g++ -O3 -Wall -std=c++17 -o "' + outputName + '" "' + filePath + '"')
    vscode.window.showInformationMessage('Compiling with -O3: ' + filePath)
  })

  var newFileCmd = vscode.commands.registerCommand('cpp.newFile', function() {
    var template = '#include <iostream>\n#include <string>\n\nint main(int argc, char *argv[]) {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n'
    var doc = vscode.editor.getActiveDocument()
    if (doc) { vscode.editor.replaceSelection(template) }
    else { vscode.window.showErrorMessage('No file open to insert template') }
  })

  var cppTemplate = vscode.workspace.registerProjectTemplate({
    id: 'cpp-basic',
    name: 'C++ Project',
    description: 'Basic C++ project with main.cpp and Makefile',
    language: 'cpp',
    files: {
      'src/main.cpp': '#include <iostream>\n#include <string>\n\nint main(int argc, char *argv[]) {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
      'include/utils.hpp': '#ifndef UTILS_HPP\n#define UTILS_HPP\n\n#include <string>\n\nstd::string greet(const std::string& name);\n\n#endif\n',
      'src/utils.cpp': '#include "utils.hpp"\n\nstd::string greet(const std::string& name) {\n    return "Hello, " + name + "!";\n}\n',
      'Makefile': 'CXX = g++\nCXXFLAGS = -Wall -Wextra -std=c++17 -Iinclude\nTARGET = main\nSRCDIR = src\nSRCS = $(wildcard $(SRCDIR)/*.cpp)\nOBJS = $(SRCS:.cpp=.o)\n\n.PHONY: all clean run\n\nall: $(TARGET)\n\n$(TARGET): $(OBJS)\n\\t$(CXX) $(CXXFLAGS) -o $@ $^\n\n$(SRCDIR)/%.o: $(SRCDIR)/%.cpp\n\\t$(CXX) $(CXXFLAGS) -c $< -o $@\n\nclean:\n\\trm -f $(OBJS) $(TARGET)\n\nrun: $(TARGET)\n\\t./$(TARGET)\n'
    }
  })

  context.subscriptions.push(lang)
  context.subscriptions.push(highlightRules)
  context.subscriptions.push(cppProvider)
  context.subscriptions.push(compiler)
  context.subscriptions.push(compileCmd)
  context.subscriptions.push(runCmd)
  context.subscriptions.push(debugCmd)
  context.subscriptions.push(optCmd)
  context.subscriptions.push(newFileCmd)
  context.subscriptions.push(cppTemplate)

  console.log('[CPP-SUPPORT] All commands and providers registered')
}
