# jingxin-phase8-full-corpus-md

## Why

用户需要 CBETA 全藏 Markdown 真相源；MVP 11 经不足以覆盖 xml-p5 约 5005 部经文。

## What

- Discover all XML under vendor/xml-p5
- Generate corpus-full/sutras with empty colloquial blocks
- catalog.json + gen-errors.jsonl + corpus:gen:full CLI
- gitignore corpus-full/sutras

## Scope

- MD generation only
- No SQLite import, no git commit of generated files
