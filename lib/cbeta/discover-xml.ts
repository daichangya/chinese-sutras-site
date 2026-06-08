/**
 * 扫描 CBETA xml-p5 目录下的经文 XML
 * @author 代长亚
 */
import fs from "fs";
import path from "path";

export type DiscoveredXml = {
  cbetaId: string;
  absolutePath: string;
};

/** T08n0236a.xml、J31nB269.xml */
const CBETA_XML_NAME = /^([A-Z]+\d+n(?:\d+[A-Za-z]?|[A-Za-z]\d+))\.xml$/;

export function cbetaIdFromXmlFilename(filename: string): string | null {
  const m = filename.match(CBETA_XML_NAME);
  return m ? m[1] : null;
}

export function discoverCbetaXmlFiles(xmlRoot: string): DiscoveredXml[] {
  const out: DiscoveredXml[] = [];
  const seen = new Set<string>();

  if (!fs.existsSync(xmlRoot)) return out;

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".xml")) continue;

      const cbetaId = cbetaIdFromXmlFilename(entry.name);
      if (!cbetaId || seen.has(cbetaId)) continue;

      seen.add(cbetaId);
      out.push({ cbetaId, absolutePath: path.resolve(full) });
    }
  };

  walk(path.resolve(xmlRoot));
  return out.sort((a, b) => a.cbetaId.localeCompare(b.cbetaId));
}
