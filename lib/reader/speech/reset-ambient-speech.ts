/**
 * 清理页面级残留朗读（浏览器合成 / Media Session）
 * @author 代长亚
 */
import { clearMediaSession } from "@/lib/reader/speech/media-session";

/** 进入阅读页或从 bfcache 恢复时调用，避免自动续播 */
export function resetAmbientSpeech(): void {
  if (typeof window === "undefined") return;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  clearMediaSession();
}
