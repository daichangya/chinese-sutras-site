/**
 * 辞典数据源列表 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { listDictionarySources } from "@/lib/db/dict-kg";

export async function GET() {
  getSqlite();
  return NextResponse.json({ sources: listDictionarySources() });
}
