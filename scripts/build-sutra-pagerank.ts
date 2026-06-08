/**
 * 从 cbeta/idx/pagerank.txt 生成 data/sutra-pagerank.json
 * @author 代长亚
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "cbeta/idx/pagerank.txt");
const OUT = path.join(ROOT, "data/sutra-pagerank.json");

const ID_RE = /^#?([A-Za-z]+\d+n[\dA-Za-z_]+)/;

type PagerankPayload = {
  order: Record<string, number>;
  downrank: string[];
};

function parsePagerankFile(content: string): PagerankPayload {
  const order: Record<string, number> = {};
  const downrank: string[] = [];
  let rank = 0;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const m = trimmed.match(ID_RE);
    if (!m) continue;
    const id = m[1]!.toUpperCase();
    if (trimmed.startsWith("#")) {
      downrank.push(id);
      order[id] = 900_000 + downrank.length;
    } else {
      order[id] = rank;
      rank += 1;
    }
  }

  return { order, downrank };
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Missing ${SRC}`);
    process.exit(1);
  }
  const payload = parsePagerankFile(fs.readFileSync(SRC, "utf8"));
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 0)}\n`, "utf8");
  console.log(
    `Wrote ${OUT}: ${Object.keys(payload.order).length} ids, ${payload.downrank.length} downranked`,
  );
}

main();
