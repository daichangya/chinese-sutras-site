import { NextResponse } from "next/server";
import { buildCacheKey, getCachedExplanation, setCachedExplanation } from "@/lib/ai/cache";
import { chatCompletion } from "@/lib/ai/gateway";
import { AI_DISCLAIMER, buildExplainPrompt, type ExplainTab } from "@/lib/ai/prompts";
import { getParagraphById } from "@/lib/sutra/queries";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    selection?: string;
    tab?: ExplainTab;
    paragraphId?: string;
    sutraTitle?: string;
  };

  const selection = body.selection?.trim();
  const tab = body.tab ?? "modern";
  const sutraTitle = body.sutraTitle ?? "佛经";

  if (!selection || selection.length < 2) {
    return NextResponse.json({ error: "selection too short" }, { status: 400 });
  }

  let before = "";
  let after = "";
  if (body.paragraphId) {
    const p = getParagraphById(body.paragraphId);
    if (p) {
      before = p.text.slice(0, 120);
      after = p.text.slice(-120);
    }
  }

  const model = process.env.AI_MODEL ?? "default";
  const cacheKey = buildCacheKey(selection, body.paragraphId, tab, model);
  const cached = getCachedExplanation(cacheKey);
  if (cached) {
    return NextResponse.json({ content: cached, disclaimer: AI_DISCLAIMER, cached: true });
  }

  const { system, user } = buildExplainPrompt(tab, selection, { sutraTitle, before, after });
  const content = await chatCompletion([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  setCachedExplanation(cacheKey, tab, content, model);
  return NextResponse.json({ content, disclaimer: AI_DISCLAIMER, cached: false });
}
