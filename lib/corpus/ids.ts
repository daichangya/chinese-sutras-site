/**
 * 语料层稳定 ID 与 pid 校验
 * @author 代长亚
 */
import { v5 as uuidv5 } from "uuid";

/** jingxin 固定命名空间（勿改，否则 sutra.id 会变） */
export const JINGXIN_NAMESPACE = "a3f2c8e1-4b5d-6e7f-8a9b-0c1d2e3f4a5b";

const PID_PATTERN = /^([A-Z]+\d+n\d+[A-Za-z]?)-c(\d+)-p(\d+)$/;

export function sutraIdFromCbetaId(cbetaId: string): string {
  return uuidv5(cbetaId, JINGXIN_NAMESPACE);
}

export function buildParagraphPid(cbetaId: string, chapterSeq: number, seq: number): string {
  return `${cbetaId}-c${chapterSeq}-p${String(seq).padStart(3, "0")}`;
}

export function parseParagraphPid(pid: string): { cbetaId: string; chapterSeq: number; seq: number } | null {
  const m = pid.match(PID_PATTERN);
  if (!m) return null;
  return {
    cbetaId: m[1],
    chapterSeq: Number.parseInt(m[2], 10),
    seq: Number.parseInt(m[3], 10),
  };
}

export function assertPidMatchesCbeta(pid: string, cbetaId: string): void {
  const parsed = parseParagraphPid(pid);
  if (!parsed) {
    throw new Error(`Invalid paragraph pid: ${pid}`);
  }
  if (parsed.cbetaId !== cbetaId) {
    throw new Error(`pid ${pid} does not match cbeta_id ${cbetaId}`);
  }
}
