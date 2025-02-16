import { NextRequest, NextResponse } from 'next/server';

// 配置 Edge Runtime
export const runtime = 'edge';

export async function POST(request: NextRequest): Promise<void | NextResponse> {
  try {
    console.log('Smart crop API called');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'No file uploaded' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 获取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 返回原始图片，客户端将使用 Canvas 进行智能裁剪
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error in smart crop:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to process image' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
