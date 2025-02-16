import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import path from 'path';

// 配置 Edge Runtime
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
    const auto_crop = formData.get('auto_crop') === 'true';

    // 获取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 由于 Edge Runtime 不支持文件系统操作，我们需要修改处理方式
    // 这里我们可以直接在内存中处理图片，或者使用其他服务

    // 临时返回一个示例响应
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
