/**
 * TTS 服务（Edge 默认 / Azure 可选）
 * @author 代长亚
 */
import { createHash } from "crypto";
import { synthesizeEdgeSpeech } from "@/lib/reader/speech/edge-tts-provider";
import {
  getCachedAudio,
  putCachedAudio,
} from "@/lib/reader/speech/tts-disk-cache";

export type TtsProvider = "edge" | "azure";

export type TtsConfig = {
  provider: TtsProvider;
  voice: string;
  apiKey?: string;
  region?: string;
};

const memCache = new Map<string, Buffer>();
const MAX_MEM_CACHE = 100;

const DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural";

export function getActiveProvider(): TtsProvider {
  const raw = process.env.TTS_PROVIDER?.trim() || "edge";
  return raw === "azure" ? "azure" : "edge";
}

export function getTtsVoice(): string {
  return process.env.TTS_VOICE?.trim() || DEFAULT_VOICE;
}

export function getTtsConfig(): TtsConfig | null {
  const provider = getActiveProvider();
  const voice = getTtsVoice();

  if (provider === "edge") {
    return { provider: "edge", voice };
  }

  const apiKey = process.env.TTS_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    provider: "azure",
    voice,
    apiKey,
    region: process.env.TTS_REGION?.trim() || "eastasia",
  };
}

export function isCloudTtsAvailable(): boolean {
  return getTtsConfig() !== null;
}

export function buildCacheKey(
  provider: string,
  voice: string,
  rate: number,
  text: string,
): string {
  return createHash("sha256")
    .update(`${provider}:${voice}:${rate}:${text}`)
    .digest("hex");
}

export function rateToProsody(rate: number): string {
  if (rate <= 0.75) return "-25%";
  if (rate >= 1.25) return "+25%";
  return "+0%";
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function putMemCache(key: string, buf: Buffer) {
  if (memCache.size >= MAX_MEM_CACHE) {
    const first = memCache.keys().next().value;
    if (first) memCache.delete(first);
  }
  memCache.set(key, buf);
}

async function synthesizeAzure(
  text: string,
  config: TtsConfig,
  rate: number,
): Promise<Buffer> {
  const ssml = `<speak version="1.0" xml:lang="zh-CN"><voice name="${config.voice}"><prosody rate="${rateToProsody(rate)}">${escapeXml(text)}</prosody></voice></speak>`;

  const res = await fetch(
    `https://${config.region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": config.apiKey!,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      },
      body: ssml,
    },
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `TTS 请求失败 (${res.status})`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function synthesizeFromProvider(
  text: string,
  config: TtsConfig,
  rate: number,
): Promise<Buffer> {
  if (config.provider === "edge") {
    return synthesizeEdgeSpeech(text, config.voice, rateToProsody(rate));
  }
  return synthesizeAzure(text, config, rate);
}

export async function synthesizeSpeech(
  text: string,
  rate = 1,
): Promise<Buffer> {
  const config = getTtsConfig();
  if (!config) {
    throw new Error("高品质朗读未配置");
  }

  const trimmed = text.slice(0, 2000);
  const key = buildCacheKey(config.provider, config.voice, rate, trimmed);

  const diskHit = getCachedAudio(key);
  if (diskHit) {
    putMemCache(key, diskHit);
    return diskHit;
  }

  const memHit = memCache.get(key);
  if (memHit) return memHit;

  const buf = await synthesizeFromProvider(trimmed, config, rate);

  putCachedAudio(key, buf);
  putMemCache(key, buf);
  return buf;
}
