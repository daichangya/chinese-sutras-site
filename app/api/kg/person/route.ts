/**
 * 人物 KG 查询（译者匹配）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { findPersonById, findPersonByName, findTranslatorForSutra } from "@/lib/db/dict-kg";
import { entityIdToSlug } from "@/lib/kg/slug";
import { resolveEntityId } from "@/lib/kg/graph";
import { getSqlite } from "@/lib/db";

function withSlug<T extends { id: string } | null>(person: T): (T & { slug?: string }) | null {
  if (!person) return null;
  return { ...person, slug: entityIdToSlug(person.id) };
}

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  const slug = searchParams.get("slug")?.trim();
  const name = searchParams.get("name")?.trim();
  const cbetaId = searchParams.get("cbeta_id")?.trim();

  try {
    if (cbetaId) {
      const { person, translatorLabel } = findTranslatorForSutra(cbetaId);
      return NextResponse.json({ person: withSlug(person), translatorLabel });
    }
    const lookup = slug ?? id;
    if (lookup) {
      const resolved = resolveEntityId(lookup) ?? findPersonById(lookup)?.id;
      const person = resolved ? findPersonById(resolved) : null;
      return NextResponse.json({ person: withSlug(person) });
    }
    if (name) {
      const person = findPersonByName(name);
      return NextResponse.json({ person: withSlug(person) });
    }
    return NextResponse.json({ error: "id, slug, name, or cbeta_id required" }, { status: 400 });
  } catch {
    return NextResponse.json({ person: null });
  }
}
