/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APEX_API: process.env.NEXT_PUBLIC_APEX_API ?? 'http://localhost:3001/api',
  },
};

export default nextConfig;
