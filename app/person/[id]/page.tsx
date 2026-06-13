/**
 * 人物详情页
 * @author 代长亚
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { PersonDetail } from "@/components/kg/person-detail";
import { findPersonById } from "@/lib/db/dict-kg";
import {
  getPersonRelations,
  getSutrasForPerson,
  getSutraSlugForTextEntity,
  lookupKgEntityMeta,
  resolveEntityId,
} from "@/lib/kg/graph";
import { parseEntityProperties } from "@/lib/kg/display";
import { entityDetailPath, entityIdToSlug, personPath } from "@/lib/kg/slug";
import { isHeuristicPersonId } from "@/lib/kg/visibility";
import { getSqlite } from "@/lib/db";
import { brandPageTitleSuffix } from "@/lib/brand";

export const revalidate = 3600;

async function resolvePersonId(raw: string): Promise<string | null> {
  const decoded = decodeURIComponent(raw);
  if (isHeuristicPersonId(decoded)) return null;
  const fromSlug = resolveEntityId(decoded, "person");
  if (fromSlug) return fromSlug;
  const person = findPersonById(decoded);
  return person?.id ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getSqlite();
  const personId = await resolvePersonId(id);
  const person = personId ? findPersonById(personId) : null;
  return {
    title: person ? `${person.name_zh} | ${brandPageTitleSuffix()}` : `人物 | ${brandPageTitleSuffix()}`,
    description: person
      ? `${person.name_zh} — 汉传佛教知识图谱人物条目`
      : "佛教人物知识条目",
  };
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const decoded = decodeURIComponent(rawId);

  if (isHeuristicPersonId(decoded)) notFound();

  getSqlite();
  let personId = await resolvePersonId(rawId);
  if (!personId) {
    const entityId = resolveEntityId(decoded);
    const meta = entityId ? lookupKgEntityMeta(entityId) : null;
    if (meta && meta.entity_type !== "person") {
      const sutraSlug =
        meta.entity_type === "text" ? getSutraSlugForTextEntity(meta.id) : null;
      redirect(entityDetailPath(meta.id, meta.entity_type, { sutraSlug }));
    }
    notFound();
  }

  const canonicalSlug = entityIdToSlug(personId);
  if (decoded.startsWith("kg:") || decoded !== canonicalSlug) {
    redirect(personPath(personId));
  }

  const person = findPersonById(personId);
  if (!person) notFound();

  const relations = getPersonRelations(personId).map((r) => ({
    ...r,
    otherSutraSlug: r.otherType === "text" ? getSutraSlugForTextEntity(r.otherId) : null,
  }));
  const sutras = getSutrasForPerson(personId);
  const props = parseEntityProperties(person.properties);

  return (
    <PageShell variant="fade">
      <nav className="mb-6 flex items-center gap-2 text-xs text-[var(--jx-muted-label)]">
        <Link href="/kg" className="hover:text-[var(--foreground)]">
          知识图谱
        </Link>
        <span>/</span>
        <span className="text-[var(--foreground)]">{person.name_zh}</span>
      </nav>

      <PageHeader
        label="人物"
        title={person.name_zh}
        description={person.name_en ?? undefined}
      />

      <PersonDetail
        person={{
          id: person.id,
          name_zh: person.name_zh,
          name_en: person.name_en,
          properties: props,
        }}
        relations={relations}
        sutras={sutras}
      />
    </PageShell>
  );
}
