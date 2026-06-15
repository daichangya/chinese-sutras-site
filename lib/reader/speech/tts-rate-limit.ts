/**
 * TTS API 简易 IP 限流
 * @author 代长亚
 */
const hits = new Map<string, number[]>();

export function checkTtsRateLimit(
  ip: string,
  max = 60,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

/** 测试用：清空限流状态 */
export function resetTtsRateLimitForTests() {
  hits.clear();
}
