import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
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

    // 使用 Vercel Edge Function 处理图像
    // 注意：这里我们使用一个简化的方法，实际上需要使用第三方服务来处理背景移除
    // 例如 remove.bg API 或其他云服务

    // 生成唯一的文件名
    const fileName = `${uuidv4()}.png`;
    
    // 将文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 上传原始图像到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('images')
      .upload(`processed/${fileName}`, buffer, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading to Supabase:', uploadError);
      return new NextResponse('Error processing image', { status: 500 });
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(`processed/${fileName}`);

    return NextResponse.json({ 
      url: publicUrl,
      message: 'Note: Background removal is simplified in this version. For production, use a dedicated API service.'
    });
    
  } catch (error) {
    console.error('Error in remove-bg API:', error);
    return new NextResponse('Error processing image', { status: 500 });
  }
}
