/**
 * Apple Touch Icon（180×180）
 * @author jingxin
 */
import { ImageResponse } from "next/og";
import { BrandIconImage, brandIconImageOptions } from "@/lib/brand/brand-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(<BrandIconImage size={180} />, await brandIconImageOptions(180));
}
