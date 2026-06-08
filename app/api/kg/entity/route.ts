/**
 * 知识图谱实体详情 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getEntityDetail, resolveEntityId } from "@/lib/kg/graph";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim();
  const slug = searchParams.get("slug")?.trim();

  const query = slug ?? id;
  if (!query) {
    return NextResponse.json({ error: "id or slug required" }, { status: 400 });
  }

  const entityType = searchParams.get("entityType")?.trim() || undefined;
  const entityId = resolveEntityId(query, entityType) ?? resolveEntityId(query);
  if (!entityId) {
    return NextResponse.json({ entity: null }, { status: 404 });
  }

  const entity = getEntityDetail(entityId);
  if (!entity) {
    return NextResponse.json({ entity: null }, { status: 404 });
  }

  return NextResponse.json({ entity });
}
