import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // resvg-js adalah native binding — jangan di-bundle oleh serverless build
  serverExternalPackages: ["@resvg/resvg-js"],
};

export default nextConfig;
