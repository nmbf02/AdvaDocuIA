import React from 'react';
import { 
  List, 
  ListOrdered, 
  Bold, 
  Minus, 
  Table as TableIcon,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface TextFormattingToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  onInsertTable?: () => void;
  showTableButton?: boolean;
  className?: string;
}

/**
 * Toggles bold formatting around selected text or inserts bold placeholder with selection.
 */
export const toggleBoldAtTarget = (
  target: HTMLTextAreaElement | HTMLInputElement | null,
  currentValue: string
): { newText: string; selStart: number; selEnd: number } => {
  if (!target) {
    const placeholder = 'texto en negrita';
    const textToInsert = currentValue ? `${currentValue} **${placeholder}**` : `**${placeholder}**`;
    return { newText: textToInsert, selStart: textToInsert.length - placeholder.length - 2, selEnd: textToInsert.length - 2 };
  }

  const start = target.selectionStart ?? currentValue.length;
  const end = target.selectionEnd ?? currentValue.length;
  const selectedText = currentValue.substring(start, end);

  // Case 1: Text is selected
  if (selectedText.length > 0) {
    // Check if the selected text itself starts and ends with ** (e.g. **Hola**)
    if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length >= 4) {
      const unbolded = selectedText.slice(2, -2);
      const newText = currentValue.substring(0, start) + unbolded + currentValue.substring(end);
      return { newText, selStart: start, selEnd: start + unbolded.length };
    }

    // Check if the characters immediately before and after selection are ** ... **
    if (
      start >= 2 &&
      end <= currentValue.length - 2 &&
      currentValue.substring(start - 2, start) === '**' &&
      currentValue.substring(end, end + 2) === '**'
    ) {
      const newText = currentValue.substring(0, start - 2) + selectedText + currentValue.substring(end + 2);
      return { newText, selStart: start - 2, selEnd: start - 2 + selectedText.length };
    }

    // Wrap selection in **
    const bolded = `**${selectedText}**`;
    const newText = currentValue.substring(0, start) + bolded + currentValue.substring(end);
    return { newText, selStart: start, selEnd: start + bolded.length };
  }

  // Case 2: No text is selected (cursor position only)
  const placeholder = 'texto en negrita';
  const insertion = `**${placeholder}**`;
  const newText = currentValue.substring(0, start) + insertion + currentValue.substring(end);
  const selStart = start + 2;
  const selEnd = selStart + placeholder.length;
  return { newText, selStart, selEnd };
};

/**
 * Inserts markdown formatting or bullets at cursor position.
 */
export const insertFormattingAtCursor = (
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  prefix: string,
  suffix: string = '',
  defaultPlaceholder: string = ''
): { newText: string; newCursorPos: number; selStart?: number; selEnd?: number } => {
  // If bold prefix/suffix, route through toggleBoldAtTarget
  if (prefix === '**' && suffix === '**') {
    const { newText, selStart, selEnd } = toggleBoldAtTarget(textarea, currentValue);
    return { newText, newCursorPos: selEnd, selStart, selEnd };
  }

  if (!textarea) {
    const textToInsert = defaultPlaceholder ? `${prefix}${defaultPlaceholder}${suffix}` : prefix;
    const newText = currentValue ? `${currentValue}\n${textToInsert}` : textToInsert;
    return { newText, newCursorPos: newText.length };
  }

  const start = textarea.selectionStart ?? currentValue.length;
  const end = textarea.selectionEnd ?? currentValue.length;
  const selectedText = currentValue.substring(start, end);

  // If text is selected and inserting a bullet/list, prefix each line
  if (selectedText && (prefix === '• ' || prefix === '- ' || prefix === '1. ')) {
    const lines = selectedText.split('\n');
    let lineCounter = 1;
    const bulletedLines = lines.map((line) => {
      if (prefix === '1. ') {
        const item = `${lineCounter}. ${line}`;
        lineCounter++;
        return item;
      }
      return `${prefix}${line}`;
    }).join('\n');

    const newText = currentValue.substring(0, start) + bulletedLines + currentValue.substring(end);
    const newCursorPos = start + bulletedLines.length;
    return { newText, newCursorPos };
  }

  // If no text is selected or single-line wrap
  const middle = selectedText || defaultPlaceholder;
  const insertion = `${prefix}${middle}${suffix}`;

  // If inserting a bullet on a new line when not already on a new line
  const charBefore = start > 0 ? currentValue[start - 1] : '\n';
  const needsNewline = (prefix === '• ' || prefix === '- ' || prefix === '1. ') && charBefore !== '\n' && start > 0;
  
  const finalInsertion = needsNewline ? `\n${insertion}` : insertion;
  const newText = currentValue.substring(0, start) + finalInsertion + currentValue.substring(end);
  const newCursorPos = start + finalInsertion.length;

  return { newText, newCursorPos };
};

