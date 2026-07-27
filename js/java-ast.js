/**
 * JavaBox AST & Code Structure Outline Generator + Bytecode Mockup Viewer
 */

class JavaAST {
  static parseStructure(code) {
    const outline = {
      imports: [],
      classes: []
    };

    const lines = code.split('\n');
    let currentClass = null;

    lines.forEach((lineText, index) => {
      const lineNum = index + 1;
      const trimmed = lineText.trim();

      // Check imports
      if (trimmed.startsWith('import ')) {
        const importName = trimmed.replace('import ', '').replace(';', '').trim();
        outline.imports.push({ name: importName, line: lineNum });
        return;
      }

      // Check class/interface definition
      const classMatch = trimmed.match(/(public\s+|private\s+|protected\s+)?(class|interface)\s+([A-Za-z0-9_]+)/);
      if (classMatch) {
        currentClass = {
          type: classMatch[2],
          name: classMatch[3],
          line: lineNum,
          access: classMatch[1] ? classMatch[1].trim() : 'default',
          methods: [],
          fields: []
        };
        outline.classes.push(currentClass);
        return;
      }

      // Check method definitions
      if (currentClass) {
        const methodMatch = trimmed.match(/(public|private|protected|static|\s)+[\w<>\[\]]+\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{?/);
        if (methodMatch && !trimmed.startsWith('if') && !trimmed.startsWith('for') && !trimmed.startsWith('while') && !trimmed.startsWith('switch') && !trimmed.startsWith('catch')) {
          const methodName = methodMatch[2];
          const params = methodMatch[3];
          currentClass.methods.push({
            name: `${methodName}(${params})`,
            line: lineNum,
            isMain: methodName === 'main'
          });
        } else {
          // Check fields
          const fieldMatch = trimmed.match(/(public|private|protected)\s+(static\s+)?(final\s+)?([\w<>\[\]]+)\s+([A-Za-z0-9_]+)\s*(=|;)/);
          if (fieldMatch) {
            currentClass.fields.push({
              name: `${fieldMatch[5]}: ${fieldMatch[4]}`,
              line: lineNum,
              access: fieldMatch[1]
            });
          }
        }
      }
    });

    return outline;
  }

  static generateBytecodeView(code) {
    const ast = this.parseStructure(code);
    let bytecode = `// Compiled from JavaBox in-browser source\n`;

    if (ast.classes.length === 0) {
      return `// No public/class definitions found to disassemble.`;
    }

    ast.classes.forEach(cls => {
      bytecode += `public class ${cls.name} {\n`;
      bytecode += `  public ${cls.name}();\n`;
      bytecode += `    Code:\n`;
      bytecode += `       0: aload_0\n`;
      bytecode += `       1: invokespecial #1                  // Method java/lang/Object."<init>":()V\n`;
      bytecode += `       4: return\n\n`;

      cls.methods.forEach((m, idx) => {
        bytecode += `  public static void ${m.name};\n`;
        bytecode += `    descriptor: ([Ljava/lang/String;)V\n`;
        bytecode += `    flags: (0x0009) ACC_PUBLIC, ACC_STATIC\n`;
        bytecode += `    Code:\n`;
        bytecode += `      stack=3, locals=${idx + 2}, args_size=1\n`;
        bytecode += `         0: getstatic     #2                  // Field java/lang/System.out:Ljava/io/PrintStream;\n`;
        bytecode += `         3: ldc           #3                  // String [JavaBox Executed Step]\n`;
        bytecode += `         5: invokevirtual #4                  // Method java/io/PrintStream.println:(Ljava/lang/String;)V\n`;
        bytecode += `         8: iconst_1\n`;
        bytecode += `         9: istore_1\n`;
        bytecode += `        10: iload_1\n`;
        bytecode += `        11: ireturn\n`;
        bytecode += `      LineNumberTable:\n`;
        bytecode += `        line ${m.line}: 0\n\n`;
      });

      bytecode += `}\n`;
    });

    return bytecode;
  }
}
