/**
 * 知识图谱关系筛选控件
 * @author 代长亚
 */
"use client";

import { PREDICATE_DESC, PREDICATE_LABELS } from "@/lib/kg/labels";

const ALL_PREDICATES = [
  "translated",
  "teacher_of",
  "composed_in",
  "commentary_on",
  "active_in",
  "member_of_school",
  "associated_with",
  "parallel_to",
] as const;

export function KgControls({
  predicates,
  onPredicatesChange,
}: {
  predicates: string[];
  onPredicatesChange: (p: string[]) => void;
}) {
  const toggle = (pred: string) => {
    if (predicates.includes(pred)) {
      onPredicatesChange(predicates.filter((x) => x !== pred));
    } else {
      onPredicatesChange([...predicates, pred]);
    }
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] px-4 py-3 text-xs">
      <span className="text-[var(--jx-muted-label)]">关系类型</span>
      {ALL_PREDICATES.map((pred) => {
        const active = predicates.includes(pred);
        return (
          <button
            key={pred}
            type="button"
            title={PREDICATE_DESC[pred]}
            onClick={() => toggle(pred)}
            className={`rounded-full border px-2 py-0.5 ${
              active
                ? "border-[var(--jx-accent-cinnabar)]/50 bg-[var(--jx-accent-cinnabar)]/10"
                : "border-[var(--jx-border)] opacity-60"
            }`}
          >
            {PREDICATE_LABELS[pred] ?? pred}
          </button>
        );
      })}
    </div>
  );
}
