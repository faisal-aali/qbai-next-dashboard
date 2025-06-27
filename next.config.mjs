/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: 'build', // Change the output directory,
  // webpack: (
  //   config
  // ) => {
  //   config.optimization.minimize = false;
  //   return config
  // },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        destination: '/well-known/apple-app-site-association',
      },
    ];
  },
};

export default nextConfig;
