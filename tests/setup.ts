/**
 * Vitest 全局 setup：server-only 在 Node 测试中需 mock
 * @author 代长亚
 */
import { vi } from "vitest";

vi.mock("server-only", () => ({}));
