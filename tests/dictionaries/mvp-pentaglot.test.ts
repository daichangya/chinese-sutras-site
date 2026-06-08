/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { parseMvpEntry, parsePentaglotEntry } from "@/lib/dictionaries/dila-tei";

describe("MVP / Pentaglot parsers", () => {
  it("parseMvpEntry reads orth + cit", () => {
    const rec = parseMvpEntry(
      {
        form: { orth: { "#text": "buddhaḥ", "@_lang": "san-Latn" } },
        cit: { quote: "佛", "@_lang": "zho-Hant" },
        "@_key": "1",
      },
      0,
      "mahavyutpatti",
    );
    expect(rec?.headword).toBe("buddhaḥ");
    expect(rec?.definition).toContain("佛");
  });

  it("parsePentaglotEntry uses Chinese headword", () => {
    const rec = parsePentaglotEntry(
      {
        sense: [
          { "#text": "buddhaḥ", "@_lang": "san-Latn" },
          { "#text": "佛", "@_lang": "zho-Hant" },
        ],
        "@_id": "p005.2",
      },
      0,
      "pentaglot",
    );
    expect(rec?.headword).toBe("佛");
    expect(rec?.reading).toBe("buddhaḥ");
  });
});
