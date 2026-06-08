/**
 * 生产路由性能基准（需在 next start 运行后执行）
 * @author 代长亚
 */
const BASE = process.env.BENCH_BASE ?? "http://localhost:3000";
const RUNS = parseInt(process.env.BENCH_RUNS ?? "5", 10);

const ROUTES = [
  "/",
  "/search?q=%E9%87%91%E5%88%9A%E7%BB%8F",
  "/sutra/t08n0235",
  "/api/kg/geo?limit=100",
  "/api/search?q=%E9%87%91%E5%88%9A%E7%BB%8F",
];

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function benchRoute(path: string): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const start = performance.now();
    const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
    await res.arrayBuffer();
    times.push(performance.now() - start);
    if (!res.ok) console.warn(`  WARN ${path} status=${res.status}`);
  }
  return times.sort((a, b) => a - b);
}

async function main() {
  console.log(`Benchmark base=${BASE} runs=${RUNS}\n`);
  for (const route of ROUTES) {
    try {
      const times = await benchRoute(route);
      console.log(
        `${route}\n  p50=${percentile(times, 50).toFixed(0)}ms p95=${percentile(times, 95).toFixed(0)}ms min=${times[0]!.toFixed(0)}ms max=${times[times.length - 1]!.toFixed(0)}ms`,
      );
    } catch (e) {
      console.error(`${route} FAILED:`, e instanceof Error ? e.message : e);
    }
  }
}

main();
