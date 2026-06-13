/**
 * 微信登录功能开关（客户端/服务端共用）
 * @author 代长亚
 */

/** 是否开放微信登录入口，默认关闭；配置完成后设 NEXT_PUBLIC_WECHAT_LOGIN_ENABLED=1 */
export function isWechatLoginEnabled(): boolean {
  return process.env.NEXT_PUBLIC_WECHAT_LOGIN_ENABLED === "1";
}
