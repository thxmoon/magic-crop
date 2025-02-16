import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse('No image uploaded', { status: 400 });
    }

    // 获取裁剪参数
    const crop_x = formData.get('crop_x') || '0';
    const crop_y = formData.get('crop_y') || '0';
    const crop_width = formData.get('crop_width') || '0';
    const crop_height = formData.get('crop_height') || '0';

    // 获取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 返回原始图片，客户端将使用 Canvas 进行裁剪
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
