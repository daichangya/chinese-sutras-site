/**
 * 高品质 TTS API（Edge 默认 / Azure 可选）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import {
  getActiveProvider,
  getTtsVoice,
  isCloudTtsAvailable,
  synthesizeSpeech,
} from "@/lib/reader/speech/tts-server";
import { checkTtsRateLimit } from "@/lib/reader/speech/tts-rate-limit";

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET() {
  const available = isCloudTtsAvailable();
  return NextResponse.json({
    available,
    provider: getActiveProvider(),
    voice: getTtsVoice(),
  });
}

export async function POST(req: Request) {
  if (!isCloudTtsAvailable()) {
    return NextResponse.json({ error: "高品质朗读未配置" }, { status: 503 });
  }

  const ip = clientIp(req);
  if (!checkTtsRateLimit(ip)) {
    return NextResponse.json({ error: "请求过于频繁，请稍后再试" }, { status: 429 });
  }

  let body: { text?: string; rate?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "无效请求体" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "缺少 text" }, { status: 400 });
  }

  const rate = [0.75, 1, 1.25].includes(body.rate as number)
    ? (body.rate as number)
    : 1;

  try {
    const audio = await synthesizeSpeech(text, rate);
    return new NextResponse(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "合成失败" },
      { status: 502 },
    );
  }
}
