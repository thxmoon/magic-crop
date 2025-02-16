import { pipeline } from '@xenova/transformers';

let removeBackgroundPipeline: any = null;

export async function initializeBackgroundRemoval() {
  if (!removeBackgroundPipeline) {
    removeBackgroundPipeline = await pipeline('image-segmentation', 'Xenova/modnet-webcam');
  }
  return removeBackgroundPipeline;
}

export async function removeBackground(imageData: ImageData): Promise<ImageData> {
  try {
    const segmenter = await initializeBackgroundRemoval();
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
}
