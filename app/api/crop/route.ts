import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import path from 'path';

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

    // 创建临时文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 使用系统临时目录
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${uuidv4()}_input${path.extname(file.name)}`);
    const outputPath = path.join(tmpDir, `${uuidv4()}_output${path.extname(file.name)}`);

    await writeFile(inputPath, buffer);

    // 调用 Python 脚本
    const scriptPath = join(process.cwd(), 'scripts', 'remove_bg.py');
    
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [
        scriptPath,
        '--input', inputPath,
        '--output', outputPath,
        '--crop_x', crop_x.toString(),
        '--crop_y', crop_y.toString(),
        '--crop_width', crop_width.toString(),
        '--crop_height', crop_height.toString(),
        '--crop_only', 'true'
      ]);

      let errorOutput = '';

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', async (code) => {
        try {
          // 清理输入文件
          await unlink(inputPath);

          if (code !== 0) {
            console.error('Python process error:', errorOutput);
            resolve(new NextResponse(`Python script error: ${errorOutput}`, { status: 500 }));
            return;
          }

          // 读取输出文件
          const outputBuffer = await require('fs/promises').readFile(outputPath);
          
          // 清理输出文件
          await unlink(outputPath);

          // 返回处理后的图片
          resolve(new NextResponse(outputBuffer, {
            headers: {
              'Content-Type': file.type,
              'Cache-Control': 'no-store'
            }
          }));
        } catch (error) {
          console.error('Error handling Python script output:', error);
          resolve(new NextResponse('Error processing image', { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
