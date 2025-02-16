/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! 警告: 这会禁用生产环境的类型检查
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! 警告: 这会禁用生产环境的 ESLint 检查
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gwocgomtdgfqtrbuomyt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
