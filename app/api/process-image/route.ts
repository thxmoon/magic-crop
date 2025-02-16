import { type NextRequest, NextResponse } from "next/server"
import sharp from "sharp"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    // 使用 sharp 库进行图像处理
    const processedImage = await sharp(buffer)
      .removeBackground() // 假设我们有一个自定义的背景移除函数
      .toBuffer()

    // 返回处理后的图像
    return new NextResponse(processedImage, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="processed-image.png"',
      },
    })
  } catch (error) {
    console.error("Error processing image:", error)
    return NextResponse.json({ error: "Error processing image" }, { status: 500 })
  }
}

