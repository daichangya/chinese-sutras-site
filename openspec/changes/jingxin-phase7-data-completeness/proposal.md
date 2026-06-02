# jingxin-phase7-data-completeness

## Why

五/六期后语料分片不全、白话 tier 未批量达标、seed 需手工执行。

## What

- `corpus:gen --clean-stale` + `corpus:refresh` + `corpus:audit`
- Full MVP regen from xml-p5, AI_MOCK colloquial batch, import, seed
- `mvp-corpus-completeness` Vitest

## Scope

- MVP 11 sutras only
- No full-canon import
