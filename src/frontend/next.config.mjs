/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  // Proxying the API keeps the browser on one origin, so the httpOnly session
  // cookie works without CORS exceptions and no token is ever exposed to JS.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
