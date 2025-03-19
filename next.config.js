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
    
    // 添加环境变量以禁用 WebGPU
    config.plugins.push(
      new config.webpack.DefinePlugin({
        'globalThis.navigator.gpu': 'undefined',
        'navigator.gpu': 'undefined',
      })
    );
    
    return config;
  },
}

module.exports = nextConfig
