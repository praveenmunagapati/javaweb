/**
 * JavaBox Client-Side High-Speed Java Interpreter & Runtime Environment
 * Converts Java classes & syntax into valid JS ES6 classes and executes with console I/O, Scanner prompts, and 2D Canvas rendering!
 */

class JavaInterpreter {
  constructor(options = {}) {
    this.onOutput = options.onOutput || console.log;
    this.onError = options.onError || console.error;
    this.onPromptInput = options.onPromptInput || (async () => "0");
    this.canvasContext = options.canvasContext || null;
    this.canvasElement = options.canvasElement || null;
    this.maxExecutionSteps = 50000;
  }

  async run(code) {
    const startTime = performance.now();

    try {
      const scope = this.createRootScope();
      this.bindJavaCanvasAPI(scope);

      await this.evaluateJavaCode(code, scope);

      const duration = (performance.now() - startTime).toFixed(2);
      return { success: true, duration };
    } catch (err) {
      const duration = (performance.now() - startTime).toFixed(2);
      this.onError(`Runtime Error: ${err.message}`);
      return { success: false, error: err.message, duration };
    }
  }

  createRootScope() {
    const self = this;
    
    class Scanner {
      constructor(source) {
        this.inputBuffer = [];
      }

      async nextLine() {
        const val = await self.onPromptInput("Enter string input (nextLine):");
        return val !== null ? val : "";
      }

      async nextInt() {
        const val = await self.onPromptInput("Enter integer input (nextInt):");
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 0 : parsed;
      }

      async nextDouble() {
        const val = await self.onPromptInput("Enter double input (nextDouble):");
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0.0 : parsed;
      }

      close() {}
    }

    return {
      System: {
        out: {
          println: (msg = "") => self.onOutput(String(msg), "stdout"),
          print: (msg = "") => self.onOutput(String(msg), "stdout-inline"),
          format: (fmt, ...args) => self.onOutput(self.sprintf(fmt, args), "stdout")
        },
        err: {
          println: (msg = "") => self.onOutput(String(msg), "stderr")
        }
      },
      Math: Math,
      Scanner: Scanner,
      String: String,
      Integer: {
        parseInt: (str) => parseInt(str, 10),
        MAX_VALUE: 2147483647,
        MIN_VALUE: -2147483648
      },
      Double: {
        parseDouble: (str) => parseFloat(str)
      }
    };
  }

  bindJavaCanvasAPI(scope) {
    if (!this.canvasContext) return;
    const ctx = this.canvasContext;
    const canvas = this.canvasElement;

    class JavaCanvas {
      constructor(w = 600, h = 400) {
        if (canvas) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      clear(color = "#000000") {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      setStroke(color = "#ffffff", width = 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
      }

      drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      drawCircle(cx, cy, r) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
      }

      fillCircle(cx, cy, r, color = "#ffffff") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.fill();
      }

      drawRect(x, y, w, h) {
        ctx.strokeRect(x, y, w, h);
      }

      fillRect(x, y, w, h, color = "#ffffff") {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
      }

      drawText(text, x, y, font = "16px sans-serif", color = "#ffffff") {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
      }
    }

    scope.JavaCanvas = JavaCanvas;
  }

  sprintf(format, args) {
    let i = 0;
    return format.replace(/%[sd.0-9]*[fdfsd%]/g, (match) => {
      if (match === '%%') return '%';
      if (i >= args.length) return match;
      const arg = args[i++];
      if (match.includes('f')) {
        const decimalsMatch = match.match(/\.(\d+)f/);
        return decimalsMatch ? Number(arg).toFixed(parseInt(decimalsMatch[1], 10)) : String(arg);
      }
      return String(arg);
    });
  }

  async evaluateJavaCode(code, scope) {
    let translatedJS = this.translateJavaToJS(code);
    
    const scopeKeys = Object.keys(scope);
    const scopeValues = Object.values(scope);
    
    const asyncExecutor = new Function(
      ...scopeKeys,
      `return (async () => {
        ${translatedJS}
      })();`
    );

    await asyncExecutor(...scopeValues);
  }

