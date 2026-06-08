/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { isHeuristicPerson, isHeuristicPersonId, isUserFacingEntity } from "@/lib/kg/visibility";

describe("visibility", () => {
  it("detects heuristic person ids", () => {
    expect(isHeuristicPersonId("kg:person:heuristic:name:玄奘")).toBe(true);
    expect(isHeuristicPersonId("kg:person:dila:A000294")).toBe(false);
  });

  it("filters heuristic persons from user facing", () => {
    expect(isUserFacingEntity("person", "heuristic")).toBe(false);
    expect(isUserFacingEntity("person", "authoritative")).toBe(true);
    expect(isUserFacingEntity("text", "heuristic")).toBe(true);
  });

  it("isHeuristicPerson matches entity type and tier", () => {
    expect(isHeuristicPerson("person", "heuristic")).toBe(true);
    expect(isHeuristicPerson("person", "authoritative")).toBe(false);
  });
});
