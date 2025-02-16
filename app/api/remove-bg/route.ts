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
    
    if (!file) {
      return new NextResponse('No image uploaded', { status: 400 });
    }

    // 获取裁剪参数
    const crop_x = formData.get('crop_x') || '0';
    const crop_y = formData.get('crop_y') || '0';
    const crop_width = formData.get('crop_width') || '0';
    const crop_height = formData.get('crop_height') || '0';
    const auto_crop = formData.get('auto_crop') === 'true';

    // 创建临时文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 使用系统临时目录
    const tmpDir = os.tmpdir();
    const inputPath = path.join(tmpDir, `${uuidv4()}_input${path.extname(file.name) || '.png'}`);
    const outputPath = path.join(tmpDir, `${uuidv4()}_output.png`);

    // 保存输入文件
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
        ...(auto_crop ? ['--auto_crop'] : [])
      ]);

      let errorOutput = '';
      let stdoutOutput = '';

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error('Python error:', data.toString());
      });

      pythonProcess.stdout.on('data', (data) => {
        stdoutOutput += data.toString();
        console.log('Python output:', data.toString());
      });

      pythonProcess.on('close', async (code) => {
        try {
          // 清理输入文件
          await unlink(inputPath).catch(console.error);

          if (code !== 0) {
            console.error('Python process error:', errorOutput);
            resolve(new NextResponse(`Python script error: ${errorOutput}`, { status: 500 }));
            // 尝试清理输出文件
            await unlink(outputPath).catch(() => {});
            return;
          }

          try {
            // 读取输出文件
            const outputBuffer = await require('fs/promises').readFile(outputPath);
            
            // 清理输出文件
            await unlink(outputPath).catch(console.error);

            // 返回处理后的图片
            resolve(new NextResponse(outputBuffer, {
              headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'no-store'
              }
            }));
          } catch (error) {
            console.error('Error reading output file:', error);
            resolve(new NextResponse('Error reading processed image', { status: 500 }));
          }
        } catch (error) {
          console.error('Error in Python process cleanup:', error);
          resolve(new NextResponse('Error processing image', { status: 500 }));
        }
      });
    });
  } catch (error) {
    console.error('API error:', error);
    return new NextResponse('Error processing request', { status: 500 });
  }
}
