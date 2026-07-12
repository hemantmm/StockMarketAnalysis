import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/login", destination: "/Login" },
      { source: "/signup", destination: "/SignUp" },
      { source: "/profile", destination: "/Profile" },
      { source: "/portfolio", destination: "/Portfolio" },
      { source: "/trading", destination: "/Trading" },
      { source: "/watchlist", destination: "/Watchlist" },
    ];
  },
};

export default nextConfig;
