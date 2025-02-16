import { NextRequest, NextResponse } from 'next/server';
import { removeBackground } from '@/services/backgroundRemoval';
import sharp from 'sharp';

// 配置 Edge Runtime
export const runtime = 'edge';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse('No image uploaded', { status: 400 });
    }

    // 获取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 使用 sharp 将图片转换为 ImageData
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error('Invalid image dimensions');
    }

    // 将图片转换为 RGBA 格式
    const rawData = await image
      .ensureAlpha()
      .raw()
      .toBuffer();

    // 创建 ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(rawData),
      width,
      height
    );

    // 移除背景
    const processedImageData = await removeBackground(imageData);

    // 将处理后的 ImageData 转换回 Buffer
    const processedBuffer = await sharp(processedImageData.data, {
      raw: {
        width: processedImageData.width,
        height: processedImageData.height,
        channels: 4
      }
    })
      .png()
      .toBuffer();

    // 返回处理后的图片
    return new NextResponse(processedBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
