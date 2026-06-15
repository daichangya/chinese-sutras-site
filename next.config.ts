import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "edge-tts-universal", "ws"],
  experimental: {
    optimizePackageImports: ["lucide-react", "d3"],
  },
};

export default nextConfig;