/**
 * Handles keyboard shortcuts:
 * - Ctrl+B / Cmd+B: Instant Bold toggle
 * - Enter: Auto continue bullet lists / numbers
 */
export const handleFormattingKeyDown = (
  e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  value: string,
  onChange: (val: string) => void
) => {
  // 1. Bold shortcut (Ctrl+B or Cmd+B)
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    const target = e.currentTarget;
    const { newText, selStart, selEnd } = toggleBoldAtTarget(target, value);
    onChange(newText);
    setTimeout(() => {
      target.focus();
      target.setSelectionRange(selStart, selEnd);
    }, 0);
    return;
  }

  // 2. Auto-bullet continuation on Enter for textareas
  if (e.key === 'Enter' && !e.shiftKey && e.currentTarget instanceof HTMLTextAreaElement) {
    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;
    const textBefore = value.substring(0, cursorPos);
    const textAfter = value.substring(cursorPos);
    const lastLineBreak = textBefore.lastIndexOf('\n');
    const currentLine = textBefore.substring(lastLineBreak + 1);

    // Bullet match: • or - or *
    const bulletMatch = currentLine.match(/^(\s*)([•\-\*])\s*(.*)$/);
    // Numbered list match: 1. or 2. etc.
    const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s*(.*)$/);

    if (bulletMatch) {
      const indent = bulletMatch[1];
      const bulletChar = bulletMatch[2];
      const content = bulletMatch[3];

      // If user pressed enter on an empty bullet line, remove the bullet and end list
      if (!content.trim()) {
        e.preventDefault();
        const newText = textBefore.substring(0, lastLineBreak + 1) + textAfter;
        onChange(newText);
        setTimeout(() => {
          textarea.selectionStart = lastLineBreak + 1;
          textarea.selectionEnd = lastLineBreak + 1;
        }, 0);
        return;
      }

      // Otherwise continue the bullet
      e.preventDefault();
      const insert = `\n${indent}${bulletChar} `;
      const newText = textBefore + insert + textAfter;
      onChange(newText);
      setTimeout(() => {
        const pos = cursorPos + insert.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
      }, 0);
      return;
    }

    if (numberMatch) {
      const indent = numberMatch[1];
      const num = parseInt(numberMatch[2], 10);
      const content = numberMatch[3];

      if (!content.trim()) {
        e.preventDefault();
        const newText = textBefore.substring(0, lastLineBreak + 1) + textAfter;
        onChange(newText);
        setTimeout(() => {
          textarea.selectionStart = lastLineBreak + 1;
          textarea.selectionEnd = lastLineBreak + 1;
        }, 0);
        return;
      }

      e.preventDefault();
      const insert = `\n${indent}${num + 1}. `;
      const newText = textBefore + insert + textAfter;
      onChange(newText);
      setTimeout(() => {
        const pos = cursorPos + insert.length;
        textarea.selectionStart = pos;
        textarea.selectionEnd = pos;
      }, 0);
      return;
    }
  }
};

/** Alias for backward compatibility */
export const handleAutoBulletKeyDown = handleFormattingKeyDown;

