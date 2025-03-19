// WebGPU polyfill
if (typeof window !== 'undefined') {
  // 检查 navigator.gpu 是否存在
  if (!window.navigator.gpu) {
    // 创建一个模拟的 GPU 对象
    window.navigator.gpu = {
      requestAdapter: async () => {
        console.warn('WebGPU is not supported in this environment. Using fallback.');
        return null;
      }
    };
  }
}

export {};
