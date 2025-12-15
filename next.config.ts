import withBundleAnalyzer from "@next/bundle-analyzer"
import { type NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  rewrites: async () => [
    { source: "/healthz", destination: "/api/health" },
    { source: "/api/healthz", destination: "/api/health" },
    { source: "/health", destination: "/api/health" },
    { source: "/ping", destination: "/api/health" },
  ],
}

export default process.env.ANALYZE === "true"
  ? withBundleAnalyzer({ enabled: true })(config)
  : config
