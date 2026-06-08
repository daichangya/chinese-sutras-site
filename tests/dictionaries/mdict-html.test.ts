/**
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  decodeHtmlEntities,
  prepareFoguangDefinitionHtml,
  rewriteMdictImages,
  stripMdictBom,
  stripMdictHtml,
} from "@/lib/dictionaries/mdict-html";

describe("mdict-html", () => {
  it("strips tags and decodes entities", () => {
    const html = "<p>般若&nbsp;&nbsp;praj&ntilde;&#257;</p>";
    const text = stripMdictHtml(html);
    expect(text).toContain("般若");
    expect(text).toContain("praj");
    expect(text).not.toContain("&nbsp;");
  });

  it("rewrites img src to corpus-relative path", () => {
    const html = '<img src="/FGDCDZDB/s2-213.jpg" alt="">';
    const known = new Set(["assets/FGDCDZDB/s2-213.jpg"]);
    const out = rewriteMdictImages(html, { knownAssets: known });
    expect(out).toContain('src="assets/FGDCDZDB/s2-213.jpg"');
  });

  it("removes img when asset missing", () => {
    const html = 'before<img src="/FGDCDZDB/missing.jpg">after';
    const out = rewriteMdictImages(html, { knownAssets: new Set() });
    expect(out).not.toContain("<img");
    expect(out).toBe("beforeafter");
  });

  it("decodeHtmlEntities handles numeric entities", () => {
    expect(decodeHtmlEntities("&#257;")).toBe("ā");
  });

  it("stripMdictBom removes UTF-8 BOM prefix", () => {
    expect(stripMdictHtml("\ufeff般若")).toBe("般若");
  });

  it("prepareFoguangDefinitionHtml rewrites entry links and assets", () => {
    const html =
      '<html><body><span style="color:#000080">䞋</span><hr>' +
      '（參閱「<A HREF="entry://達嚫">達嚫</a>」）' +
      '<img src="assets/FGDCDZDB/w3-944.jpg" /></body></html>';
    const out = prepareFoguangDefinitionHtml(html, "䞋");
    expect(out).not.toContain("entry://");
    expect(out).toContain('href="/dictionary?q=');
    expect(out).toContain("/api/dictionary/assets/foguang/FGDCDZDB/w3-944.jpg");
    expect(out).not.toMatch(/<span[^>]*>[\s\S]*?<\/span>\s*<hr/i);
  });

  it("prepareFoguangDefinitionHtml strips BOM", () => {
    const out = prepareFoguangDefinitionHtml("\ufeff<span>x</span>");
    expect(out.charCodeAt(0)).not.toBe(0xfeff);
  });
});
