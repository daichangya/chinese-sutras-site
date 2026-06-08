/**
 * 译者人物卡片（经头展示）
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { personPath } from "@/lib/kg/slug";

type PersonCard = {
  id: string;
  slug?: string;
  name_zh: string;
  name_en: string | null;
  properties: string | null;
};

export function TranslatorCard({
  cbetaId,
  translatorLabel,
}: {
  cbetaId: string;
  translatorLabel: string | null;
}) {
  const [person, setPerson] = useState<PersonCard | null>(null);

  useEffect(() => {
    if (!cbetaId) return;
    fetch(`/api/kg/person?cbeta_id=${encodeURIComponent(cbetaId)}`)
      .then((r) => r.json())
      .then((data: { person?: PersonCard | null }) => setPerson(data.person ?? null))
      .catch(() => {});
  }, [cbetaId]);

  if (!translatorLabel && !person) return null;

  const dynasties = person?.properties
    ? (() => {
        try {
          const p = JSON.parse(person.properties) as { dynasty?: string };
          return p.dynasty;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="mt-4 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] px-4 py-3 text-sm">
      <p className="text-xs text-[var(--jx-muted-label)] mb-1">译者</p>
      {person ? (
        <Link
          href={personPath(person.id)}
          className="font-medium text-[var(--jx-accent-cinnabar)] hover:underline dark:text-[var(--jx-gold)]"
        >
          {person.name_zh}
        </Link>
      ) : (
        <span className="text-[var(--foreground)]">{translatorLabel}</span>
      )}
      {(dynasties || person?.name_en) && (
        <p className="mt-1 text-xs text-[var(--muted)]">
          {[dynasties, person?.name_en].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}
