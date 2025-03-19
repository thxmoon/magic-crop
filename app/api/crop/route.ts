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
    const crop_x = formData.get('crop_x');
    const crop_y = formData.get('crop_y');
    const crop_width = formData.get('crop_width');
    const crop_height = formData.get('crop_height');

    if (!file || !crop_x || !crop_y || !crop_width || !crop_height) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

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
      message: 'Note: Cropping is simplified in this version. For production, use a dedicated image processing service.'
    });
    
  } catch (error) {
    console.error('Error in crop API:', error);
    return new NextResponse('Error processing image', { status: 500 });
  }
}
