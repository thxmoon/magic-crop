/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['gwocgomtdgfqtrbuomyt.supabase.co'],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // 排除原生模块
    if (isServer) {
      config.externals.push({
        'onnxruntime-node': 'commonjs onnxruntime-node',
        'sharp': 'commonjs sharp',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
