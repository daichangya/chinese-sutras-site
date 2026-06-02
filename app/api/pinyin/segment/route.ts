import { NextResponse } from "next/server";
import {
  MAX_PINYIN_TEXT_LENGTH,
  segmentText,
  type PinyinScript,
} from "@/lib/pinyin";

type SegmentBody = {
  text?: string;
  canonicalId?: string;
  script?: PinyinScript;
  useCache?: boolean;
};

function parseBody(body: SegmentBody) {
  const text = body.text?.trim();
  if (!text) return { error: "text is required" as const };
  if (text.length > MAX_PINYIN_TEXT_LENGTH) {
    return {
      error: `text exceeds maximum length of ${MAX_PINYIN_TEXT_LENGTH}` as const,
    };
  }
  const script = body.script ?? "traditional";
  if (script !== "traditional" && script !== "simplified") {
    return { error: "invalid script" as const };
  }
  return {
    text,
    canonicalId: body.canonicalId,
    script,
    useCache: body.useCache,
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as SegmentBody;
  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = segmentText(parsed.text, {
      canonicalId: parsed.canonicalId,
      script: parsed.script,
      useCache: parsed.useCache,
    });
    return NextResponse.json({
      readings: result.readings,
      cached: result.cached,
      dictVersion: result.dictVersion,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
