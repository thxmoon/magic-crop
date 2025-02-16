import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    console.log('Smart crop API called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 转换文件为 buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('Image buffer created');

    // 使用 sharp 进行智能裁剪
    const metadata = await sharp(buffer).metadata();
    console.log('Original image size:', metadata.width, 'x', metadata.height);

    // 获取图片的 alpha 通道数据
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    const channels = info.channels; // 应该是 4 (RGBA)
    const stride = width * channels;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    // 遍历每个像素的 alpha 通道
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pos = (y * stride) + (x * channels);
        const alpha = data[pos + 3]; // alpha 通道
        
        // 检查像素是否不是完全透明（alpha > 0）
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // 添加一些padding
    const padding = 10;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width - 1, maxX + padding);
    maxY = Math.min(height - 1, maxY + padding);

    console.log('Detected content bounds:', { minX, minY, maxX, maxY });

    // 如果找到了有效的裁剪区域
    if (minX < maxX && minY < maxY) {
      const cropWidth = maxX - minX + 1;
      const cropHeight = maxY - minY + 1;

      // 如果裁剪区域足够大且小于原图
      if (cropWidth > 10 && cropHeight > 10 && 
          (cropWidth < width || cropHeight < height)) {
        console.log('Cropping to:', { width: cropWidth, height: cropHeight });
        const croppedImage = await sharp(buffer)
          .extract({
            left: minX,
            top: minY,
            width: cropWidth,
            height: cropHeight
          })
          .toBuffer();

        return new NextResponse(croppedImage, {
          headers: {
            'Content-Type': 'image/png'
          }
        });
      }
    }

    console.log('No significant crop area found, returning original');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png'
      }
    });

  } catch (error) {
    console.error('Error in smart crop:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
