import { NextResponse } from "next/server";
import { t2s, MAX_TEXT_LENGTH, type ConvertBackend } from "@/lib/han";

type ConvertBody = {
  text?: string;
  normalize?: boolean;
  backend?: ConvertBackend;
};

function parseBody(body: ConvertBody) {
  const text = body.text?.trim();
  if (!text) return { error: "text is required" as const };
  if (text.length > MAX_TEXT_LENGTH) {
    return { error: `text exceeds maximum length of ${MAX_TEXT_LENGTH}` as const };
  }
  const backend = body.backend ?? "auto";
  if (backend !== "auto" && backend !== "js" && backend !== "cli") {
    return { error: "invalid backend" as const };
  }
  return { text, normalize: body.normalize, backend };
}

export async function POST(req: Request) {
  const body = (await req.json()) as ConvertBody;
  const parsed = parseBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = t2s(parsed.text, {
      normalize: parsed.normalize,
      backend: parsed.backend,
    });
    return NextResponse.json({
      text: result.text,
      original: result.original,
      detected: result.detected,
      backend: result.backend,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
