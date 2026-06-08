/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { getAvailableVersions } from "@/components/parallel/version-selector";

describe("getAvailableVersions", () => {
  it("returns only original when no colloquial or commentary", () => {
    expect(
      getAvailableVersions([{ text: "观自在菩萨", colloquial: null, commentary: null }]),
    ).toEqual(["original"]);
  });

  it("includes vernacular when colloquial present", () => {
    expect(
      getAvailableVersions([{ text: "原文", colloquial: "白话", commentary: null }]),
    ).toContain("vernacular");
  });
});
