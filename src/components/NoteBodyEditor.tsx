import React, { useEffect, useRef, useState } from 'react';
import { compressNoteImage } from '../utils/freeNotesStorage';
import {
  Bold,
  ImagePlus,
  List,
  ListOrdered,
} from 'lucide-react';

interface NoteBodyEditorProps {
  noteId: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value);
}

function closestInEditor(node: Node | null, editor: HTMLElement): HTMLElement | null {
  if (!node) return null;
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
  if (!el || el === editor) return null;
  return editor.contains(el) ? el : null;
}

function findListAncestor(node: Node | null, editor: HTMLElement): HTMLUListElement | HTMLOListElement | null {
  let el = closestInEditor(node, editor);
  while (el && el !== editor) {
    if (el.tagName === 'UL' || el.tagName === 'OL') return el as HTMLUListElement | HTMLOListElement;
    el = el.parentElement;
  }
  return null;
}

function unwrapList(list: HTMLElement) {
  const parent = list.parentNode;
  if (!parent) return;
  Array.from(list.children).forEach((li) => {
    const block = document.createElement('div');
    block.innerHTML = (li as HTMLElement).innerHTML || '<br>';
    parent.insertBefore(block, list);
  });
  parent.removeChild(list);
}

function currentBlock(node: Node | null, editor: HTMLElement): HTMLElement | null {
  let el = closestInEditor(node, editor);
  while (el && el !== editor) {
    const parent = el.parentElement;
    if (parent === editor) return el;
    el = parent;
  }
  return null;
}

function wrapSelectionInList(editor: HTMLElement, kind: 'ul' | 'ol') {
  const selection = window.getSelection();
  const selected = selection?.toString() || '';
  const list = document.createElement(kind);

  if (selected.trim()) {
    selected.split(/\n+/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });
    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(list);
      selection.collapseToEnd();
      return;
    }
  } else {
    const anchor = selection?.anchorNode || null;
    const block = currentBlock(anchor, editor);
    const li = document.createElement('li');
    if (block && block !== editor) {
      li.innerHTML = block.innerHTML || '<br>';
      list.appendChild(li);
      block.replaceWith(list);
      return;
    }
    if (anchor && anchor.nodeType === Node.TEXT_NODE && anchor.parentNode === editor) {
      li.textContent = anchor.textContent || '';
      list.appendChild(li);
      anchor.parentNode.replaceChild(list, anchor);
      return;
    }
    li.innerHTML = '<br>';
    list.appendChild(li);
  }

  if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(list);
    selection.collapseToEnd();
    return;
  }
  editor.appendChild(list);
}

function insertNodeAtCaret(editor: HTMLElement, node: Node) {
  editor.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
    editor.appendChild(node);
    const spacer = document.createElement('div');
    spacer.innerHTML = '<br>';
    editor.appendChild(spacer);
    return;
  }
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(node);
  const spacer = document.createElement('div');
  spacer.innerHTML = '<br>';
  if (node.parentNode) {
    if (node.nextSibling) node.parentNode.insertBefore(spacer, node.nextSibling);
    else node.parentNode.appendChild(spacer);
  }
  range.setStart(spacer, 0);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

export const NoteBodyEditor: React.FC<NoteBodyEditorProps> = ({
  noteId,
  value,
  onChange,
  placeholder = 'Empieza a escribir…',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedId = useRef<string>('');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (loadedId.current === noteId) return;
    loadedId.current = noteId;
    if (!value) {
      editor.innerHTML = '';
      window.setTimeout(() => editor.focus(), 40);
      return;
    }
    if (looksLikeHtml(value)) editor.innerHTML = value;
    else editor.innerText = value;
    window.setTimeout(() => editor.focus(), 40);
  }, [noteId, value]);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.innerHTML;
    const empty = html === '' || html === '<br>' || html === '<div><br></div>';
    onChange(empty ? '' : html);
  };

  const insertImageBlob = async (file: Blob) => {
    const editor = editorRef.current;
    if (!editor) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await compressNoteImage(file);
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'Imagen pegada';
      img.className = 'note-inline-image';
      insertNodeAtCaret(editor, img);
      emitChange();
    } catch (err) {
      console.error(err);
      setError('No se pudo pegar la imagen. Prueba con un archivo más liviano.');
    } finally {
      setBusy(false);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const clipboard = event.clipboardData;
    const items = Array.from(clipboard.items as unknown as DataTransferItem[]);
    const fromItems = items
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    const files = Array.from(clipboard.files as unknown as File[]);
    const fromFiles = files.filter((file) => file.type.startsWith('image/'));
    const images = fromItems.length > 0 ? fromItems : fromFiles;
    if (images.length === 0) return;
    event.preventDefault();
    void insertImageBlob(images[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const files = Array.from(event.dataTransfer.files as unknown as File[]);
    const images = files.filter((file) => file.type.startsWith('image/'));
    if (images.length === 0) return;
    void insertImageBlob(images[0]);
  };

  const placeCaretInEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection) return;
    if (selection.rangeCount > 0 && editor.contains(selection.anchorNode)) return;
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const runCommand = (command: string) => {
    placeCaretInEditor();
    document.execCommand(command, false);
    emitChange();
  };

  const toggleList = (kind: 'ul' | 'ol') => {
    const editor = editorRef.current;
    if (!editor) return;
    placeCaretInEditor();
    const selection = window.getSelection();
    const existing = findListAncestor(selection?.anchorNode || null, editor);
    if (existing && existing.tagName.toLowerCase() === kind) {
      unwrapList(existing);
      emitChange();
      return;
    }
    if (existing) unwrapList(existing);
    wrapSelectionInList(editor, kind);
    emitChange();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex flex-wrap items-center gap-1.5 mb-3 -mt-1">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => runCommand('bold')}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-bold text-slate-800 cursor-pointer"
          title="Negrita (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5 text-[#0A3D62]" />
          Negrita
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleList('ul')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-800 cursor-pointer"
        >
          <List className="w-3.5 h-3.5 text-[#2ECC71]" />
          Viñeta
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleList('ol')}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-800 cursor-pointer"
        >
          <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
          Numerada
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 cursor-pointer"
          title="Insertar imagen o pégala con Ctrl+V"
        >
          <ImagePlus className="w-3.5 h-3.5 text-[#0A3D62]" />
          Imagen
        </button>
        <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
          {busy ? 'Insertando…' : 'Ctrl+V para pegar una imagen'}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void insertImageBlob(file);
          }}
        />
      </div>

      {error && <p className="text-[11px] text-rose-600 mb-2">{error}</p>}

      <div
        className={`relative flex-1 min-h-[640px] ${dragging ? 'ring-2 ring-[#0A3D62]/40 rounded-md' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-label="Cuerpo de la nota"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className="note-body-editor min-h-[640px] w-full outline-none text-[17px] leading-8 text-slate-800"
          onInput={emitChange}
          onPaste={handlePaste}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
              event.preventDefault();
              runCommand('bold');
            }
          }}
        />
        {dragging && (
          <div className="absolute inset-0 bg-[#0A3D62]/8 border-2 border-dashed border-[#0A3D62] rounded-md flex items-center justify-center pointer-events-none">
            <p className="text-sm font-bold text-[#0A3D62]">Suelta la imagen aquí</p>
          </div>
        )}
      </div>
    </div>
  );
};
