/**
 * 辞典释义正文（纯文本或佛光大辞典 HTML）
 * @author 代长亚
 */
"use client";

import DOMPurify from "isomorphic-dompurify";
import type { DictEntry } from "@/components/reader/dictionary-popover";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "a",
    "b",
    "br",
    "div",
    "em",
    "font",
    "hr",
    "i",
    "img",
    "li",
    "p",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
  ],
  ALLOWED_ATTR: ["href", "src", "alt", "width", "height", "style", "color", "class"],
  ALLOW_DATA_ATTR: false,
};

function sanitizeDefinitionHtml(html: string): string {
  return String(DOMPurify.sanitize(html, PURIFY_CONFIG));
}

export function DictionaryDefinitionBody({ entry }: { entry: DictEntry }) {
  const html = entry.definitionHtml?.trim();
  if (html) {
    return (
      <div
        data-testid="dict-definition-html"
        className="dict-definition-html mt-3 text-sm leading-relaxed text-[var(--jx-ink)]"
        dangerouslySetInnerHTML={{ __html: sanitizeDefinitionHtml(html) }}
      />
    );
  }
  return (
    <p className="mt-3 text-sm leading-relaxed text-[var(--jx-ink)] whitespace-pre-wrap">
      {entry.definition}
    </p>
  );
}
