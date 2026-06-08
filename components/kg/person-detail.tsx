/**
 * 人物详情展示
 * @author 代长亚
 */
import Link from "next/link";
import { SectionHeader } from "@/components/ui/section-header";
import { entityBioText, personDisplayDates, personDynasty, personSchool } from "@/lib/kg/display";
import { labelPredicate, labelProperty, labelType, PREDICATE_ORDER } from "@/lib/kg/labels";
import { entityDetailPath, personPath } from "@/lib/kg/slug";

export function PersonDetail({
  person,
  relations,
  sutras,
}: {
  person: {
    id: string;
    name_zh: string;
    name_en: string | null;
    properties: Record<string, unknown>;
  };
  relations: Array<{
    predicate: string;
    otherId: string;
    otherName: string;
    otherType: string;
    otherSutraSlug?: string | null;
  }>;
  sutras: Array<{ cbetaId: string; title: string; slug: string }>;
}) {
  const dates = personDisplayDates(person.properties);
  const dynasty = personDynasty(person.properties);
  const school = personSchool(person.properties);
  const bio = entityBioText(person.properties);

  const grouped = new Map<string, typeof relations>();
  for (const r of relations) {
    const list = grouped.get(r.predicate) ?? [];
    list.push(r);
    grouped.set(r.predicate, list);
  }

  const propEntries = Object.entries(person.properties)
    .filter(([k]) => !["description", "summary", "bio", "raw_translator"].includes(k))
    .slice(0, 8);

  function otherLink(r: (typeof relations)[0]) {
    if (r.otherType === "person") return personPath(r.otherId);
    return entityDetailPath(r.otherId, r.otherType, {
      sutraSlug: r.otherSutraSlug ?? null,
    });
  }

  return (
    <>
      {(dynasty || school || dates) && (
        <p className="mb-6 text-sm text-[var(--muted)]">
          {[dynasty, school, dates.replace(/[（）]/g, "")].filter(Boolean).join(" · ")}
        </p>
      )}

      {bio && (
        <section className="mb-8" data-testid="person-bio">
          <SectionHeader label="简介" />
          <p className="text-sm leading-relaxed text-[var(--foreground)]">{bio}</p>
        </section>
      )}

      {propEntries.length > 0 && (
        <dl className="mb-8 grid gap-2 border-b border-[var(--jx-border)] pb-6 text-sm sm:grid-cols-2">
          {propEntries.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-[var(--jx-muted-label)]">{labelProperty(k)}</dt>
              <dd className="text-[var(--foreground)]">{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {relations.length === 0 && sutras.length === 0 && (
        <p className="text-sm text-[var(--muted)]">
          暂无关联经目或关系数据。可前往{" "}
          <Link href="/kg" className="text-[var(--jx-accent-cinnabar)] hover:underline">
            知识图谱
          </Link>{" "}
          浏览其他人物。
        </p>
      )}

      {sutras.length > 0 && (
        <section className="mb-10">
          <SectionHeader label="相关经目" />
          <ul className="space-y-2">
            {sutras.map((s) => (
              <li key={s.cbetaId}>
                <Link href={`/sutra/${s.slug}`} className="jx-sutra-card block px-4 py-3 text-sm">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {grouped.size > 0 && (
        <section>
          <SectionHeader label="关系" />
          <div className="space-y-4">
            {PREDICATE_ORDER.filter((p) => grouped.has(p)).map((pred) => (
              <div key={pred}>
                <p className="mb-2 text-xs font-medium text-[var(--jx-muted-label)]">
                  {labelPredicate(pred)}
                </p>
                <ul className="space-y-2">
                  {(grouped.get(pred) ?? []).map((r, i) => (
                    <li
                      key={`${r.otherId}-${i}`}
                      className="rounded-lg border border-[var(--jx-border)] px-4 py-3 text-sm"
                    >
                      <Link href={otherLink(r)} className="text-[var(--jx-accent-cinnabar)] hover:underline">
                        {r.otherName}
                      </Link>
                      <span className="ml-2 text-xs text-[var(--jx-muted-label)]">
                        {labelType(r.otherType)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
