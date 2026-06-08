/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  FOJIN_CONCEPTS,
  FOJIN_SCHOOLS,
  buildFojinCuratedSeed,
} from "@/lib/kg/seed-fojin-curated";

describe("buildFojinCuratedSeed", () => {
  it("generates 12 school entities when none exist", () => {
    const { entities, relations } = buildFojinCuratedSeed([]);
    const schools = entities.filter((e) => e.entity_type === "school");
    expect(schools).toHaveLength(FOJIN_SCHOOLS.length);
    expect(schools.some((s) => s.name_zh === "禅宗" && s.id === "kg:school:seed:禅宗")).toBe(true);
    expect(relations.some((r) => r.predicate === "member_of_school")).toBe(true);
  });

  it("generates 18 concept entities when none exist", () => {
    const { entities } = buildFojinCuratedSeed([]);
    const concepts = entities.filter((e) => e.entity_type === "concept");
    expect(concepts).toHaveLength(FOJIN_CONCEPTS.length);
    expect(concepts.some((c) => c.name_zh === "般若")).toBe(true);
  });

  it("skips schools that already exist by name", () => {
    const { entities } = buildFojinCuratedSeed([
      {
        id: "kg:school:dila:chan",
        entity_type: "school",
        name_zh: "禅宗",
        source_tier: "authoritative",
        source: "dila",
      },
    ]);
    expect(entities.some((e) => e.entity_type === "school" && e.name_zh === "禅宗")).toBe(false);
    expect(entities.filter((e) => e.entity_type === "school")).toHaveLength(11);
  });

  it("resolves person relations to existing dila person", () => {
    const { relations } = buildFojinCuratedSeed([
      {
        id: "kg:person:dila:A001",
        entity_type: "person",
        name_zh: "慧能",
        source_tier: "authoritative",
        source: "dila",
      },
      {
        id: "kg:school:seed:禅宗",
        entity_type: "school",
        name_zh: "禅宗",
        source_tier: "authoritative",
        source: "seed:school_affiliation",
      },
    ]);
    const member = relations.find(
      (r) =>
        r.predicate === "member_of_school" &&
        r.subject_id === "kg:person:dila:A001" &&
        r.object_id === "kg:school:seed:禅宗",
    );
    expect(member).toBeTruthy();
  });
});
