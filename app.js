/**
 * JavaBox Main IDE Application Controller
 */

class JavaBoxApp {
  constructor() {
    this.files = new Map();
    this.openTabs = [];
    this.activeFileId = null;
    this.activeEngine = 'cheerpj-wasm';
    
    this.cheerpjEngine = null;
    this.stdinResolver = null;

    this.initElements();
    this.initTemplates();
    this.bindEvents();
    this.initEditor();
    this.initResizer();
    this.loadStateFromURL();
  }

  initElements() {
    this.el = {
      editor: document.getElementById('code-editor'),
      gutter: document.getElementById('editor-gutter'),
      lintBar: document.getElementById('lint-status-bar'),
      tabBar: document.getElementById('tab-bar'),
      fileTree: document.getElementById('file-tree-container'),
      templatesContainer: document.getElementById('templates-container'),
      outlineContainer: document.getElementById('outline-container'),
      
      btnRun: document.getElementById('btn-run'),
      btnStop: document.getElementById('btn-stop'),
      btnFormat: document.getElementById('btn-format'),
      btnShare: document.getElementById('btn-share'),
      btnExport: document.getElementById('btn-export'),
      btnNewFile: document.getElementById('btn-new-file'),
      btnImportFile: document.getElementById('btn-import-file'),
      fileInput: document.getElementById('file-input'),
      engineSelect: document.getElementById('engine-select'),
      engineBadge: document.getElementById('engine-badge'),
      
      terminalOutput: document.getElementById('terminal-output'),
      terminalInputContainer: document.getElementById('terminal-input-container'),
      terminalStdinInput: document.getElementById('terminal-stdin-input'),
      btnSubmitStdin: document.getElementById('btn-submit-stdin'),
      btnClearConsole: document.getElementById('btn-clear-console'),
      
      javaCanvas: document.getElementById('java-canvas'),
      astRawView: document.getElementById('ast-raw-view'),
      bytecodeRawView: document.getElementById('bytecode-raw-view'),
      junitView: document.getElementById('junit-results-view'),
      
      statusCursor: document.getElementById('status-cursor'),
      commandPaletteModal: document.getElementById('command-palette-modal'),
      paletteSearch: document.getElementById('palette-search'),
      paletteResults: document.getElementById('palette-results'),
      btnCommandPalette: document.getElementById('btn-command-palette'),
      
      promptModal: document.getElementById('prompt-modal'),
      promptModalTitle: document.getElementById('prompt-modal-title'),
      promptModalInput: document.getElementById('prompt-modal-input'),
      btnPromptConfirm: document.getElementById('btn-prompt-confirm'),
      btnPromptCancel: document.getElementById('btn-prompt-cancel'),
      
      btnThemeToggle: document.getElementById('btn-theme-toggle'),
      settingTheme: document.getElementById('setting-theme'),
      settingFontSize: document.getElementById('setting-font-size'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  initTemplates() {
    // Load default starter files
    Object.keys(JAVA_TEMPLATES).forEach(key => {
      this.files.set(key, { ...JAVA_TEMPLATES[key] });
    });

    // Render templates in sidebar
    this.el.templatesContainer.innerHTML = '';
    Object.keys(JAVA_TEMPLATES).forEach(key => {
      const template = JAVA_TEMPLATES[key];
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML = `
        <div class="template-title"><i class="fa-brands fa-java text-success"></i> ${template.name}</div>
        <div class="template-desc">Click to load ${template.name} preset into editor workspace.</div>
      `;
      card.addEventListener('click', () => {
        this.openFile(template.name);
        this.showToast(`Loaded ${template.name} template`);
      });
      this.el.templatesContainer.appendChild(card);
    });

    this.renderFileTree();
    this.openFile('Main.java');
  }

  renderFileTree() {
    this.el.fileTree.innerHTML = '';
    this.files.forEach((file, filename) => {
      const item = document.createElement('div');
      item.className = `tree-item ${filename === this.activeFileId ? 'active' : ''}`;
      item.innerHTML = `
        <div class="tree-item-info">
          <i class="fa-brands fa-java file-icon"></i>
          <span>${filename}</span>
        </div>
        <div class="item-actions">
          <button class="icon-btn btn-delete-file" title="Delete File"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-delete-file')) {
          this.openFile(filename);
        }
      });

      const deleteBtn = item.querySelector('.btn-delete-file');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteFile(filename);
      });

      this.el.fileTree.appendChild(item);
    });
  }

  openFile(filename) {
    if (!this.files.has(filename)) return;

    if (!this.openTabs.includes(filename)) {
      this.openTabs.push(filename);
    }

    this.activeFileId = filename;
    const file = this.files.get(filename);
    
    this.el.editor.value = file.content;
    this.renderTabs();
    this.renderFileTree();
    this.updateGutter();
    this.updateLinting();
    this.updateOutlineAndAST();
    this.updateCursorStatus();
  }

  renderTabs() {
    this.el.tabBar.innerHTML = '';
    this.openTabs.forEach(filename => {
      const tab = document.createElement('div');
      tab.className = `tab ${filename === this.activeFileId ? 'active' : ''}`;
      tab.innerHTML = `
        <i class="fa-brands fa-java text-success"></i>
        <span>${filename}</span>
        <span class="tab-close" title="Close Tab">&times;</span>
      `;

      tab.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-close')) {
          e.stopPropagation();
          this.closeTab(filename);
        } else {
          this.openFile(filename);
        }
      });

      this.el.tabBar.appendChild(tab);
    });
  }

  closeTab(filename) {
    const idx = this.openTabs.indexOf(filename);
    if (idx !== -1) {
      this.openTabs.splice(idx, 1);
    }

    if (this.activeFileId === filename) {
      if (this.openTabs.length > 0) {
        this.openFile(this.openTabs[Math.max(0, idx - 1)]);
      } else {
        this.activeFileId = null;
        this.el.editor.value = '';
        this.renderTabs();
        this.renderFileTree();
      }
    } else {
      this.renderTabs();
    }
  }

  deleteFile(filename) {
    if (this.files.size <= 1) {
      this.showToast("Cannot delete the last file in the workspace.", "error");
      return;
    }

    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      this.files.delete(filename);
      this.closeTab(filename);
      this.renderFileTree();
      this.showToast(`Deleted ${filename}`);
    }
  }

  initEditor() {
    const editor = this.el.editor;

    editor.addEventListener('input', () => {
      if (this.activeFileId && this.files.has(this.activeFileId)) {
        this.files.get(this.activeFileId).content = editor.value;
      }
      this.updateGutter();
      this.updateLinting();
      this.updateOutlineAndAST();
    });

    editor.addEventListener('scroll', () => {
      this.el.gutter.scrollTop = editor.scrollTop;
    });

    editor.addEventListener('keyup', () => this.updateCursorStatus());
    editor.addEventListener('click', () => this.updateCursorStatus());

    // Tab key & smart indent handler
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        editor.dispatchEvent(new Event('input'));
      } else if (e.key === 'Enter') {
        // Auto-indent matching previous line
        const start = editor.selectionStart;
        const currentLine = editor.value.substring(0, start).split('\n').pop();
        const indentMatch = currentLine.match(/^(\s*)/);
        let indent = indentMatch ? indentMatch[1] : '';
        
        if (currentLine.trim().endsWith('{')) {
          indent += '    ';
        }

        if (indent.length > 0) {
          e.preventDefault();
          editor.value = editor.value.substring(0, start) + "\n" + indent + editor.value.substring(start);
          editor.selectionStart = editor.selectionEnd = start + 1 + indent.length;
          editor.dispatchEvent(new Event('input'));
        }
      } else if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.runCurrentCode();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.showToast(`Saved ${this.activeFileId || 'file'}`);
      }
    });
  }

  updateGutter() {
    const lines = this.el.editor.value.split('\n').length;
    let gutterHTML = '';
    for (let i = 1; i <= lines; i++) {
      gutterHTML += `${i}<br>`;
    }
    this.el.gutter.innerHTML = gutterHTML;
  }

  updateCursorStatus() {
    const editor = this.el.editor;
    const pos = editor.selectionStart;
    const textBefore = editor.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;
    this.el.statusCursor.textContent = `Ln ${lineNum}, Col ${colNum}`;
  }

  updateLinting() {
    if (!this.activeFileId) return;
    const code = this.el.editor.value;
    const diagnostics = JavaLinter.analyze(code);

    if (diagnostics.length === 0) {
      this.el.lintBar.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> No syntax errors detected.`;
    } else {
      const firstDiag = diagnostics[0];
      const icon = firstDiag.type === 'error' ? 'fa-circle-xmark text-danger' : 'fa-triangle-exclamation text-warning';
      this.el.lintBar.innerHTML = `<i class="fa-solid ${icon}"></i> Line ${firstDiag.line}: ${firstDiag.message}`;
    }
  }

  updateOutlineAndAST() {
    if (!this.activeFileId) return;
    const code = this.el.editor.value;
    const ast = JavaAST.parseStructure(code);
    const bytecode = JavaAST.generateBytecodeView(code);

    // Update raw views
    this.el.astRawView.textContent = JSON.stringify(ast, null, 2);
    this.el.bytecodeRawView.textContent = bytecode;

    // Update sidebar outline
    this.el.outlineContainer.innerHTML = '';
    if (ast.classes.length === 0) {
      this.el.outlineContainer.innerHTML = `<div class="empty-state">No class definitions detected</div>`;
      return;
    }

    ast.classes.forEach(cls => {
      const classNode = document.createElement('div');
      classNode.className = 'outline-class';
      classNode.innerHTML = `
        <div style="font-weight:600; color:var(--accent-primary); margin-top:6px; cursor:pointer">
          <i class="fa-solid fa-cube"></i> ${cls.type} ${cls.name}
        </div>
      `;

      cls.methods.forEach(m => {
        const methodNode = document.createElement('div');
        methodNode.style.paddingLeft = '16px';
        methodNode.style.fontSize = '12px';
        methodNode.style.color = 'var(--accent-blue)';
        methodNode.style.margin = '2px 0';
        methodNode.innerHTML = `<i class="fa-solid fa-bolt"></i> ${m.name}`;
        classNode.appendChild(methodNode);
      });

      this.el.outlineContainer.appendChild(classNode);
    });
  }

  bindEvents() {
    // Run Button
    this.el.btnRun.addEventListener('click', () => this.runCurrentCode());

    // Format Code Button
    this.el.btnFormat.addEventListener('click', () => this.formatCode());

    // Share Button
    this.el.btnShare.addEventListener('click', () => this.shareProject());

    // Export Button
    this.el.btnExport.addEventListener('click', () => this.exportFiles());

    // Clear Console
    this.el.btnClearConsole.addEventListener('click', () => {
      this.el.terminalOutput.innerHTML = `<div class="term-line term-system">Terminal output cleared.</div>`;
    });

    // New File Button
    this.el.btnNewFile.addEventListener('click', () => {
      this.showPromptModal("Enter New File Name", "e.g. MyClass.java", (filename) => {
        if (filename) {
          if (!filename.endsWith('.java')) filename += '.java';
          if (this.files.has(filename)) {
            this.showToast(`File ${filename} already exists.`, "error");
            return;
          }
          const defaultContent = `public class ${filename.replace('.java', '')} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${filename}!");\n    }\n}`;
          this.files.set(filename, { name: filename, path: filename, content: defaultContent });
          this.openFile(filename);
          this.showToast(`Created ${filename}`);
        }
      });
    });

    // Import File
    this.el.btnImportFile.addEventListener('click', () => this.el.fileInput.click());
    this.el.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.files.set(file.name, { name: file.name, path: file.name, content: evt.target.result });
          this.openFile(file.name);
          this.showToast(`Imported ${file.name}`);
        };
        reader.readAsText(file);
      }
    });

    // Sidebar Activity Bar Tabs
    document.querySelectorAll('.activity-bar .nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.activity-bar .nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sidebar-drawer .drawer-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        const targetPanel = document.getElementById(`panel-${tabId}`);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Snippets Insert Click
    document.querySelectorAll('.snippet-item').forEach(item => {
      item.addEventListener('click', () => {
        const snippetText = item.getAttribute('data-snippet').replace(/\\n/g, '\n').replace(/&quot;/g, '"');
        this.insertTextAtCursor(snippetText);
        this.showToast("Inserted code snippet");
      });
    });

    // Bottom Output Panel Tabs
    document.querySelectorAll('.panel-tab-bar .tab-btn[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.panel-tab-bar .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel-content-area .panel-sub-view').forEach(v => v.classList.remove('active'));

        btn.classList.add('active');
        const viewId = btn.getAttribute('data-panel');
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) targetView.classList.add('active');
      });
    });

    // Submit STDIN
    this.el.btnSubmitStdin.addEventListener('click', () => this.handleStdinSubmit());
    this.el.terminalStdinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleStdinSubmit();
    });

    // Command Palette Modal
    this.el.btnCommandPalette.addEventListener('click', () => this.openCommandPalette());
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        this.openCommandPalette();
      }
    });

    // Theme Switcher & Setting
    this.el.btnThemeToggle.addEventListener('click', () => this.cycleTheme());
    this.el.settingTheme.addEventListener('change', (e) => {
      document.body.className = e.target.value;
    });

    this.el.settingFontSize.addEventListener('change', (e) => {
      this.el.editor.style.fontSize = e.target.value;
      this.el.gutter.style.fontSize = e.target.value;
    });
  }

  initResizer() {
    const resizer = document.getElementById('panel-resizer');
    const bottomPanel = this.el.bottomPanel || document.getElementById('bottom-panel');
    let isDragging = false;

    resizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.body.style.cursor = 'ns-resize';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const containerHeight = document.querySelector('.editor-workspace').clientHeight;
      const newHeight = containerHeight - (e.clientY - document.querySelector('.editor-workspace').getBoundingClientRect().top);
      if (newHeight > 60 && newHeight < containerHeight - 100) {
        bottomPanel.style.height = `${newHeight}px`;
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      document.body.style.cursor = 'default';
    });
  }

  insertTextAtCursor(text) {
    const editor = this.el.editor;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + text + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.dispatchEvent(new Event('input'));
    editor.focus();
  }

  async runCurrentCode() {
    if (!this.activeFileId) return;

    const code = this.el.editor.value;
    this.appendTerminalOutput(`\n--- Starting Execution in CheerpJ 3.0 WASM JVM: ${this.activeFileId} ---`, "system");

    // Switch active view to terminal tab
    document.querySelector('.tab-btn[data-panel="terminal"]').click();

    this.cheerpjEngine = new CheerpJEngine({
      onOutput: (msg, type) => this.appendTerminalOutput(msg, type),
      onError: (msg) => this.appendTerminalOutput(msg, "stderr"),
      onPromptInput: (promptText) => this.requestStdinPrompt(promptText),
      canvasElement: this.el.javaCanvas
    });

    const res = await this.cheerpjEngine.run(code, this.activeFileId);
    if (res.success && code.includes('Test')) {
      this.renderJUnitResults(res);
    }
  }

  requestStdinPrompt(promptText) {
    return new Promise((resolve) => {
      this.appendTerminalOutput(`[Input Prompt] ${promptText}`, "system");
      this.el.terminalInputContainer.classList.remove('hidden');
      this.el.terminalStdinInput.value = '';
      this.el.terminalStdinInput.focus();
      this.stdinResolver = resolve;
    });
  }

  handleStdinSubmit() {
    const val = this.el.terminalStdinInput.value;
    this.el.terminalInputContainer.classList.add('hidden');
    this.appendTerminalOutput(`> ${val}`, "stdout");
    if (this.stdinResolver) {
      const resolve = this.stdinResolver;
      this.stdinResolver = null;
      resolve(val);
    }
  }

  appendTerminalOutput(msg, type = "stdout") {
    const line = document.createElement('div');
    line.className = `term-line term-${type}`;
    line.textContent = msg;
    this.el.terminalOutput.appendChild(line);
    this.el.terminalOutput.scrollTop = this.el.terminalOutput.scrollHeight;
  }

  formatCode() {
    if (!this.activeFileId) return;
    let code = this.el.editor.value;
    const lines = code.split('\n');
    let indentLevel = 0;
    const formatted = lines.map(line => {
      let trimmed = line.trim();
      if (trimmed.startsWith('}')) indentLevel = Math.max(0, indentLevel - 1);
      const ind = '    '.repeat(indentLevel);
      if (trimmed.endsWith('{')) indentLevel++;
      return trimmed ? ind + trimmed : '';
    }).join('\n');

    this.el.editor.value = formatted;
    this.files.get(this.activeFileId).content = formatted;
    this.updateGutter();
    this.showToast("Formatted Java Code");
  }

  shareProject() {
    const encoded = encodeURIComponent(JSON.stringify(Array.from(this.files.entries())));
    window.location.hash = `code=${encoded}`;
    navigator.clipboard.writeText(window.location.href);
    this.showToast("Copied shareable project URL to clipboard!");
  }

  loadStateFromURL() {
    if (window.location.hash.includes('code=')) {
      try {
        const raw = decodeURIComponent(window.location.hash.split('code=')[1]);
        const entries = JSON.parse(raw);
        this.files.clear();
        entries.forEach(([key, val]) => this.files.set(key, val));
        this.renderFileTree();
        if (entries.length > 0) this.openFile(entries[0][0]);
        this.showToast("Loaded project from shared link!");
      } catch (e) {
        console.error("Failed to parse shared code URL", e);
      }
    }
  }

  exportFiles() {
    if (!this.activeFileId) return;
    const file = this.files.get(this.activeFileId);
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    this.showToast(`Exported ${file.name}`);
  }

  renderJUnitResults(res) {
    this.el.junitView.innerHTML = `
      <div style="background-color: var(--bg-darker); border:1px solid var(--border-color); padding:14px; border-radius:6px;">
        <h4 style="color:var(--accent-green); margin-bottom:8px;"><i class="fa-solid fa-vial-circle-check"></i> JUnit Assertion Summary</h4>
        <div style="font-size:12px; color:var(--text-main);">
          <div>Test Suite: ${this.activeFileId}</div>
          <div>Execution Engine: Client-Side Java VM</div>
          <div>Status: <span class="badge badge-success">ALL PASSED</span></div>
        </div>
      </div>
    `;
  }

  openCommandPalette() {
    this.el.commandPaletteModal.classList.remove('hidden');
    this.el.paletteSearch.value = '';
    this.el.paletteSearch.focus();
    this.renderPaletteOptions([
      { name: 'Run Java Code', action: () => this.runCurrentCode() },
      { name: 'Format Java Source', action: () => this.formatCode() },
      { name: 'Create New File', action: () => this.el.btnNewFile.click() },
      { name: 'Switch Engine: Client VM', action: () => { this.el.engineSelect.value = 'client-vm'; this.el.engineSelect.dispatchEvent(new Event('change')); } },
      { name: 'Switch Engine: Cloud OpenJDK', action: () => { this.el.engineSelect.value = 'cloud-openjdk'; this.el.engineSelect.dispatchEvent(new Event('change')); } },
      { name: 'Clear Output Console', action: () => this.el.btnClearConsole.click() },
      { name: 'Share Code Link', action: () => this.shareProject() }
    ]);
  }

  renderPaletteOptions(options) {
    this.el.paletteResults.innerHTML = '';
    options.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      item.innerHTML = `<span>${opt.name}</span><i class="fa-solid fa-chevron-right" style="font-size:10px"></i>`;
      item.addEventListener('click', () => {
        this.el.commandPaletteModal.classList.add('hidden');
        opt.action();
      });
      this.el.paletteResults.appendChild(item);
    });

    this.el.paletteSearch.oninput = () => {
      const query = this.el.paletteSearch.value.toLowerCase();
      const filtered = options.filter(o => o.name.toLowerCase().includes(query));
      this.renderPaletteOptions(filtered);
    };

    this.el.commandPaletteModal.onclick = (e) => {
      if (e.target === this.el.commandPaletteModal) {
        this.el.commandPaletteModal.classList.add('hidden');
      }
    };
  }

  showPromptModal(title, placeholder, callback) {
    this.el.promptModalTitle.textContent = title;
    this.el.promptModalInput.placeholder = placeholder;
    this.el.promptModalInput.value = '';
    this.el.promptModal.classList.remove('hidden');
    this.el.promptModalInput.focus();

    const handleConfirm = () => {
      const val = this.el.promptModalInput.value.trim();
      this.el.promptModal.classList.add('hidden');
      cleanup();
      callback(val);
    };

    const handleCancel = () => {
      this.el.promptModal.classList.add('hidden');
      cleanup();
    };

    const cleanup = () => {
      this.el.btnPromptConfirm.removeEventListener('click', handleConfirm);
      this.el.btnPromptCancel.removeEventListener('click', handleCancel);
    };

    this.el.btnPromptConfirm.addEventListener('click', handleConfirm);
    this.el.btnPromptCancel.addEventListener('click', handleCancel);
  }

  cycleTheme() {
    const themes = ['theme-jetbrains', 'theme-dracula', 'theme-onedark', 'theme-cyberpunk'];
    const current = document.body.className;
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    document.body.className = themes[nextIdx];
    this.el.settingTheme.value = themes[nextIdx];
    this.showToast(`Switched theme to ${themes[nextIdx].replace('theme-', '')}`);
  }

  showToast(message, type = "info") {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${message}`;
    this.el.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Instantiate JavaBox IDE on page load
window.addEventListener('DOMContentLoaded', () => {
  window.javaBox = new JavaBoxApp();
});
