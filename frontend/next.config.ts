import type { NextConfig } from "next";

// Security headers applied to every route. No strict script-src CSP: the page
// ships inline JSON-LD and Next's hydration bootstrap, which a nonce-less static
// build cannot allowlist. We still lock down framing, base-uri, object-src,
// referrer, sniffing, and powerful features.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Tree-shake per-icon imports so the whole Phosphor set never ships.
  experimental: { optimizePackageImports: ["@phosphor-icons/react"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
