/**
 * Edge TTS 提供商（零 Key，Microsoft Edge Read Aloud 协议）
 * @author 代长亚
 */
import { EdgeTTS } from "edge-tts-universal";

export async function synthesizeEdgeSpeech(
  text: string,
  voice: string,
  rateProsody: string,
): Promise<Buffer> {
  const tts = new EdgeTTS(text, voice, { rate: rateProsody });
  const result = await tts.synthesize();
  return Buffer.from(await result.audio.arrayBuffer());
}
