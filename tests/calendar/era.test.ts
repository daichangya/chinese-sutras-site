/**
 * 佛历纪年
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { toBuddhistYear, BUDDHIST_ERA_OFFSET } from "@/lib/calendar/era";

describe("buddhist era", () => {
  it("uses han tradition offset 1027", () => {
    expect(BUDDHIST_ERA_OFFSET).toBe(1027);
    expect(toBuddhistYear(2026)).toBe(3053);
  });
});
