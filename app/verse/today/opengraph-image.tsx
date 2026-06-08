/**
 * 今日经句分享 OG 图
 * @author 代长亚
 */
import { ImageResponse } from "next/og";
import { brandOgSubtitle } from "@/lib/brand";
import { getSqlite } from "@/lib/db";
import { getDailyVerse } from "@/lib/sutra/queries";

export const runtime = "nodejs";
export const alt = "静心 · 今日经句";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default async function Image() {
  getSqlite();
  const daily = getDailyVerse(todayKey());
  const text = (daily?.customText ?? "凡所有相，皆是虚妄。").slice(0, 80);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "linear-gradient(135deg, #faf9f7 0%, #f5f0e8 100%)",
          color: "#1c1917",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, color: "#b45309", marginBottom: 32 }}>
          今日经句 · 静心
        </div>
        <div style={{ fontSize: 42, lineHeight: 1.5, maxWidth: 1000 }}>{text}</div>
        <div style={{ fontSize: 22, marginTop: 48, color: "#78716c" }}>{brandOgSubtitle()}</div>
      </div>
    ),
    { ...size },
  );
}
