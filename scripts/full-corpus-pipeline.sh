#!/usr/bin/env bash
# 全量语料生成 + 入库（可断点续跑）
# @author 代长亚
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p logs

echo "[$(date -Iseconds)] corpus:gen --resume"
npm run corpus:gen -- --resume 2>&1 | tee -a logs/corpus-gen-full.log

echo "[$(date -Iseconds)] corpus:import --md-only"
npm run corpus:import -- --md-only 2>&1 | tee -a logs/corpus-import-full.log

echo "[$(date -Iseconds)] pipeline done"
