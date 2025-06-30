import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TechnologyStack } from '../../types/enums/enums';

@Component({
  selector: 'app-code-highlight',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="code-highlight-container" [class]="'language-' + getLanguageClass()">
      <div class="code-header">
        <div class="code-language">{{ getLanguageDisplay() }}</div>
        <div class="code-lines">{{ getLineCount() }} lines</div>
      </div>
      <div class="code-content">
        <div class="line-numbers" *ngIf="showLineNumbers">
          <span *ngFor="let line of getLineNumbers()" class="line-number">{{ line }}</span>
        </div>
        <pre class="code-block" [innerHTML]="highlightedCode"></pre>
      </div>
    </div>
  `,
  styleUrls: ['./code-highlight.css'],
  encapsulation: ViewEncapsulation.None
})
export class CodeHighlightComponent implements OnInit, OnChanges {
  @Input() code: string = '';
  @Input() language: TechnologyStack = TechnologyStack.JavaScript;
  @Input() showLineNumbers: boolean = true;
  @Input() maxHeight: string = '300px';

  highlightedCode: string = '';

  ngOnInit() {
    this.highlightCode();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['code'] || changes['language']) {
      this.highlightCode();
    }
  }

  private highlightCode() {
    if (!this.code) {
      this.highlightedCode = '';
      return;
    }

    const cleanCode = this.code.trim();
    const languageClass = this.getLanguageClass();
    
    this.highlightedCode = this.applySyntaxHighlighting(cleanCode, languageClass);
  }

  private applySyntaxHighlighting(code: string, language: string): string {
    let highlighted = this.escapeHtml(code);

    switch (language) {
      case 'javascript':
      case 'typescript':
        highlighted = this.highlightJavaScript(highlighted);
        break;
      case 'csharp':
        highlighted = this.highlightCSharp(highlighted);
        break;
      case 'python':
        highlighted = this.highlightPython(highlighted);
        break;
      case 'java':
        highlighted = this.highlightJava(highlighted);
        break;
      case 'react':
        highlighted = this.highlightReact(highlighted);
        break;
      default:
        highlighted = this.highlightGeneric(highlighted);
    }

    return highlighted;
  }

  private highlightJavaScript(code: string): string {
    code = code.replace(/\b(const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|try|catch|finally|throw|new|this|class|extends|import|export|from|async|await|yield|typeof|instanceof)\b/g, 
      '<span class="keyword">$1</span>');
    
    code = code.replace(/(["'`])([^"'`]*?)\1/g, '<span class="string">$1$2$1</span>');
    
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    
    code = code.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, '<span class="function">$1</span>');

    return code;
  }

  private highlightCSharp(code: string): string {
    code = code.replace(/\b(using|namespace|class|interface|struct|enum|public|private|protected|internal|static|readonly|const|virtual|override|abstract|sealed|partial|var|int|string|bool|double|float|decimal|char|byte|long|short|uint|ulong|ushort|object|dynamic|void|if|else|switch|case|default|for|foreach|while|do|break|continue|return|try|catch|finally|throw|new|this|base|null|true|false|async|await|yield|typeof|sizeof|is|as|in|out|ref|params|get|set|value|where|select|from|join|group|orderby|let|into)\b/g,
      '<span class="keyword">$1</span>');
    
    code = code.replace(/(["'])([^"']*?)\1/g, '<span class="string">$1$2$1</span>');
    
    code = code.replace(/\b(\d+\.?\d*[fFdDmM]?)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
    
    code = code.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="type">$1</span>');

    return code;
  }

  private highlightPython(code: string): string {
    code = code.replace(/\b(def|class|if|elif|else|for|while|break|continue|return|import|from|as|try|except|finally|raise|with|lambda|and|or|not|in|is|None|True|False|pass|yield|async|await|global|nonlocal|assert|del)\b/g,
      '<span class="keyword">$1</span>');
    
    code = code.replace(/(["'])([^"']*?)\1/g, '<span class="string">$1$2$1</span>');
    code = code.replace(/("""[\s\S]*?""")/g, '<span class="string">$1</span>');
    
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
    
    code = code.replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, 'def <span class="function">$1</span>(');

    return code;
  }

  private highlightJava(code: string): string {
    code = code.replace(/\b(public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp|class|interface|enum|extends|implements|package|import|void|int|long|short|byte|char|float|double|boolean|String|Object|if|else|switch|case|default|for|while|do|break|continue|return|try|catch|finally|throw|throws|new|this|super|null|true|false|instanceof|typeof)\b/g,
      '<span class="keyword">$1</span>');
    
    code = code.replace(/(["'])([^"']*?)\1/g, '<span class="string">$1$2$1</span>');
    
    code = code.replace(/\b(\d+\.?\d*[fFdDlL]?)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

    return code;
  }

  private highlightReact(code: string): string {
    code = this.highlightJavaScript(code);
    
    code = code.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span class="jsx-tag">$2</span>');
    code = code.replace(/([a-zA-Z][a-zA-Z0-9]*)(=)/g, '<span class="jsx-attr">$1</span>$2');

    return code;
  }

  private highlightGeneric(code: string): string {
    code = code.replace(/(["'])([^"']*?)\1/g, '<span class="string">$1$2$1</span>');
    
    code = code.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    
    code = code.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');

    return code;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getLanguageClass(): string {
    switch (this.language) {
      case TechnologyStack.JavaScript: return 'javascript';
      case TechnologyStack.TypeScript: return 'typescript';
      case TechnologyStack.DotNet: return 'csharp';
      case TechnologyStack.Python: return 'python';
      case TechnologyStack.Java: return 'java';
      case TechnologyStack.React: return 'react';
      case TechnologyStack.Angular: return 'typescript';
      case TechnologyStack.Vue: return 'javascript';
      case TechnologyStack.PHP: return 'php';
      case TechnologyStack.Ruby: return 'ruby';
      case TechnologyStack.Go: return 'go';
      case TechnologyStack.Rust: return 'rust';
      case TechnologyStack.Swift: return 'swift';
      case TechnologyStack.Kotlin: return 'kotlin';
      default: return 'text';
    }
  }

  getLanguageDisplay(): string {
    switch (this.language) {
      case TechnologyStack.JavaScript: return 'JavaScript';
      case TechnologyStack.TypeScript: return 'TypeScript';
      case TechnologyStack.DotNet: return 'C#';
      case TechnologyStack.Python: return 'Python';
      case TechnologyStack.Java: return 'Java';
      case TechnologyStack.React: return 'React/JSX';
      case TechnologyStack.Angular: return 'Angular/TS';
      case TechnologyStack.Vue: return 'Vue.js';
      case TechnologyStack.PHP: return 'PHP';
      case TechnologyStack.Ruby: return 'Ruby';
      case TechnologyStack.Go: return 'Go';
      case TechnologyStack.Rust: return 'Rust';
      case TechnologyStack.Swift: return 'Swift';
      case TechnologyStack.Kotlin: return 'Kotlin';
      default: return 'Code';
    }
  }

  getLineCount(): number {
    return this.code ? this.code.split('\n').length : 0;
  }

  getLineNumbers(): number[] {
    const lineCount = this.getLineCount();
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }
}