/**
 * 相似段落 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { findSimilarParagraphs } from "@/lib/reader/similar";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const paragraphId = searchParams.get("paragraphId")?.trim();
  if (!paragraphId) {
    return NextResponse.json({ error: "paragraphId required" }, { status: 400 });
  }
  const similar = findSimilarParagraphs(paragraphId, 6);
  return NextResponse.json({ similar });
}