  translateJavaToJS(javaCode) {
    let js = javaCode;

    // 1. Remove imports
    js = js.replace(/import\s+[^;]+;/g, '');

    // 2. Remove Java modifiers from fields/class declarations
    js = js.replace(/\b(public|protected|private|final|synchronized|volatile)\b/g, '');

    // 3. String.format translation
    js = js.replace(/String\.format\(([^)]+)\)/g, (match, args) => {
      return `(function() {
        const argsList = [${args}];
        const fmt = argsList[0];
        const rest = argsList.slice(1);
        return fmt.replace(/%[sd.0-9]*[fdfsd%]/g, function(m) {
          if (m === '%%') return '%';
          const a = rest.shift();
          if (m.includes('f')) {
            const dec = m.match(/\\.(\\d+)f/);
            return dec ? Number(a).toFixed(parseInt(dec[1])) : Number(a).toString();
          }
          return String(a);
        });
      })()`;
    });

    // 4. Clean method signatures inside class body
    // main method -> static async main(args)
    js = js.replace(/static\s+void\s+main\s*\(\s*String\[\]\s+([A-Za-z0-9_]+)\s*\)/g, 'static async main($1)');
    js = js.replace(/void\s+main\s*\(\s*String\[\]\s+([A-Za-z0-9_]+)\s*\)/g, 'static async main($1)');

    // static methods -> static methodName(paramList)
    js = js.replace(/static\s+(?:void|int|double|boolean|String|Object|[\w<>\[\]]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g, (match, name, params) => {
      const cleanParams = params.split(',').map(p => p.trim().split(/\s+/).pop()).join(', ');
      return `static ${name}(${cleanParams})`;
    });

    // instance methods inside classes -> methodName(paramList)
    js = js.replace(/(?:void|int|double|boolean|String|Object|[\w<>\[\]]+)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g, (match, name, params) => {
      if (name === 'if' || name === 'for' || name === 'while' || name === 'switch' || name === 'catch') return match;
      const cleanParams = params.split(',').map(p => p.trim().split(/\s+/).pop()).join(', ');
      return `${name}(${cleanParams}) {`;
    });

    // 5. Convert primitive variable declarations to let
    js = js.replace(/\b(int|double|float|long|short|boolean|char|String|var)\s+([A-Za-z0-9_]+)\s*=/g, 'let $2 =');
    js = js.replace(/\b(int|double|float|long|short|boolean|char|String|var)\s+([A-Za-z0-9_]+)\s*;/g, 'let $2;');

    // 6. Handle array initializers
    js = js.replace(/new\s+[\w<>\[\]]+\s*\{\s*([^}]+)\s*\}/g, '[$1]');

    // 7. Handle Scanner async calls
    js = js.replace(/([A-Za-z0-9_]+)\.(nextLine|nextInt|nextDouble)\(\)/g, 'await $1.$2()');

    // 8. Handle enhanced for loops: for (int x : arr) -> for (let x of arr)
    js = js.replace(/for\s*\(\s*(?:int|double|String|var|let|[\w<>]+)\s+([A-Za-z0-9_]+)\s*:\s*([^)]+)\)/g, 'for (let $1 of $2)');

    // 9. Automatic Main class launcher
    js += `
    if (typeof Main !== 'undefined' && typeof Main.main === 'function') {
      await Main.main();
    } else if (typeof ScannerDemo !== 'undefined' && typeof ScannerDemo.main === 'function') {
      await ScannerDemo.main();
    } else if (typeof DataStructures !== 'undefined' && typeof DataStructures.main === 'function') {
      await DataStructures.main();
    } else if (typeof CanvasGraphics !== 'undefined' && typeof CanvasGraphics.main === 'function') {
      await CanvasGraphics.main();
    } else if (typeof OOPDemo !== 'undefined' && typeof OOPDemo.main === 'function') {
      await OOPDemo.main();
    } else if (typeof JUnitTests !== 'undefined' && typeof JUnitTests.main === 'function') {
      await JUnitTests.main();
    }
    `;

    return js;
  }
}
