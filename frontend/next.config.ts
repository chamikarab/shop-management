import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add any other custom config options here if needed
};

export default nextConfig;

// ✅ Required for middleware matching
export const config = {
  matcher: ["/admin/:path*"], // Apply middleware to all /admin routes
};