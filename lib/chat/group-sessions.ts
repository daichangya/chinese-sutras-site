/**
 * 对话会话按日期分组
 * @author 代长亚
 */
import type { ChatConversation } from "@/lib/chat/types";

export type SessionDateGroup = {
  label: string;
  items: ChatConversation[];
};

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function groupLabel(updatedAt: number, now: number): string {
  const today = startOfDay(now);
  const yesterday = today - 86_400_000;
  const day = startOfDay(updatedAt);

  if (day >= today) return "今天";
  if (day >= yesterday) return "昨天";
  if (day >= today - 7 * 86_400_000) return "近 7 天";
  return "更早";
}

/** 将会话列表按更新时间分组 */
export function groupSessionsByDate(
  conversations: ChatConversation[],
  now = Date.now(),
): SessionDateGroup[] {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const map = new Map<string, ChatConversation[]>();

  for (const c of sorted) {
    const label = groupLabel(c.updatedAt, now);
    const list = map.get(label) ?? [];
    list.push(c);
    map.set(label, list);
  }

  const order = ["今天", "昨天", "近 7 天", "更早"];
  return order
    .filter((label) => map.has(label))
    .map((label) => ({ label, items: map.get(label)! }));
}
