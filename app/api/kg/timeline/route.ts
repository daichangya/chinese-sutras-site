/**
 * 知识图谱时间轴 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getKgTimeline } from "@/lib/kg/graph";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.trim() || undefined;
  return NextResponse.json({ entities: getKgTimeline(type) });
}
