/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { groupSessionsByDate } from "@/lib/chat/group-sessions";
import type { ChatConversation } from "@/lib/chat/types";

function conv(id: string, updatedAt: number): ChatConversation {
  return {
    id,
    title: id,
    messages: [],
    createdAt: updatedAt,
    updatedAt,
  };
}

describe("groupSessionsByDate", () => {
  const now = new Date("2026-06-05T12:00:00").getTime();

  it("groups today and yesterday", () => {
    const today = now - 3_600_000;
    const yesterday = now - 86_400_000 - 3_600_000;
    const groups = groupSessionsByDate(
      [conv("a", yesterday), conv("b", today)],
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(["今天", "昨天"]);
    expect(groups[0].items[0].id).toBe("b");
    expect(groups[1].items[0].id).toBe("a");
  });

  it("sorts by updatedAt descending within group", () => {
    const t1 = now - 1_000;
    const t2 = now - 2_000;
    const groups = groupSessionsByDate([conv("old", t2), conv("new", t1)], now);
    expect(groups[0].items.map((c) => c.id)).toEqual(["new", "old"]);
  });
});
