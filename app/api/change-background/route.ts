import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// 配置 Edge Runtime
export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<NextResponse | void> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const color = formData.get('color') as string;
    const width = formData.get('width');
    const height = formData.get('height');
    
    if (!file || !color) {
      return NextResponse.json({ error: 'Missing file or background color' }, { status: 400 });
    }

    // 转换文件为 buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 获取图片尺寸
    let targetWidth: number;
    let targetHeight: number;

    if (width && height) {
      targetWidth = parseInt(width as string);
      targetHeight = parseInt(height as string);
    } else {
      const metadata = await sharp(buffer).metadata();
      targetWidth = metadata.width!;
      targetHeight = metadata.height!;
    }

    // 创建纯色背景
    const background = await sharp({
      create: {
        width: targetWidth,
        height: targetHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([{
      input: {
        create: {
          width: targetWidth,
          height: targetHeight,
          channels: 4,
          background: color
        }
      }
    }])
    .png()
    .toBuffer();

    // 将原图叠加到背景上，保持尺寸和位置
    const processedImage = await sharp(buffer)
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        position: 'center',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer()
      .then(resizedImage => {
        return sharp(background)
          .composite([
            {
              input: resizedImage,
              blend: 'over',
              gravity: 'center'
            }
          ])
          .png()
          .toBuffer();
      });

    return new NextResponse(processedImage, {
      headers: {
        'Content-Type': 'image/png'
      }
    });

  } catch (error) {
    console.error('Error changing background:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
