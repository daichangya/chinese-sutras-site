"use client";

import { ChevronDown } from "lucide-react";

type VersionOption = {
  id: string;
  label: string;
  description: string;
};

/** 可用版本列表 */
const VERSION_OPTIONS: VersionOption[] = [
  { id: "original", label: "底本", description: "原始经文" },
  { id: "commentary", label: "注疏", description: "含疏注经文" },
  { id: "vernacular", label: "白话", description: "白话译文" },
];

export function VersionSelector({
  selected,
  onChange,
  available,
}: {
  selected: string;
  onChange: (id: string) => void;
  available?: string[];
}) {
  const options = available
    ? VERSION_OPTIONS.filter((o) => available.includes(o.id))
    : VERSION_OPTIONS;

  const current = options.find((o) => o.id === selected) ?? options[0];

  return (
    <div className="relative inline-block">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none cursor-pointer rounded-full border border-[var(--jx-border)] bg-[var(--card)] px-3 py-1.5 pr-8 text-xs font-medium text-[var(--foreground)] hover:border-[var(--jx-border-strong)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--jx-accent-cinnabar)]/30"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}（{o.description}）
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-[var(--jx-muted-label)]" />
    </div>
  );
}

/**
 * 从段落数据判断该 sutra 有哪些可用版本
 */
export function getAvailableVersions(paragraphs: Array<{ text: string; colloquial?: string | null; commentary?: string | null }>): string[] {
  const versions: string[] = ["original"];
  if (paragraphs.some((p) => p.colloquial && p.colloquial.trim())) {
    versions.push("vernacular");
  }
  if (paragraphs.some((p) => p.commentary && String(p.commentary).trim())) {
    versions.push("commentary");
  }
  return versions;
}