export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  textareaRef,
  value,
  onChange,
  onInsertTable,
  showTableButton = true,
  className = '',
}) => {
  const applyFormatting = (prefix: string, suffix = '', defaultText = '') => {
    const textarea = textareaRef?.current || null;
    const res = insertFormattingAtCursor(textarea, value, prefix, suffix, defaultText);
    onChange(res.newText);

    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        if (res.selStart !== undefined && res.selEnd !== undefined) {
          textarea.setSelectionRange(res.selStart, res.selEnd);
        } else {
          textarea.setSelectionRange(res.newCursorPos, res.newCursorPos);
        }
      }, 0);
    }
  };

  const handleBoldClick = () => {
    const textarea = textareaRef?.current || null;
    const { newText, selStart, selEnd } = toggleBoldAtTarget(textarea, value);
    onChange(newText);
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(selStart, selEnd);
      }, 0);
    }
  };

  return (
    <div className={`flex flex-wrap items-center justify-between gap-1.5 py-1 px-1.5 bg-slate-100/95 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs select-none ${className}`}>
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Formato:
        </span>

        {/* 1. Negrita (Bold) con atajo Ctrl+B */}
        <button
          type="button"
          onClick={handleBoldClick}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 hover:bg-[#0A3D62] hover:text-white dark:hover:bg-blue-600 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-600 font-bold text-[11px] transition-all shadow-xs cursor-pointer active:scale-95"
          title="Poner en negrita (**texto**). También puedes seleccionar texto y pulsar Ctrl+B"
        >
          <Bold className="w-3.5 h-3.5 text-[#0A3D62] dark:text-blue-300 group-hover:text-white" />
          <span className="font-extrabold">Negrita</span>
          <span className="text-[9px] px-1 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-mono border border-slate-200 dark:border-slate-600">
            Ctrl+B
          </span>
        </button>

        {/* 2. Viñeta Redonda */}
        <button
          type="button"
          onClick={() => applyFormatting('• ', '', 'Elemento de lista')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-600 font-medium text-[11px] transition-colors shadow-2xs cursor-pointer"
          title="Insertar viñeta (• ). Al pulsar Enter se crea automáticamente la siguiente viñeta."
        >
          <List className="w-3.5 h-3.5 text-[#2ECC71]" />
          <span>• Viñeta</span>
        </button>

        {/* 3. Lista Numerada */}
        <button
          type="button"
          onClick={() => applyFormatting('1. ', '', 'Primer paso o punto')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-800 dark:text-slate-200 hover:text-[#0A3D62] dark:hover:text-blue-300 border border-slate-200 dark:border-slate-600 font-medium text-[11px] transition-colors shadow-2xs cursor-pointer"
          title="Insertar lista numerada (1. 2. 3.). Al pulsar Enter se numera el siguiente renglón."
        >
          <ListOrdered className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>1. Numerada</span>
        </button>

        {/* 4. Viñeta Guión */}
        <button
          type="button"
          onClick={() => applyFormatting('- ', '', 'Punto con guión')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 font-medium text-[11px] transition-colors shadow-2xs cursor-pointer"
          title="Insertar viñeta con guión (- )"
        >
          <Minus className="w-3 h-3 text-slate-500" />
          <span>- Guión</span>
        </button>

        {/* 5. Sub-viñeta / Indentada */}
        <button
          type="button"
          onClick={() => applyFormatting('    • ', '', 'Sub-punto indentado')}
          className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-[11px] transition-colors shadow-2xs cursor-pointer"
          title="Insertar sub-viñeta con sangría"
        >
          <span className="font-mono text-[10px] text-slate-400">»</span>
          <span>Sub-viñeta</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {showTableButton && onInsertTable && (
          <button
            type="button"
            onClick={onInsertTable}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0A3D62] hover:bg-[#1E5F8A] text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Crear e insertar tabla estructurada en este campo"
          >
            <TableIcon className="w-3.5 h-3.5 text-[#2ECC71]" />
            <span>+ Insertar Tabla</span>
          </button>
        )}
      </div>
    </div>
  );
};
