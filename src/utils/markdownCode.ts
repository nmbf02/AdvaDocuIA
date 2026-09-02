export type MarkdownSegment =
  | { kind: 'code'; lang: string; content: string }
  | { kind: 'text'; content: string };

export function splitMarkdownCodeFences(text: string): MarkdownSegment[] {
  const lines = (text || '').split('\n');
  const segs: MarkdownSegment[] = [];
  let buf: string[] = [];
  let inCode = false;
  let lang = '';

  const flushText = () => {
    if (!buf.length) return;
    segs.push({ kind: 'text', content: buf.join('\n') });
    buf = [];
  };

  for (const line of lines) {
    const fence = line.trim().match(/^```(\w*)\s*$/);
    if (fence) {
      if (inCode) {
        segs.push({ kind: 'code', lang, content: buf.join('\n') });
        buf = [];
        inCode = false;
        lang = '';
      } else {
        flushText();
        inCode = true;
        lang = fence[1] || '';
      }
      continue;
    }
    buf.push(line);
  }

  if (inCode) {
    segs.push({ kind: 'code', lang, content: buf.join('\n') });
  } else {
    flushText();
  }
  return segs;
}

export function isCursorInsideCodeFence(value: string, cursorPos: number): boolean {
  const before = value.slice(0, cursorPos);
  const fences = before.match(/^```/gm);
  return Boolean(fences && fences.length % 2 === 1);
}
