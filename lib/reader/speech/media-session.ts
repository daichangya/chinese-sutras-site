/**
 * 锁屏 Media Session（云端朗读）
 * @author 代长亚
 */

export function setupMediaSession(opts: {
  title: string;
  artist: string;
  onPlay: () => void;
  onPause: () => void;
}) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: opts.title,
    artist: opts.artist,
    album: "正信•经藏",
  });

  navigator.mediaSession.setActionHandler("play", () => opts.onPlay());
  navigator.mediaSession.setActionHandler("pause", () => opts.onPause());
}

export function clearMediaSession() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler("play", null);
  navigator.mediaSession.setActionHandler("pause", null);
}

export function setMediaSessionPlaybackState(state: "playing" | "paused" | "none") {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = state;
}
