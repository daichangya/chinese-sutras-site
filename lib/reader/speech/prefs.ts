/**
 * 朗读偏好（localStorage）
 * @author 代长亚
 */
import type { SpeechEngine, SpeechRate } from "@/lib/reader/speech/types";

const ENGINE_KEY = "jx-tts-engine";
const RATE_KEY = "jx-tts-rate";

const RATES: SpeechRate[] = [0.75, 1, 1.25];

export function loadSpeechEngine(): SpeechEngine {
  if (typeof window === "undefined") return "cloud";
  const v = localStorage.getItem(ENGINE_KEY);
  if (v === "browser") return "browser";
  return "cloud";
}

export function saveSpeechEngine(engine: SpeechEngine) {
  localStorage.setItem(ENGINE_KEY, engine);
}

export function loadSpeechRate(): SpeechRate {
  if (typeof window === "undefined") return 1;
  const raw = Number(localStorage.getItem(RATE_KEY));
  return RATES.includes(raw as SpeechRate) ? (raw as SpeechRate) : 1;
}

export function saveSpeechRate(rate: SpeechRate) {
  localStorage.setItem(RATE_KEY, String(rate));
}

export function cycleSpeechRate(current: SpeechRate): SpeechRate {
  const idx = RATES.indexOf(current);
  const next = RATES[(idx + 1) % RATES.length];
  saveSpeechRate(next);
  return next;
}

export const SPEECH_RATES = RATES;
