import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
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

    // 生成唯一的文件名
    const fileName = `${uuidv4()}.png`;
    
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
      return NextResponse.json({ error: 'Error processing image' }, { status: 500 });
    }

    // 获取公共 URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(`processed/${fileName}`);

    return NextResponse.json({ 
      url: publicUrl,
      message: 'Note: Background changing is simplified in this version. For production, use a dedicated image processing service.'
    });
  } catch (error) {
    console.error('Error in change-background API:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
