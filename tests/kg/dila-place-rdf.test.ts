/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { parseDilaPlaceRdf } from "@/lib/kg/dila-place-rdf";

const SAMPLE_PLACE_RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#"
  xmlns:bdo="http://purl.bdrc.io/ontology/core/">
  <rdf:Description rdf:about="http://purl.dila.edu.tw/resource/PL3">
    <skos:prefLabel xml:lang="zh-Hant">胜境关</skos:prefLabel>
    <bdo:placeLong>104.313295</bdo:placeLong>
    <bdo:placeLat>25.64813</bdo:placeLat>
    <bdo:placeType>bdr:PT0069</bdo:placeType>
  </rdf:Description>
  <rdf:Description rdf:about="http://purl.dila.edu.tw/resource/PL_NO_COORD">
    <skos:prefLabel xml:lang="zh-Hant">无坐标地</skos:prefLabel>
  </rdf:Description>
</rdf:RDF>`;

describe("parseDilaPlaceRdf", () => {
  it("extracts place entities with lat/lng", () => {
    const entities = parseDilaPlaceRdf(SAMPLE_PLACE_RDF);
    expect(entities).toHaveLength(1);
    expect(entities[0]!.name_zh).toBe("胜境关");
    expect(entities[0]!.id).toBe("kg:place:dila:PL3");
    expect(entities[0]!.properties?.lat).toBeCloseTo(25.64813);
    expect(entities[0]!.properties?.lng).toBeCloseTo(104.313295);
  });
});
