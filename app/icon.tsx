/**
 * 站点 favicon（32×32）
 * @author jingxin
 */
import { ImageResponse } from "next/og";
import { BrandIconImage, brandIconImageOptions } from "@/lib/brand/brand-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(<BrandIconImage size={32} />, await brandIconImageOptions(32));
}
