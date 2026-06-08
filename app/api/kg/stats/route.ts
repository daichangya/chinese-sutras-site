/**
 * 知识图谱统计 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getKgStats } from "@/lib/kg/graph";

export async function GET() {
  getSqlite();
  return NextResponse.json(getKgStats());
}
