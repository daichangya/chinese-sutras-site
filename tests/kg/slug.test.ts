/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  entityDetailPath,
  entityIdToSlug,
  slugEntityTypeCandidates,
  slugToEntityId,
  personPath,
} from "@/lib/kg/slug";

describe("entityIdToSlug", () => {
  it("converts dila person id to slug", () => {
    expect(entityIdToSlug("kg:person:dila:A000294")).toBe("dila-A000294");
  });

  it("converts seed school id to slug", () => {
    expect(entityIdToSlug("kg:school:seed:华严宗")).toBe("seed-华严宗");
  });

  it("round-trips slug to entity id", () => {
    const id = "kg:person:dila:A000294";
    const slug = entityIdToSlug(id);
    expect(slugToEntityId(slug, "person")).toBe(id);
  });

  it("round-trips seed school slug with school type", () => {
    const id = "kg:school:seed:华严宗";
    const slug = entityIdToSlug(id);
    expect(slug).toBe("seed-华严宗");
    expect(slugToEntityId(slug, "school")).toBe(id);
  });

  it("round-trips text entity slug with text type", () => {
    const id = "kg:text:T08n0254";
    const slug = entityIdToSlug(id);
    expect(slug).toBe("text-T08n0254");
    expect(slugToEntityId(slug, "text")).toBe(id);
  });
});

describe("slugEntityTypeCandidates", () => {
  it("prioritizes school for seed slugs", () => {
    expect(slugEntityTypeCandidates("seed-华严宗")[0]).toBe("school");
  });

  it("prioritizes text for text- slugs", () => {
    expect(slugEntityTypeCandidates("text-T08n0254")[0]).toBe("text");
  });
});

describe("personPath", () => {
  it("builds friendly person URL", () => {
    expect(personPath("kg:person:dila:A000294")).toBe("/person/dila-A000294");
  });
});

describe("entityDetailPath", () => {
  it("routes text entities to sutra when slug known", () => {
    expect(
      entityDetailPath("kg:text:T08n0254", "text", { sutraSlug: "t08n0254" }),
    ).toBe("/sutra/t08n0254");
  });

  it("routes text entities to kg when sutra slug unknown", () => {
    expect(entityDetailPath("kg:text:T08n0999", "text")).toBe(
      "/kg?slug=text-T08n0999",
    );
  });

  it("routes person entities to person page", () => {
    expect(entityDetailPath("kg:person:dila:A000294", "person")).toBe(
      "/person/dila-A000294",
    );
  });

  it("routes school entities to kg explorer", () => {
    expect(entityDetailPath("kg:school:seed:华严宗", "school")).toBe(
      "/kg?slug=seed-%E5%8D%8E%E4%B8%A5%E5%AE%97",
    );
  });

  it("routes place entities to places map", () => {
    expect(entityDetailPath("kg:place:dila:P000001", "place")).toBe(
      "/places?focus=dila-P000001",
    );
  });

  it("routes monastery entities to places map", () => {
    expect(entityDetailPath("kg:monastery:dila:M000001", "monastery")).toBe(
      "/places?focus=dila-M000001",
    );
  });
});
