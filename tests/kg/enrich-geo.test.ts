/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  parseAmapTemplesJson,
  amapPoiToEntity,
} from "@/lib/kg/enrich-amap-monasteries";
import {
  parseWikidataPoint,
  parseWikidataSparqlResults,
  indexWikidataByName,
} from "@/lib/kg/enrich-person-geo";

describe("parseWikidataPoint", () => {
  it("parses WKT Point", () => {
    expect(parseWikidataPoint("Point(112.45 34.62)")).toEqual({
      lng: 112.45,
      lat: 34.62,
    });
  });
});

describe("parseWikidataSparqlResults", () => {
  it("extracts qid and zh name", () => {
    const rows = parseWikidataSparqlResults({
      results: {
        bindings: [
          {
            item: { value: "http://www.wikidata.org/entity/Q123" },
            itemLabelZh: { value: "玄奘" },
            itemLabel: { value: "Xuanzang" },
            coord: { value: "Point(112.45 34.62)" },
          },
        ],
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.qid).toBe("Q123");
    expect(rows[0]!.nameZh).toBe("玄奘");
  });
});

describe("indexWikidataByName", () => {
  it("indexes by Chinese label", () => {
    const map = indexWikidataByName([
      { qid: "Q1", nameZh: "洛阳", nameEn: "Luoyang", lat: 34, lng: 112 },
    ]);
    expect(map.get("洛阳")?.qid).toBe("Q1");
  });
});

describe("parseAmapTemplesJson", () => {
  it("parses POI array", () => {
    const pois = parseAmapTemplesJson([
      {
        amap_id: "B001",
        name: "白马寺",
        latitude: 34.72,
        longitude: 112.59,
        province: "河南省",
      },
    ]);
    expect(pois).toHaveLength(1);
    expect(pois[0]!.name).toBe("白马寺");
  });
});

describe("amapPoiToEntity", () => {
  it("creates monastery entity with geo_source", () => {
    const e = amapPoiToEntity({
      amap_id: "B001",
      name: "白马寺",
      latitude: 34.72,
      longitude: 112.59,
      province: "河南省",
    });
    expect(e.entity_type).toBe("monastery");
    expect(e.properties?.geo_source).toBe("amap:CN");
    expect(e.properties?.lat).toBe(34.72);
  });
});
