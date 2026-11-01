export type Inline = { text: string; bold?: boolean; href?: string };
export type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string; id: string }
  | { type: 'p'; inlines: Inline[] }
  | { type: 'ul' | 'ol'; items: Inline[][] };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s)]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ text: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ text: m[1], bold: true });
    else if (m[2] !== undefined) out.push({ text: m[2], href: m[3] });
    else if (m[4]) out.push({ text: m[4], href: m[4] });
    else out.push({ text: m[5], href: `mailto:${m[5]}` });
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out;
}

export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { type: 'ul' | 'ol'; items: Inline[][] } | null = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', inlines: parseInline(para.join(' ')) });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of src.split(/\r?\n/)) {
    const line = raw.trim();
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const li = /^(?:[-*]|(\d+)\.)\s+(.*)$/.exec(line);
    if (!line) {
      flushPara();
      flushList();
    } else if (h) {
      flushPara();
      flushList();
      const text = h[2];
      blocks.push({ type: `h${h[1].length}` as 'h1' | 'h2' | 'h3', text, id: slugify(text) });
    } else if (li) {
      flushPara();
      const type = li[1] ? 'ol' : 'ul';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push(parseInline(li[2]));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return blocks;
}
