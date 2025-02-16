import torch
import torch.nn.functional as F
from torchvision.transforms.functional import normalize
import numpy as np
from PIL import Image
import io
import os
import traceback
import argparse
from transformers import AutoModelForImageSegmentation

# 全局变量
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = None

def init_models():
    """初始化模型"""
    global model
    try:
        print("Initializing RMBG model...")
        model = AutoModelForImageSegmentation.from_pretrained("briaai/RMBG-1.4", trust_remote_code=True)
        model.to(device)
        model.eval()  # 设置为评估模式
        print("Model initialized successfully")
    except Exception as e:
        print(f"Error initializing models: {str(e)}")
        traceback.print_exc()
        raise e

def preprocess_image(im: np.ndarray, model_input_size=[1024, 1024]) -> torch.Tensor:
    """预处理图片"""
    # 确保图片是3通道的
    if len(im.shape) < 3:
        # 如果是灰度图，转换为3通道
        im = np.stack([im] * 3, axis=-1)
    elif im.shape[2] == 1:
        # 如果是单通道图，转换为3通道
        im = np.concatenate([im] * 3, axis=2)
    elif im.shape[2] == 4:
        # 如果是RGBA图，只取RGB通道
        im = im[:, :, :3]
    
    # 转换为tensor
    im_tensor = torch.tensor(im, dtype=torch.float32).permute(2, 0, 1)
    im_tensor = F.interpolate(torch.unsqueeze(im_tensor, 0), size=model_input_size, mode='bilinear')
    image = torch.divide(im_tensor, 255.0)
    image = normalize(image, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])
    return image

def postprocess_image(result: torch.Tensor, im_size: list) -> np.ndarray:
    """后处理模型输出"""
    result = torch.squeeze(F.interpolate(result, size=im_size, mode='bilinear'), 0)
    ma = torch.max(result)
    mi = torch.min(result)
    result = (result-mi)/(ma-mi)
    im_array = (result*255).permute(1, 2, 0).cpu().data.numpy().astype(np.uint8)
    im_array = np.squeeze(im_array)
    return im_array

def remove_background_rmbg(image):
    """使用RMBG模型移除背景"""
    if model is None:
        init_models()
    
    try:
        # 转换为numpy数组
        img_array = np.array(image)
        orig_im_size = img_array.shape[0:2]
        
        # 预处理
        img_tensor = preprocess_image(img_array).to(device)
        
        # 运行推理
        with torch.no_grad():
            result = model(img_tensor)
        
        # 后处理
        mask = postprocess_image(result[0][0], orig_im_size)
        return mask
        
    except Exception as e:
        print(f"Error in remove_background_rmbg: {str(e)}")
        traceback.print_exc()
        raise e

def auto_crop_transparent(img):
    """自动裁剪透明区域"""
    # 转换为numpy数组
    img_array = np.array(img)
    
    # 获取alpha通道
    alpha = img_array[:, :, 3]
    
    # 找到非透明区域的边界
    rows = np.any(alpha > 0, axis=1)
    cols = np.any(alpha > 0, axis=0)
    if not np.any(rows) or not np.any(cols):
        return img  # 如果图片完全透明，返回原图
        
    # 获取非透明区域的边界
    ymin, ymax = np.where(rows)[0][[0, -1]]
    xmin, xmax = np.where(cols)[0][[0, -1]]
    
    # 裁剪图片
    return img.crop((xmin, ymin, xmax + 1, ymax + 1))

def main():
    parser = argparse.ArgumentParser(description='Remove background from image')
    parser.add_argument('--input', type=str, required=True, help='Input image path')
    parser.add_argument('--output', type=str, required=True, help='Output image path')
    parser.add_argument('--crop_x', type=int, default=0, help='Crop X coordinate')
    parser.add_argument('--crop_y', type=int, default=0, help='Crop Y coordinate')
    parser.add_argument('--crop_width', type=int, default=0, help='Crop width')
    parser.add_argument('--crop_height', type=int, default=0, help='Crop height')
    parser.add_argument('--auto_crop', action='store_true', help='Auto crop transparent areas')
    
    args = parser.parse_args()
    
    try:
        # 读取图片
        img = Image.open(args.input)
        
        # 如果有裁剪参数，进行裁剪
        if args.crop_width > 0 and args.crop_height > 0:
            print(f"Cropping image: x={args.crop_x}, y={args.crop_y}, width={args.crop_width}, height={args.crop_height}")
            img = img.crop((args.crop_x, args.crop_y, 
                          args.crop_x + args.crop_width, 
                          args.crop_y + args.crop_height))
        
        # 移除背景
        mask = remove_background_rmbg(img)
        
        # 转换为二值掩码
        mask = (mask > 128).astype(np.uint8) * 255
        
        # 转换为RGBA
        output_img = img.convert('RGBA')
        output_array = np.array(output_img)
        
        # 应用掩码到alpha通道
        output_array[:, :, 3] = mask
        
        # 创建输出图片
        output_img = Image.fromarray(output_array)
        
        # 如果需要自动裁剪，裁剪透明区域
        if args.auto_crop:
            output_img = auto_crop_transparent(output_img)
        
        # 保存图片
        output_img.save(args.output, format='PNG', optimize=True)
        print(f"Successfully processed image and saved to {args.output}")
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        traceback.print_exc()
        raise e

if __name__ == "__main__":
    main()
