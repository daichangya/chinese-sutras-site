/**
 * AI 黄金集回归（Mock 模式，合并门禁）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { describe, expect, it, beforeAll } from "vitest";
import { chatCompletion } from "@/lib/ai/gateway";
import { buildExplainPrompt } from "@/lib/ai/prompts";

type GoldenEntry = {
  phrase: string;
  sutra: string;
  forbidInResponse: string[];
};

const goldenPath = path.join(__dirname, "golden-phrases.json");

describe("AI golden phrases", () => {
  beforeAll(() => {
    process.env.AI_MOCK = "1";
  });

  const entries = JSON.parse(fs.readFileSync(goldenPath, "utf-8")) as GoldenEntry[];

  it.each(entries.map((e) => [e.phrase, e] as const))(
    "explains %s without forbidden names",
    async (_label, entry) => {
      const { system, user } = buildExplainPrompt("modern", entry.phrase, {
        sutraTitle: entry.sutra,
        before: "",
        after: "",
      });
      const content = await chatCompletion([
        { role: "system", content: system },
        { role: "user", content: user },
      ]);
      expect(content.length).toBeGreaterThan(10);
      for (const forbidden of entry.forbidInResponse) {
        expect(content).not.toContain(forbidden);
      }
    },
    15_000,
  );
});
