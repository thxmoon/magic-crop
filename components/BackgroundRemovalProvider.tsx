import { createContext, useContext, useEffect, useState } from 'react';
import { pipeline } from '@xenova/transformers';

interface BackgroundRemovalContextType {
  isSupported: boolean;
  isInitialized: boolean;
  error: string | null;
  removeBackground: (imageData: ImageData) => Promise<ImageData>;
}

const BackgroundRemovalContext = createContext<BackgroundRemovalContextType>({
  isSupported: false,
  isInitialized: false,
  error: null,
  removeBackground: async () => new ImageData(1, 1),
});

export function useBackgroundRemoval() {
  return useContext(BackgroundRemovalContext);
}

export function BackgroundRemovalProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segmenter, setSegmenter] = useState<any>(null);

  useEffect(() => {
    async function checkSupport() {
      try {
        // 检查 WebGPU 支持
        if (!('gpu' in navigator)) {
          setError('WebGPU is not supported in your browser');
          return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setError('No appropriate WebGPU adapter found');
          return;
        }

        setIsSupported(true);

        // 初始化模型
        try {
          const segmenter = await pipeline('image-segmentation', 'Xenova/modnet-webcam');
          setSegmenter(segmenter);
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing model:', error);
          setError('Failed to initialize background removal model');
        }
      } catch (error) {
        console.error('Error checking WebGPU support:', error);
        setError('Error checking WebGPU support');
      }
    }

    checkSupport();
  }, []);

  const removeBackground = async (imageData: ImageData): Promise<ImageData> => {
    if (!isSupported || !isInitialized || !segmenter) {
      throw new Error('Background removal is not available');
    }

    try {
      const output = await segmenter(imageData);
      
      // 从分割结果中提取 alpha 通道
      const { width, height } = imageData;
      const newImageData = new ImageData(width, height);
      
      for (let i = 0; i < width * height; i++) {
        const sourceIndex = i * 4;
        newImageData.data[sourceIndex] = imageData.data[sourceIndex];
        newImageData.data[sourceIndex + 1] = imageData.data[sourceIndex + 1];
        newImageData.data[sourceIndex + 2] = imageData.data[sourceIndex + 2];
        newImageData.data[sourceIndex + 3] = output.masks[0].data[i] * 255; // 将 0-1 的值转换为 0-255
      }
      
      return newImageData;
    } catch (error) {
      console.error('Error removing background:', error);
      throw error;
    }
  };

  return (
    <BackgroundRemovalContext.Provider
      value={{
        isSupported,
        isInitialized,
        error,
        removeBackground,
      }}
    >
      {children}
    </BackgroundRemovalContext.Provider>
  );
}
