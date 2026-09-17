export interface InlineMdPart {
  text: string;
  bold: boolean;
  code: boolean;
}

export function splitInlineMarkdown(text: string): InlineMdPart[] {
  if (!text) return [];
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  const out: InlineMdPart[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      out.push({ text: part.slice(1, -1), bold: false, code: true });
    } else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      out.push({ text: part.slice(2, -2), bold: true, code: false });
    } else {
      out.push({ text: part, bold: false, code: false });
    }
  }
  return out;
}

export function stripInlineMarkdown(text: string): string {
  return splitInlineMarkdown(text)
    .map((p) => p.text)
    .join('');
}

export function cellHasInlineBold(text: string): boolean {
  return splitInlineMarkdown(text).some((p) => p.bold);
}

export function pdfAutoTableCell(text: string): { content: string; styles?: { fontStyle: 'bold' } } {
  const content = stripInlineMarkdown(text || '');
  if (cellHasInlineBold(text || '')) {
    return { content, styles: { fontStyle: 'bold' } };
  }
  return { content };
}

export function htmlElementToInlineMarkdown(el: Element): string {
  let s = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      s += node.textContent || '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const e = node as Element;
    const tag = e.tagName.toLowerCase();
    const bold = tag === 'b' || tag === 'strong';
    if (bold) s += '**';
    Array.from(e.childNodes).forEach(walk);
    if (bold) s += '**';
  };
  Array.from(el.childNodes).forEach(walk);
  return s.replace(/\s+/g, ' ').trim();
}
