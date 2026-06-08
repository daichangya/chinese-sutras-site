/**
 * 缺字 fallback 渲染
 * @author 代长亚
 */
import type { ReactNode } from "react";

const GAIJI_PATTERN = /\[?CB\d{5}\]?|□|〓/g;

export function GaijiText({ text }: { text: string }) {
  const parts = text.split(GAIJI_PATTERN);
  const matches = text.match(GAIJI_PATTERN);

  if (!matches) {
    return <>{text}</>;
  }

  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part) nodes.push(<span key={`p-${i}`}>{part}</span>);
    if (matches[i]) {
      nodes.push(
        <span key={`g-${i}`} className="gaiji-fallback" title="缺字" role="note" aria-label="此处有缺字">
          〔缺〕
        </span>,
      );
    }
  });
  return <>{nodes}</>;
}
