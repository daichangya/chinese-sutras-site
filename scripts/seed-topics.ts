/**
 * 种子：专题与 tag
 * @author jingxin
 */
import { v4 as uuidv4 } from "uuid";
import { getSqlite, closeDb } from "@/lib/db";

const db = getSqlite();

const slugToId = (slug: string) => {
  const row = db.prepare(`SELECT id FROM sutra WHERE slug = ?`).get(slug) as { id: string } | undefined;
  return row?.id;
};

const kongxingIntro = `## 什么是「空」

「空」不是虚无，而是说一切现象都依赖因缘和合，没有固定不变的自性。本专题从《心经》《金刚经》《中论》三条脉络，帮助你由浅入深建立般若正见。`;

const jingtuIntro = `## 净土入门

净土法门依阿弥陀佛本愿，以信愿持名、专念往生。以下三经为净土核心经典，建议按「无量寿 → 阿弥陀 → 观无量寿」顺序阅读。`;

db.prepare(
  `INSERT OR REPLACE INTO topic (id, slug, title, description, intro_md) VALUES (?, ?, ?, ?, ?)`,
).run(
  "topic-kongxing",
  "kongxing",
  "空性专题",
  "从《心经》《金刚经》等经典入门「空」的智慧。",
  kongxingIntro,
);

db.prepare(
  `INSERT OR REPLACE INTO topic (id, slug, title, description, intro_md) VALUES (?, ?, ?, ?, ?)`,
).run(
  "topic-jingtu",
  "jingtu",
  "净土专题",
  "依弥陀愿力与三经一论，了解净土信仰与念佛往生的核心经文脉络。",
  jingtuIntro,
);

const kongxingItems: Array<{ slug: string; quote: string }> = [
  { slug: "xinjing", quote: "色不异空，空不异色——认识「空」最短的入门钥匙。" },
  { slug: "jingangjing", quote: "应无所住而生其心——在行动中不执着相。" },
  { slug: "zhonglun", quote: "缘起性空——中观对「空」的哲学展开。" },
];

kongxingItems.forEach((item, i) => {
  const sid = slugToId(item.slug);
  if (sid) {
    db.prepare(
      `INSERT OR REPLACE INTO topic_item (id, topic_id, sutra_id, sort_order, quote) VALUES (?, ?, ?, ?, ?)`,
    ).run(uuidv4(), "topic-kongxing", sid, i, item.quote);
  }
});

const jingtuItems: Array<{ slug: string; quote: string }> = [
  { slug: "amituojing", quote: "南无阿弥陀佛——持名念佛的殊胜法门。" },
  { slug: "wuliangshoujing", quote: "三辈九品——了解往生净土的阶位。" },
  { slug: "guanwuliangshoujing", quote: "十六观——从观像到念佛的修行次第。" },
];

jingtuItems.forEach((item, i) => {
  const sid = slugToId(item.slug);
  if (sid) {
    db.prepare(
      `INSERT OR REPLACE INTO topic_item (id, topic_id, sutra_id, sort_order, quote) VALUES (?, ?, ?, ?, ?)`,
    ).run(uuidv4(), "topic-jingtu", sid, i, item.quote);
  }
});

const tags = [
  { id: "tag-prajna", slug: "prajna", name: "般若" },
  { id: "tag-pureland", slug: "pure-land", name: "净土" },
];

for (const t of tags) {
  db.prepare(`INSERT OR IGNORE INTO tag (id, slug, name) VALUES (?, ?, ?)`).run(t.id, t.slug, t.name);
}

const prajnaSlugs = ["xinjing", "jingangjing", "zhonglun"];
for (const slug of prajnaSlugs) {
  const sid = slugToId(slug);
  if (sid) db.prepare(`INSERT OR IGNORE INTO sutra_tag (sutra_id, tag_id) VALUES (?, ?)`).run(sid, "tag-prajna");
}

const pureSlugs = ["amituojing", "wuliangshoujing", "guanwuliangshoujing"];
for (const slug of pureSlugs) {
  const sid = slugToId(slug);
  if (sid) db.prepare(`INSERT OR IGNORE INTO sutra_tag (sutra_id, tag_id) VALUES (?, ?)`).run(sid, "tag-pureland");
}

console.log("Seeded topics and tags");
closeDb();
