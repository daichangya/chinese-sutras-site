/**
 * 辞典插图静态服务（语料目录 assets）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { resolveDictAssetAbsolutePath } from "@/lib/dictionaries/dict-asset-path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ source: string; path: string[] }> },
) {
  const { source, path: segments } = await ctx.params;
  const abs = resolveDictAssetAbsolutePath(source, segments);
  if (!abs) {
    return new NextResponse(null, { status: 404 });
  }
  if (!fs.existsSync(abs)) {
    return new NextResponse(null, { status: 404 });
  }
  const ext = path.extname(abs).toLowerCase();
  const contentType = MIME[ext] ?? "application/octet-stream";
  const body = fs.readFileSync(abs);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
