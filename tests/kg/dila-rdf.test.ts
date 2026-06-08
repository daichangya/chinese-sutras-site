/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import { parseDilaPersonRdf } from "@/lib/kg/dila-rdf";

const SAMPLE_RDF = `<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:skos="http://www.w3.org/2004/02/skos/core#"
  xmlns:bdo="http://purl.bdrc.io/ontology/core/">
  <rdf:Description rdf:about="http://purl.dila.edu.tw/resource/A00001">
    <skos:prefLabel xml:lang="zh-Hant">玄奘</skos:prefLabel>
    <skos:prefLabel xml:lang="en">Xuanzang</skos:prefLabel>
    <bdo:noteText>唐代高僧，西行求法，世稱三藏。</bdo:noteText>
    <bdo:personTeacher rdf:resource="http://purl.dila.edu.tw/resource/A00002"/>
  </rdf:Description>
  <rdf:Description rdf:about="http://purl.dila.edu.tw/resource/A00002">
    <skos:prefLabel xml:lang="zh-Hant">道宣</skos:prefLabel>
  </rdf:Description>
</rdf:RDF>`;

describe("parseDilaPersonRdf", () => {
  it("extracts persons and teacher_of edges", () => {
    const { entities, relations } = parseDilaPersonRdf(SAMPLE_RDF);
    expect(entities.some((e) => e.name_zh === "玄奘")).toBe(true);
    const teach = relations.find((r) => r.predicate === "teacher_of" && r.object_id.includes("A00001"));
    expect(teach?.subject_id).toContain("A00002");
  });

  it("stores simplified description", () => {
    const { entities } = parseDilaPersonRdf(SAMPLE_RDF);
    const xuanzang = entities.find((e) => e.name_zh === "玄奘");
    expect(xuanzang?.properties?.description).toBe("唐代高僧，西行求法，世称三藏。");
  });
});
