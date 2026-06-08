#!/usr/bin/env python3
"""
佛光大辭典等 MDict (.mdx + .mdd) → chinese-sutras-md/辞典 JSONL + assets

@author 代长亚
"""
from __future__ import annotations

import argparse
import html
import json
import os
import re
import sys
from pathlib import Path

try:
    from mdict_utils.reader import MDD, MDX
except ImportError:
    print("ERROR: pip install mdict-utils", file=sys.stderr)
    sys.exit(1)

IMG_SRC_RE = re.compile(r'(<img\b[^>]*\ssrc=["\'])([^"\']+)(["\'])', re.IGNORECASE)
DEFAULT_MDX = "佛光大辭典/佛光大辭典增訂版[阿彌陀佛]20230501.mdx"
SOURCE_CODE = "foguang"
LICENSE = "佛光山版权（增订版 2023.5.1，部署者自用）"
PROVENANCE = "佛光大辭典增訂版[阿彌陀佛]20230501"
# MDX HTML 常在 <body> 后带 UTF-8 BOM（U+FEFF），编辑器可能显示为 � 或 ?
_BOM_AND_ZWSP = "\ufeff\ufffe\u200b"


def strip_bom(text: str) -> str:
    return text.lstrip(_BOM_AND_ZWSP)


def normalize_mdx_src(src: str) -> str:
    s = src.strip().replace("\\", "/")
    m = re.match(r"^/?FGDCDZDB/(.+)$", s, re.IGNORECASE)
    if m:
        return f"assets/FGDCDZDB/{m.group(1)}"
    base = s.split("/")[-1]
    return f"assets/FGDCDZDB/{base}"


def mdd_key_to_asset_path(key: str) -> str:
    s = key.strip().replace("\\", "/").lstrip("/")
    if re.match(r"^FGDCDZDB/", s, re.IGNORECASE):
        return f"assets/{s}"
    base = s.split("/")[-1]
    return f"assets/FGDCDZDB/{base}"


def strip_html(html_str: str) -> str:
    if not html_str:
        return ""
    s = re.sub(r"<(style|script)[^>]*>.*?</\1>", "", html_str, flags=re.DOTALL | re.IGNORECASE)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"</(p|div|li|tr|h[1-6])>", "\n", s, flags=re.IGNORECASE)
    s = re.sub(r"<[^>]+>", "", s)
    s = html.unescape(s)
    lines = [line.strip() for line in s.split("\n")]
    return strip_bom("\n".join(line for line in lines if line).strip())


def rewrite_images(html_str: str, known: set[str], warnings: list[dict]) -> str:
    def repl(m: re.Match[str]) -> str:
        src = m.group(2)
        resolved = normalize_mdx_src(src)
        if resolved not in known:
            warnings.append({"type": "missing_image", "src": src, "resolved": resolved})
            return ""
        return m.group(1) + resolved + m.group(3)

    return IMG_SRC_RE.sub(repl, html_str)


def extract_mdd(mdd_path: str, out_dir: Path) -> set[str]:
    known: set[str] = set()
    mdd = MDD(mdd_path)
    print(f"  MDD entries: {len(mdd)}")
    for key_bytes, val_bytes in mdd.items():
        key = key_bytes.decode("utf-8", errors="replace") if isinstance(key_bytes, bytes) else str(key_bytes)
        data = val_bytes if isinstance(val_bytes, bytes) else bytes(val_bytes)
        rel = mdd_key_to_asset_path(key)
        out = out_dir / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(data)
        known.add(rel.replace("\\", "/"))
    return known


def slug_id(index: int) -> str:
    return f"{SOURCE_CODE}:{index}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Import MDict MDX/MDD to 辞典 JSONL")
    parser.add_argument("--mdx", default=os.environ.get("FOGUANG_MDX_PATH", DEFAULT_MDX))
    parser.add_argument("--mdd", default="", help="Default: same dir/name as MDX with .mdd")
    parser.add_argument("--out-dir", default="", help="Default: chinese-sutras-md/辞典/sources/佛光大辞典")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    mdx_path = Path(args.mdx)
    if not mdx_path.is_file():
        print(f"ERROR: MDX not found: {mdx_path}", file=sys.stderr)
        sys.exit(1)

    mdd_path = Path(args.mdd) if args.mdd else mdx_path.with_suffix(".mdd")
    if not mdd_path.is_file():
        print(f"ERROR: MDD not found: {mdd_path}", file=sys.stderr)
        sys.exit(1)

    repo_root = Path(__file__).resolve().parents[1]
    out_dir = Path(args.out_dir) if args.out_dir else repo_root / "chinese-sutras-md" / "辞典" / "sources" / "佛光大辞典"
    entries_path = out_dir / "entries.jsonl"
    warnings_path = out_dir / "import-warnings.jsonl"

    print(f"MDX: {mdx_path}")
    print(f"MDD: {mdd_path}")
    print(f"Out: {out_dir}")

    if args.dry_run:
        mdx = MDX(str(mdx_path))
        print(f"  Would import ~{len(mdx)} entries, MDD at {mdd_path}")
        return

    out_dir.mkdir(parents=True, exist_ok=True)
    known_assets = extract_mdd(str(mdd_path), out_dir)
    print(f"  Extracted {len(known_assets)} assets")

    mdx = MDX(str(mdx_path))
    items = list(mdx.items())
    if args.limit > 0:
        items = items[: args.limit]

    warnings: list[dict] = []
    records: list[dict] = []
    skipped = 0

    for i, (key_bytes, val_bytes) in enumerate(items):
        key = key_bytes.decode("utf-8", errors="replace") if isinstance(key_bytes, bytes) else str(key_bytes)
        val = val_bytes.decode("utf-8", errors="replace") if isinstance(val_bytes, bytes) else str(val_bytes)
        headword = strip_bom(key.strip())
        if not headword or val.strip().startswith("@@@LINK="):
            skipped += 1
            continue
        definition_html = strip_bom(rewrite_images(val, known_assets, warnings))
        definition = strip_html(definition_html)
        if not definition:
            skipped += 1
            warnings.append({"type": "empty_definition", "headword": headword, "index": i})
            continue
        records.append(
            {
                "id": slug_id(i),
                "source": SOURCE_CODE,
                "headword": headword,
                "definition": definition,
                "lang": "zh",
                "license": LICENSE,
                "entry_data": {
                    "definition_html": definition_html,
                    "provenance": PROVENANCE,
                },
            }
        )
        if len(records) % 5000 == 0:
            print(f"  ... {len(records)} entries parsed")

    with entries_path.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    with warnings_path.open("w", encoding="utf-8") as f:
        for w in warnings:
            f.write(json.dumps(w, ensure_ascii=False) + "\n")

    print(f"  Wrote {len(records)} entries → {entries_path}")
    print(f"  Skipped {skipped}; warnings {len(warnings)} → {warnings_path}")


if __name__ == "__main__":
    main()
