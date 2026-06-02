import { NextResponse } from "next/server";
import { t2s } from "@/lib/han";
import {
  MAX_PINYIN_TEXT_LENGTH,
  segmentText,
  type PinyinScript,
} from "@/lib/pinyin";

type TextBody = {
  text?: string;
  canonicalId?: string;
  script?: PinyinScript;
  separator?: string;
  /** 当 script=simplified 且输入为繁体时，先 t2s */
  convertToSimplified?: boolean;
  useCache?: boolean;
};

function parseBody(body: TextBody) {
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
  const separator = body.separator ?? " ";
  if (separator !== " " && separator !== "") {
    return { error: "separator must be ' ' or ''" as const };
  }
  return {
    text,
    canonicalId: body.canonicalId,
    script,
    separator,
    convertToSimplified: body.convertToSimplified ?? false,
    useCache: body.useCache,
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as TextBody;
  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    let text = parsed.text;
    if (parsed.script === "simplified" && parsed.convertToSimplified) {
      text = t2s(text, { backend: "js" }).text;
    }
    const result = segmentText(text, {
      canonicalId: parsed.canonicalId,
      script: parsed.script,
      useCache: parsed.useCache,
      separator: parsed.separator,
    });
    return NextResponse.json({
      pinyin: result.pinyin,
      readings: result.readings,
      cached: result.cached,
      dictVersion: result.dictVersion,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
