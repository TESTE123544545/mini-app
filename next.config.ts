import type { NextConfig } from "next";

const backendOrigin = (process.env.BACKEND_ORIGIN ?? "https://veiasdasintonia.com.br").replace(/\/$/, "");
const isVercelBuild = process.env.VERCEL === "1" || process.env.VERCEL_BUILD === "1";

const nextConfig: NextConfig = {
  async rewrites() {
    if (!isVercelBuild) return [];

    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${backendOrigin}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  typescript: {
    // Vinext and Next use different server-runtime types. The Cloudflare API
    // routes are never executed on Vercel because the beforeFiles rewrite above
    // sends every /api request to the isolated Cloudflare backend.
    ignoreBuildErrors: isVercelBuild,
  },
  turbopack: {
    resolveAlias: isVercelBuild
      ? { "cloudflare:workers": "./lib/vercel-cloudflare-stub.ts" }
      : {},
  },
};

export default nextConfig;
