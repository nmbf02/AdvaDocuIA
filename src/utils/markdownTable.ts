import type { ClipboardEvent } from 'react';
import { DocumentTable } from '../types';
import { htmlElementToInlineMarkdown } from './inlineMarkdown';

export interface ParsedMarkdownTable {
  title?: string;
  headers: string[];
  rows: string[][];
}

function splitCells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.replace(/\\\|/g, '|').trim());
}

function isSeparatorLine(line: string): boolean {
  const cells = splitCells(line);
  if (cells.length < 1) return false;
  return cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')));
}

function isTableRowLine(line: string): boolean {
  const t = line.trim();
  if (!t.includes('|')) return false;
  if (isSeparatorLine(t)) return false;
  return t.startsWith('|') || t.endsWith('|') || (t.match(/\|/g) || []).length >= 1;
}

function looksLikeTitle(line: string): string | undefined {
  const t = line.trim();
  if (!t) return undefined;
  const bold = t.match(/^\*\*(.+)\*\*$/);
  if (bold) return bold[1].trim();
  const heading = t.match(/^#{1,6}\s+(.+)$/);
  if (heading) return heading[1].trim();
  return undefined;
}

function padRow(cells: string[], cols: number): string[] {
  const row = cells.slice(0, cols);
  while (row.length < cols) row.push('');
  return row;
}

function normalizeTable(headers: string[], body: string[][], title?: string): ParsedMarkdownTable | null {
  const cols = Math.max(headers.length, 1, ...body.map((r) => r.length));
  const h = padRow(headers.map((x) => x || `Columna`), cols).map((x, i) => x || `Columna ${i + 1}`);
  const rows = body.length ? body.map((r) => padRow(r, cols)) : [Array(cols).fill('')];
  return { title, headers: h, rows };
}

/**
 * Extrae tablas GFM del texto, ignorando bloques de código.
 */
export function parseMarkdownTables(text: string): { table: ParsedMarkdownTable; start: number; end: number }[] {
  const lines = text.split(/\r?\n/);
  const found: { table: ParsedMarkdownTable; start: number; end: number }[] = [];
  let inFence = false;
  let offset = 0;
  const lineStarts: number[] = [];
  for (const line of lines) {
    lineStarts.push(offset);
    offset += line.length + 1;
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (trimmed.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (i + 1 >= lines.length) continue;
    if (!isTableRowLine(lines[i]) || !isSeparatorLine(lines[i + 1])) continue;

    const headers = splitCells(lines[i]);
    if (headers.length < 1) continue;
    const body: string[][] = [];
    let j = i + 2;
    while (j < lines.length && isTableRowLine(lines[j]) && !isSeparatorLine(lines[j])) {
      body.push(splitCells(lines[j]));
      j++;
    }

    let title: string | undefined;
    let startLine = i;
    if (i > 0) {
      const prev = looksLikeTitle(lines[i - 1]);
      if (prev) {
        title = prev;
        startLine = i - 1;
      } else if (!lines[i - 1].trim() && i > 1) {
        const prev2 = looksLikeTitle(lines[i - 2]);
        if (prev2) {
          title = prev2;
          startLine = i - 2;
        }
      }
    }

    const table = normalizeTable(headers, body, title);
    if (table) {
      const start = lineStarts[startLine];
      const lastLine = j - 1;
      const end = (lineStarts[lastLine] ?? 0) + lines[lastLine].length;
      found.push({ table, start, end });
    }
    i = j - 1;
  }
  return found;
}

export function looksLikeMarkdownTable(text: string): boolean {
  return parseMarkdownTables(text).length > 0;
}

export function parseHtmlTables(html: string): ParsedMarkdownTable[] {
  if (!html || !/<table[\s>]/i.test(html)) return [];
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll('table')).map((el) => {
      const caption = el.querySelector('caption')?.textContent?.trim();
      const headerCells = Array.from(el.querySelectorAll('thead th, thead td'));
      let headers: string[] = headerCells.map((c) => htmlElementToInlineMarkdown(c));
      const bodyRows = Array.from(el.querySelectorAll('tbody tr'));
      const allRows = bodyRows.length ? bodyRows : Array.from(el.querySelectorAll('tr'));
      const rows: string[][] = [];
      allRows.forEach((tr, idx) => {
        const ths = Array.from(tr.querySelectorAll('th'));
        const tds = Array.from(tr.querySelectorAll('td'));
        if (!headers.length && idx === 0 && ths.length) {
          headers = ths.map((c) => htmlElementToInlineMarkdown(c));
          return;
        }
        if (!headers.length && idx === 0 && tds.length && el.querySelectorAll('th').length === 0) {
          headers = tds.map((c) => htmlElementToInlineMarkdown(c));
          return;
        }
        const cells = (tds.length ? tds : ths).map((c) => htmlElementToInlineMarkdown(c));
        if (cells.length) rows.push(cells);
      });
      return normalizeTable(headers.length ? headers : ['Columna 1'], rows, caption);
    }).filter((t): t is ParsedMarkdownTable => t !== null);
  } catch {
    return [];
  }
}

export function documentTableFromParsed(parsed: ParsedMarkdownTable, index: number): DocumentTable {
  return {
    id: `tbl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title: parsed.title?.trim() || `Tabla ${index}`,
    headers: parsed.headers,
    rows: parsed.rows,
  };
}

export function convertPastedTextWithTables(
  pasted: string,
  existingCount: number
): { text: string; tables: DocumentTable[] } | null {
  const matches = parseMarkdownTables(pasted);
  if (!matches.length) return null;
  let out = '';
  let last = 0;
  const tables: DocumentTable[] = [];
  matches.forEach((m) => {
    out += pasted.slice(last, m.start);
    const idx = existingCount + tables.length + 1;
    tables.push(documentTableFromParsed(m.table, idx));
    const before = out.length > 0 && !out.endsWith('\n') ? '\n' : '';
    out += `${before}[TABLA_${idx}]`;
    last = m.end;
  });
  out += pasted.slice(last);
  return { text: out, tables };
}

export function tryApplyPastedTables(
  e: ClipboardEvent<HTMLTextAreaElement>,
  currentValue: string,
  existingTables: DocumentTable[]
): { nextText: string; tables: DocumentTable[]; cursor: number } | null {
  const el = e.currentTarget;
  const plain = e.clipboardData.getData('text/plain');
  const html = e.clipboardData.getData('text/html');
  let converted = convertPastedTextWithTables(plain, existingTables.length);
  if (!converted) {
    const htmlTables = parseHtmlTables(html);
    if (!htmlTables.length) return null;
    const tables = htmlTables.map((t, i) => documentTableFromParsed(t, existingTables.length + i + 1));
    const tags = tables.map((_, i) => `[TABLA_${existingTables.length + i + 1}]`).join('\n');
    converted = { text: tags, tables };
  }

  e.preventDefault();
  const start = el.selectionStart ?? currentValue.length;
  const end = el.selectionEnd ?? currentValue.length;
  let insert = converted.text;
  const before = currentValue.slice(0, start);
  const after = currentValue.slice(end);
  if (before.length > 0 && !before.endsWith('\n') && !insert.startsWith('\n')) insert = `\n${insert}`;
  if (after.length > 0 && !insert.endsWith('\n') && !after.startsWith('\n')) insert = `${insert}\n`;
  const nextText = `${before}${insert}${after}`;
  return {
    nextText,
    tables: [...existingTables, ...converted.tables],
    cursor: before.length + insert.length,
  };
}
