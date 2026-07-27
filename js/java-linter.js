/**
 * JavaBox Strict Java Compiler & Linter
 * Detects missing semicolons, unmatched braces, syntax errors, and sets Monaco error markers.
 */

class JavaLinter {
  static analyze(code) {
    const diagnostics = [];
    const lines = code.split('\n');

    let braceDepth = 0;
    let parenDepth = 0;
    let bracketDepth = 0;
    let insideBlockComment = false;

    lines.forEach((lineText, index) => {
      const lineNum = index + 1;
      const trimmed = lineText.trim();

      // Check block comments
      if (trimmed.includes('/*')) insideBlockComment = true;
      if (trimmed.includes('*/')) {
        insideBlockComment = false;
        return;
      }

      if (insideBlockComment || trimmed.startsWith('//') || trimmed === '') {
        return;
      }

      // 1. Bracket counting & balance check
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
        else if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
      }

      // 2. Strict Semicolon Validation
      // Standard Java statements must end with a semicolon ';'
      const isHeaderOrStructure = (
        trimmed.endsWith('{') ||
        trimmed.endsWith('}') ||
        trimmed.startsWith('public class') ||
        trimmed.startsWith('class') ||
        trimmed.startsWith('interface') ||
        trimmed.startsWith('import') ||
        trimmed.startsWith('if') ||
        trimmed.startsWith('else') ||
        trimmed.startsWith('for') ||
        trimmed.startsWith('while') ||
        trimmed.startsWith('do') ||
        trimmed.startsWith('switch') ||
        trimmed.startsWith('case') ||
        trimmed.startsWith('default:') ||
        trimmed.startsWith('try') ||
        trimmed.startsWith('catch') ||
        trimmed.startsWith('finally') ||
        trimmed.startsWith('@') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*')
      );

      if (!trimmed.endsWith(';') && !isHeaderOrStructure) {
        // Exclude lines ending with operators in multi-line expressions
        if (!trimmed.endsWith('+') && !trimmed.endsWith('-') && !trimmed.endsWith('*') && !trimmed.endsWith('/') && !trimmed.endsWith('=')) {
          diagnostics.push({
            line: lineNum,
            startColumn: 1,
            endColumn: lineText.length + 1,
            type: 'error',
            message: `Syntax Error: Missing semicolon ';' at line ${lineNum}`
          });
        }
      }

      // 3. String literal check
      let quoteCount = 0;
      for (let i = 0; i < trimmed.length; i++) {
        if (trimmed[i] === '"' && (i === 0 || trimmed[i - 1] !== '\\')) {
          quoteCount++;
        }
      }
      if (quoteCount % 2 !== 0) {
        diagnostics.push({
          line: lineNum,
          startColumn: 1,
          endColumn: lineText.length + 1,
          type: 'error',
          message: `Compiler Error: Unterminated string literal at line ${lineNum}`
        });
      }

      // 4. Common Java beginner typos
      if (trimmed.includes('system.out') || trimmed.includes('System.Out')) {
        diagnostics.push({
          line: lineNum,
          startColumn: lineText.indexOf('system') + 1 || 1,
          endColumn: lineText.length + 1,
          type: 'warning',
          message: `Compiler Warning: Did you mean 'System.out'? Java is case-sensitive.`
        });
      }
    });

    if (braceDepth > 0) {
      diagnostics.push({
        line: lines.length,
        startColumn: 1,
        endColumn: 10,
        type: 'error',
        message: `Compiler Error: Missing ${braceDepth} closing brace(s) '}'`
      });
    } else if (braceDepth < 0) {
      diagnostics.push({
        line: lines.length,
        startColumn: 1,
        endColumn: 10,
        type: 'error',
        message: `Compiler Error: Unmatched closing brace '}'`
      });
    }

    return diagnostics;
  }
}
