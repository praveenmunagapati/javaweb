/**
 * JavaBox Real-Time Java Syntax Checker & Linter
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
      if (trimmed.includes('*/')) insideBlockComment = false;

      if (insideBlockComment || trimmed.startsWith('//') || trimmed === '') {
        return;
      }

      // 1. Bracket counting
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
        else if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
      }

      // 2. Missing semicolon detection for basic statements
      if (
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('{') &&
        !trimmed.endsWith('}') &&
        !trimmed.startsWith('if') &&
        !trimmed.startsWith('else') &&
        !trimmed.startsWith('for') &&
        !trimmed.startsWith('while') &&
        !trimmed.startsWith('public class') &&
        !trimmed.startsWith('class') &&
        !trimmed.startsWith('interface') &&
        !trimmed.startsWith('import') &&
        !trimmed.startsWith('@') &&
        !trimmed.startsWith('/*') &&
        !trimmed.startsWith('*') &&
        !trimmed.endsWith('*/')
      ) {
        // Exclude lines ending with trailing operators or multi-line statements
        if (!trimmed.endsWith('+') && !trimmed.endsWith('-') && !trimmed.endsWith('*') && !trimmed.endsWith('/') && !trimmed.endsWith('=')) {
          diagnostics.push({
            line: lineNum,
            type: 'warning',
            message: `Possible missing semicolon ';' at line ${lineNum}`
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
          type: 'error',
          message: `Unterminated string literal at line ${lineNum}`
        });
      }

      // 4. Common Java beginner typos
      if (trimmed.includes('system.out') || trimmed.includes('System.Out')) {
        diagnostics.push({
          line: lineNum,
          type: 'warning',
          message: `Did you mean 'System.out'? Java is case-sensitive.`
        });
      }

      if (trimmed.includes('String') && trimmed.includes('string ')) {
        diagnostics.push({
          line: lineNum,
          type: 'warning',
          message: `Java type 'String' should be capitalized.`
        });
      }
    });

    if (braceDepth > 0) {
      diagnostics.push({
        line: lines.length,
        type: 'error',
        message: `Missing ${braceDepth} closing brace(s) '}'`
      });
    } else if (braceDepth < 0) {
      diagnostics.push({
        line: lines.length,
        type: 'error',
        message: `Unmatched closing brace '}'`
      });
    }

    return diagnostics;
  }
}
