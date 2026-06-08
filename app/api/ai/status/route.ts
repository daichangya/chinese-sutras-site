/**
 * AI Gateway 配置状态（供 Chat 页判断是否为历史缓存错误）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { isAiGatewayConfigured, isAiMockMode } from "@/lib/ai/gateway";

export async function GET() {
  return NextResponse.json({
    configured: isAiGatewayConfigured(),
    mock: isAiMockMode(),
  });
}
