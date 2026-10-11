"use client";

import type { ReactNode } from "react";

/**
 * Küçük ve güvenli Markdown oluşturucu (kalın, italik, kod, listeler, başlıklar, tablolar, alıntı).
 * Çıktı yalnızca React öğeleridir; HTML enjekte edilmez (dangerouslySetInnerHTML yok).
 */

type Block =
  | { t: "p"; lines: string[] }
  | { t: "h"; level: number; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[]; start: number }
  | { t: "code"; text: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "quote"; lines: string[] }
  | { t: "hr" };

const RE_UL = /^\s*[-*•+]\s+(.*)$/;
const RE_OL = /^\s*(\d+)[.)]\s+(.*)$/;
const RE_H = /^(#{1,6})\s+(.*)$/;
const RE_HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const RE_TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function cells(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function parse(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  const last = () => out[out.length - 1];
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^\s*```/.test(lines[i])) buf.push(lines[i++]);
      i += 1;
      out.push({ t: "code", text: buf.join("\n") });
      continue;
    }
    if (!line.trim()) {
      i += 1;
      out.push({ t: "p", lines: [] }); // paragraf ayırıcı (boş paragraf sonra atılır)
      continue;
    }
    if (line.includes("|") && i + 1 < lines.length && RE_TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes("-")) {
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(cells(lines[i++]));
      out.push({ t: "table", head, rows });
      continue;
    }
    if (RE_HR.test(line)) {
      out.push({ t: "hr" });
      i += 1;
      continue;
    }
    const h = RE_H.exec(line);
    if (h) {
      out.push({ t: "h", level: h[1].length, text: h[2] });
      i += 1;
      continue;
    }
    const ul = RE_UL.exec(line);
    if (ul) {
      const b = last();
      if (b && b.t === "ul") b.items.push(ul[1]);
      else out.push({ t: "ul", items: [ul[1]] });
      i += 1;
      continue;
    }
    const ol = RE_OL.exec(line);
    if (ol) {
      const b = last();
      if (b && b.t === "ol") b.items.push(ol[2]);
      else out.push({ t: "ol", items: [ol[2]], start: Number(ol[1]) || 1 });
      i += 1;
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      const text = line.replace(/^\s*>\s?/, "");
      const b = last();
      if (b && b.t === "quote") b.lines.push(text);
      else out.push({ t: "quote", lines: [text] });
      i += 1;
      continue;
    }
    // Liste maddesinin girintili devamı
    const b = last();
    if (b && (b.t === "ul" || b.t === "ol") && /^\s{2,}\S/.test(line)) {
      b.items[b.items.length - 1] += " " + line.trim();
      i += 1;
      continue;
    }
    if (b && b.t === "p" && b.lines.length) b.lines.push(line);
    else out.push({ t: "p", lines: [line] });
    i += 1;
  }
  return out.filter((b) => !(b.t === "p" && b.lines.length === 0));
}

const RE_INLINE = /(\*\*[^*\n]+?\*\*|__[^_\n]+?__|`[^`\n]+`|\*[^*\s][^*\n]*?\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;

function inline(text: string, keyBase = "i"): ReactNode[] {
  const parts = text.split(RE_INLINE);
  return parts.map((p, idx) => {
    const key = `${keyBase}-${idx}`;
    if (!p) return null;
    if ((p.startsWith("**") && p.endsWith("**") && p.length > 4) || (p.startsWith("__") && p.endsWith("__") && p.length > 4)) {
      return (
        <strong key={key} className="font-extrabold text-ink">
          {inline(p.slice(2, -2), key)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) {
      return (
        <code key={key} className="rounded-md bg-paper px-1.5 py-0.5 font-mono text-[0.9em] text-navy">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      return <em key={key}>{p.slice(1, -1)}</em>;
    }
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(p);
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noreferrer noopener" className="font-semibold text-brand-blue underline underline-offset-2">
          {link[1]}
        </a>
      );
    }
    return <span key={key}>{p}</span>;
  });
}

export function Markdown({ text }: { text: string }) {
  const blocks = parse(text);
  return (
    <div className="space-y-2 break-words">
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        switch (b.t) {
          case "p":
            return (
              <p key={k}>
                {b.lines.map((l, li) => (
                  <span key={li}>
                    {li ? <br /> : null}
                    {inline(l, `${k}-${li}`)}
                  </span>
                ))}
              </p>
            );
          case "h":
            return (
              <div key={k} className={b.level <= 2 ? "pt-1 text-[15.5px] font-extrabold text-navy" : "pt-0.5 font-extrabold text-navy"}>
                {inline(b.text, k)}
              </div>
            );
          case "ul":
            return (
              <ul key={k} className="space-y-1 pl-1">
                {b.items.map((it, ii) => (
                  <li key={ii} className="flex gap-2">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />
                    <span className="min-w-0">{inline(it, `${k}-${ii}`)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={k} className="space-y-1 pl-1">
                {b.items.map((it, ii) => (
                  <li key={ii} className="flex gap-2">
                    <span className="num shrink-0 font-bold text-brand-blue">{b.start + ii}.</span>
                    <span className="min-w-0">{inline(it, `${k}-${ii}`)}</span>
                  </li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre key={k} className="overflow-x-auto rounded-xl bg-navy p-3 font-mono text-[12.5px] leading-relaxed text-white">
                {b.text}
              </pre>
            );
          case "table":
            return (
              <div key={k} className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-paper">
                      {b.head.map((c, ci) => (
                        <th key={ci} className="whitespace-nowrap border-b border-line px-2.5 py-1.5 text-left font-extrabold text-navy">
                          {inline(c, `${k}-h${ci}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className="border-t border-line/70">
                        {b.head.map((_, ci) => (
                          <td key={ci} className="px-2.5 py-1.5 align-top">
                            {inline(r[ci] ?? "", `${k}-${ri}-${ci}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "quote":
            return (
              <blockquote key={k} className="border-l-[3px] border-brand-green pl-3 text-muted">
                {b.lines.map((l, li) => (
                  <span key={li}>
                    {li ? <br /> : null}
                    {inline(l, `${k}-${li}`)}
                  </span>
                ))}
              </blockquote>
            );
          case "hr":
            return <hr key={k} className="border-line" />;
        }
      })}
    </div>
  );
}
