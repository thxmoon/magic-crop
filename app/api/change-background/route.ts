import { NextRequest, NextResponse } from 'next/server';

// 配置 Edge Runtime
export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<NextResponse | void> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const color = formData.get('color') as string;
    const width = formData.get('width');
    const height = formData.get('height');
    const background = formData.get('background') as File;

    if (!file || !color) {
      return NextResponse.json({ error: 'Missing file or background color' }, { status: 400 });
    }

    // 获取文件内容
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);

    // 返回原始图片，客户端将使用 Canvas 进行背景替换
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error changing background:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
