/**
 * GET /api/kg/geo
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getKgGeoEntities } from "@/lib/kg/graph";

const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 25000;

function parseBbox(
  raw: string | null,
): { minLat: number; maxLat: number; minLng: number; maxLng: number } | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => parseFloat(s.trim()));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return undefined;
  const [minLat, minLng, maxLat, maxLng] = parts;
  return { minLat, maxLat, minLng, maxLng };
}

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const types = searchParams.get("types")?.split(",").filter(Boolean);
  const parsed = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = Number.isNaN(parsed)
    ? DEFAULT_LIMIT
    : Math.min(Math.max(parsed, 1), MAX_LIMIT);
  const bbox = parseBbox(searchParams.get("bbox"));
  const entities = getKgGeoEntities({ types, limit, bbox });
  return NextResponse.json(
    { entities, total: entities.length },
    {
      headers: {
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
      },
    },
  );
}
