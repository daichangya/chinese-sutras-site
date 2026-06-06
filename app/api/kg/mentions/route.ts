/**
 * 知识图谱描述提及 API
 * @author jingxin
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getKgEntityMentions } from "@/lib/kg/mentions";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const id = searchParams.get("id")?.trim();
  const query = slug ?? id;
  if (!query) {
    return NextResponse.json({ error: "slug or id required" }, { status: 400 });
  }
  return NextResponse.json({ mentions: getKgEntityMentions(query) });
}
