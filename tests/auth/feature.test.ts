/**
 * 微信登录功能开关
 * @author 代长亚
 */
import { afterEach, describe, expect, it } from "vitest";
import { isWechatLoginEnabled } from "@/lib/auth/feature";

describe("isWechatLoginEnabled", () => {
  const prev = process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED = prev;
    }
  });

  it("is disabled by default", () => {
    delete process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED;
    expect(isWechatLoginEnabled()).toBe(false);
  });

  it("is enabled when env is 1", () => {
    process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED = "1";
    expect(isWechatLoginEnabled()).toBe(true);
  });
});
