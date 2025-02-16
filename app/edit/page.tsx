"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Scan,
  Crop,
  Wand2,
  Download,
  Undo2,
  Redo2,
  Plus,
  Palette,
  ThumbsUp,
  ThumbsDown,
  Trash,
  SplitSquareVertical,
  ImageIcon,
  Check,
  X,
  History,
  Upload
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { StorageService } from '@/services/storage'

// 添加全局样式
const globalStyles = `
  .rotate-270 {
    transform: rotate(270deg);
  }
  
  .transparent-grid {
    background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    background-color: #ffffff;
  }

  .crop-handle {
    width: 20px;
    height: 20px;
    background: #fff;
    border: 2px solid #1a73e8;
    border-radius: 50%;
    position: absolute;
    transform: translate(-50%, -50%);
    cursor: move;
  }

  .crop-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  
  .crop-area {
    position: absolute;
    border: 2px solid white;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  }

  .control-point {
    position: absolute;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: transform 0.1s;
  }

  .control-point:hover {
    transform: translate(-50%, -50%) scale(1.2);
  }

  .crop-buttons {
    position: absolute;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    display: flex;
    gap: 12px;
    z-index: 50;
  }

  .crop-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .crop-button:hover {
    transform: scale(1.1);
  }

  .crop-button-confirm {
    background: #10B981;
    color: white;
    border-color: #059669;
  }

  .crop-button-confirm:hover {
    background: #059669;
  }

  .crop-button-cancel {
    background: #EF4444;
    color: white;
    border-color: #DC2626;
  }

  .crop-button-cancel:hover {
    background: #DC2626;
  }
`;

interface HistoryItem {
  id: string;
  image: string;
  thumbnail: string;
  timestamp: number;
  editState?: {
    processedImage: string | null;
    removedBgImage: string | null;
    hasRemovedBackground: boolean;
    backgroundColor: string | null;
    history: string[];
    currentIndex: number;
  };
}

export default function EditPage() {
  const [activeTab, setActiveTab] = useState<"original" | "result">("result")
  const [showOriginal, setShowOriginal] = useState(false)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [removedBgImage, setRemovedBgImage] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragType, setDragType] = useState<"move" | "nw" | "ne" | "sw" | "se" | null>(null)
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null);
  const [foregroundLayer, setForegroundLayer] = useState<string | null>(null);  // 前景层（移除背景后的图片）
  const [backgroundColor, setBackgroundColor] = useState<string | null>(null);  // 背景色
  const [isLoading, setIsLoading] = useState(false);  // 添加 loading 状态
  const imageRef = useRef<HTMLImageElement>(null)
  const cropRef = useRef<HTMLDivElement>(null)

  // 裁剪框控制点类型
  type ControlPoint = 'top-left' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';

  const handleManualCrop = () => {
    if (!imageRef.current) {
      console.log('No image reference available');
      return;
    }
    
    // 获取图片的实际显示尺寸和位置
    const rect = imageRef.current.getBoundingClientRect();
    const containerRect = imageRef.current.parentElement?.getBoundingClientRect();
    
    if (!containerRect) {
      console.log('No container reference available');
      return;
    }

    console.log('Image rect:', {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    });
    
    console.log('Container rect:', {
      left: containerRect.left,
      top: containerRect.top,
      width: containerRect.width,
      height: containerRect.height
    });

    // 计算相对于容器的位置
    const x = rect.left - containerRect.left;
    const y = rect.top - containerRect.top;
    
    // 设置初始裁剪框为图片的实际显示大小和位置
    const initialCropBox = {
      x,
      y,
      width: rect.width,
      height: rect.height
    };

    console.log('Initial crop box:', initialCropBox);
    
    setCropBox(initialCropBox);
    setIsCropping(true);
    setActiveTab("result");
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isCropping || !imageRef.current) return;
    
    e.preventDefault(); // 防止图片拖拽
    
    const containerRect = imageRef.current.parentElement?.getBoundingClientRect();
    
    if (!containerRect) return;

    // 计算相对于容器的鼠标位置
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    console.log('Mouse down:', { mouseX, mouseY });

    if (cropBox) {
      // 检查是否点击了调整大小的手柄
      const handleSize = 10; // 手柄的点击区域大小
      const { x, y, width, height } = cropBox;
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      console.log('Crop box state:', { x, y, width, height, centerX, centerY });

      // 检查各个角落和边的中点
      if (Math.abs(mouseX - (x + width)) <= handleSize && Math.abs(mouseY - (y + height)) <= handleSize) {
        setDragType("se");
      } else if (Math.abs(mouseX - x) <= handleSize && Math.abs(mouseY - y) <= handleSize) {
        setDragType("nw");
      } else if (Math.abs(mouseX - (x + width)) <= handleSize && Math.abs(mouseY - y) <= handleSize) {
        setDragType("ne");
      } else if (Math.abs(mouseX - x) <= handleSize && Math.abs(mouseY - (y + height)) <= handleSize) {
        setDragType("sw");
      } else if (Math.abs(mouseX - centerX) <= handleSize && Math.abs(mouseY - y) <= handleSize) {
        setDragType("n");
      } else if (Math.abs(mouseX - centerX) <= handleSize && Math.abs(mouseY - (y + height)) <= handleSize) {
        setDragType("s");
      } else if (Math.abs(mouseX - x) <= handleSize && Math.abs(mouseY - centerY) <= handleSize) {
        setDragType("w");
      } else if (Math.abs(mouseX - (x + width)) <= handleSize && Math.abs(mouseY - centerY) <= handleSize) {
        setDragType("e");
      } else if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
        setDragType("move");
      }

      console.log('Drag type set to:', dragType);
    }

    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isCropping || !dragStart || !dragType || !cropBox || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const containerRect = imageRef.current.parentElement?.getBoundingClientRect();
    
    if (!containerRect) return;

    // 计算相对于容器的鼠标位置
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // 计算移动距离
    const deltaX = mouseX - dragStart.x;
    const deltaY = mouseY - dragStart.y;

    console.log('Mouse move:', { mouseX, mouseY, deltaX, deltaY });

    // 根据拖动类型更新裁剪框
    let newBox = { ...cropBox };

    if (dragType === "move") {
      // 移动整个裁剪框
      newBox.x = Math.max(0, Math.min(rect.width - cropBox.width, cropBox.x + deltaX));
      newBox.y = Math.max(0, Math.min(rect.height - cropBox.height, cropBox.y + deltaY));
    } else {
      // 调整裁剪框大小
      if (dragType.includes("n")) {
        const maxY = cropBox.y + cropBox.height - 10;
        const newY = Math.max(0, Math.min(maxY, cropBox.y + deltaY));
        newBox.height = cropBox.height - (newY - cropBox.y);
        newBox.y = newY;
      }
      if (dragType.includes("s")) {
        const newHeight = Math.max(10, Math.min(rect.height - cropBox.y, cropBox.height + deltaY));
        newBox.height = newHeight;
      }
      if (dragType.includes("w")) {
        const maxX = cropBox.x + cropBox.width - 10;
        const newX = Math.max(0, Math.min(maxX, cropBox.x + deltaX));
        newBox.width = cropBox.width - (newX - cropBox.x);
        newBox.x = newX;
      }
      if (dragType.includes("e")) {
        const newWidth = Math.max(10, Math.min(rect.width - cropBox.x, cropBox.width + deltaX));
        newBox.width = newWidth;
      }
    }

    console.log('New crop box:', newBox);

    // 更新裁剪框和拖动起点
    setCropBox(newBox);
    setDragStart({ x: mouseX, y: mouseY });
  };

  const handleMouseUp = () => {
    console.log('Mouse up - resetting drag state');
    setDragStart(null);
    setDragType(null);
  };

  const handleConfirmCrop = () => {
    if (!cropBox || !imageRef.current) {
      console.log('No crop box or image reference');
      return;
    }

    console.log('Confirming crop with box:', cropBox);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }

    // 创建新的图片对象
    const img = document.createElement('img');
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error);
    };

    img.onload = () => {
      console.log('Original image size:', { width: img.width, height: img.height });

      // 计算缩放比例
      const rect = imageRef.current!.getBoundingClientRect();
      const scaleX = img.width / rect.width;
      const scaleY = img.height / rect.height;

      console.log('Scale factors:', { scaleX, scaleY });

      // 计算实际裁剪区域
      const cropX = cropBox.x * scaleX;
      const cropY = cropBox.y * scaleY;
      const cropWidth = cropBox.width * scaleX;
      const cropHeight = cropBox.height * scaleY;

      console.log('Actual crop dimensions:', { cropX, cropY, cropWidth, cropHeight });

      // 设置画布大小为裁剪区域大小
      canvas.width = cropWidth;
      canvas.height = cropHeight;

      try {
        // 绘制裁剪区域
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

        // 转换为base64
        const croppedImage = canvas.toDataURL('image/png');
        console.log('Cropped image generated successfully');

        // 更新图片
        setProcessedImage(croppedImage);
        
        // 如果已经移除了背景，也需要裁剪removedBgImage
        if (removedBgImage) {
          console.log('Cropping removed background image');
          const removedBgImg = document.createElement('img');
          removedBgImg.onload = () => {
            // 创建新的画布
            const removedBgCanvas = document.createElement('canvas');
            const removedBgCtx = removedBgCanvas.getContext('2d');
            if (!removedBgCtx) return;

            // 设置画布大小
            removedBgCanvas.width = cropWidth;
            removedBgCanvas.height = cropHeight;

            // 裁剪removedBgImage
            removedBgCtx.drawImage(
              removedBgImg,
              cropX, cropY, cropWidth, cropHeight,
              0, 0, cropWidth, cropHeight
            );

            // 更新removedBgImage
            const croppedRemovedBgImage = removedBgCanvas.toDataURL('image/png');
            console.log('Cropped removed background image generated');
            setRemovedBgImage(croppedRemovedBgImage);
          };
          removedBgImg.src = removedBgImage;
        }

        // 添加到历史记录
        const newHistory = [...history.slice(0, currentIndex + 1), croppedImage];
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);

        // 重置裁剪状态
        setIsCropping(false);
        setCropBox(null);
      } catch (error) {
        console.error('Error during image cropping:', error);
      }
    };

    // 设置图片源
    const currentImage = processedImage || originalImage;
    console.log('Setting image source:', currentImage);
    if (currentImage) {
      img.src = currentImage;
    } else {
      console.error('No image source available');
    }
  };

  const handleCancelCrop = () => {
    console.log('Canceling crop operation');
    setIsCropping(false);
    setCropBox(null);
    setDragStart(null);
    setDragType(null);
  };

  const [hasRemovedBackground, setHasRemovedBackground] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleUndo = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setProcessedImage(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setProcessedImage(history[newIndex]);
    }
  };

  const handleRemoveBackground = async () => {
    if (isLoading) return; // 防止重复点击

    try {
      setIsLoading(true);
      const currentImage = processedImage || originalImage;
      if (!currentImage) {
        console.error('No image to process');
        return;
      }

      console.log('Removing background from image:', currentImage);

      // 创建一个 canvas 来获取 ImageData
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = currentImage;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);

      if (!imageData) {
        throw new Error('Failed to get image data');
      }

      // 获取图片文件
      let imageBlob;
      if (currentImage.startsWith('data:')) {
        const response = await fetch(currentImage);
        imageBlob = await response.blob();
      } else {
        const response = await fetch(currentImage);
        imageBlob = await response.blob();
      }

      // 创建 FormData
      const formData = new FormData();
      formData.append('file', imageBlob);

      console.log('Sending request to remove background');

      // 发送请求到 API
      const result = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to remove background');
      }

      // 获取处理后的图片
      const processedBlob = await result.blob();
      const processedUrl = URL.createObjectURL(processedBlob);

      // 更新状态
      setRemovedBgImage(processedUrl);
      setHasRemovedBackground(true);

      // 添加到历史记录
      const newHistory = [...history.slice(0, currentIndex + 1), processedUrl];
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);

      // 更新处理后的图片
      setProcessedImage(processedUrl);
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        title: "Error",
        description: "Failed to remove background. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundChange = async (color: string) => {
    // 检查是否有图片和前景层
    if (!hasRemovedBackground) {
      console.error('Please remove background first');
      return;
    }

    if (!removedBgImage) {
      console.error('No removed background image available');
      return;
    }

    try {
      console.log('Starting background change with color:', color);
      console.log('Using removed background image:', removedBgImage);

      // 获取当前图片的尺寸
      const img = document.createElement('img');
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (error) => {
          console.error('Failed to load image:', error);
          reject(error);
        };
        img.src = removedBgImage;
      });

      console.log('Current image dimensions:', { width: img.width, height: img.height });

      // 准备FormData
      const formData = new FormData();
      
      // 将移除背景后的图片转换为blob
      const response = await fetch(removedBgImage);
      const blob = await response.blob();
      formData.append('file', blob);
      formData.append('color', color);
      
      // 添加当前图片尺寸
      formData.append('width', img.width.toString());
      formData.append('height', img.height.toString());

      console.log('Sending background change request with dimensions:', {
        width: img.width,
        height: img.height,
        color: color
      });

      const result = await fetch('/api/change-background', {
        method: 'POST',
        body: formData
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error('Background change failed:', errorText);
        throw new Error('Failed to change background');
      }

      const imageUrl = URL.createObjectURL(await result.blob());
      console.log('New image URL created:', imageUrl);
      
      // 更新处理后的图片，但保持移除背景后的图片不变
      setProcessedImage(imageUrl);
      setBackgroundColor(color);

      // 添加到历史记录
      const newHistory = [...history.slice(0, currentIndex + 1), imageUrl];
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);

    } catch (error) {
      console.error('Error changing background:', error);
    }
  };

  const handleSmartCrop = async () => {
    const currentImage = processedImage || originalImage;
    if (!currentImage) return;

    try {
      console.log('Starting smart crop');
      let imageBlob;
      const img = imageRef.current;
      
      if (img) {
        console.log('Getting image from canvas');
        // 直接从 canvas 获取图片数据
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => {
              if (b) resolve(b);
            }, 'image/png');
          });
          imageBlob = blob;
          console.log('Image blob created from canvas');
        }
      }

      if (!imageBlob) {
        console.log('Falling back to URL fetch');
        // 如果无法从 canvas 获取，则从 URL 获取
        const response = await fetch(currentImage);
        imageBlob = await response.blob();
      }

      console.log('Sending request to smart-crop API');
      // 创建 FormData
      const formData = new FormData();
      formData.append('file', imageBlob);

      // 发送请求到新的轻量级 API
      const result = await fetch('/api/smart-crop', {
        method: 'POST',
        body: formData
      });

      console.log('Got response from smart-crop API');

      if (!result.ok) {
        const errorText = await result.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to process image');
      }

      const processedBlob = await result.blob();
      const imageUrl = URL.createObjectURL(processedBlob);

      // 如果之前没有处理过的图片，保存当前图片为原图
      if (!processedImage) {
        setOriginalImage(currentImage);
      }
      
      // 更新处理后的图片并显示
      setProcessedImage(imageUrl);

      // 如果已经移除了背景，也需要smart crop removedBgImage
      if (removedBgImage) {
        console.log('Smart cropping removed background image');
        const removedBgFormData = new FormData();
        const removedBgResponse = await fetch(removedBgImage);
        const removedBgBlob = await removedBgResponse.blob();
        removedBgFormData.append('file', removedBgBlob);

        const removedBgResult = await fetch('/api/smart-crop', {
          method: 'POST',
          body: removedBgFormData
        });

        if (removedBgResult.ok) {
          const croppedRemovedBgBlob = await removedBgResult.blob();
          const croppedRemovedBgUrl = URL.createObjectURL(croppedRemovedBgBlob);
          console.log('Updated removed background image');
          setRemovedBgImage(croppedRemovedBgUrl);
        } else {
          console.error('Failed to smart crop removed background image');
        }
      }

      setShowOriginal(false);
      console.log('Updated image state');

      // 添加到历史记录
      const newHistory = [...history.slice(0, currentIndex + 1), imageUrl];
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);

    } catch (error) {
      console.error('Error smart cropping:', error);
    }
  };

  const handleCompareMouseDown = () => {
    setShowOriginal(true);
  };

  const handleCompareMouseUp = () => {
    setShowOriginal(false);
  };

  const backgroundImages = [
    '/background1.jpg',
    '/background2.jpg',
    '/background3.jpg',
    '/background4.jpg',
    '/background5.jpg',
    '/background6.jpg',
  ];

  const backgroundColors = [
    "transparent",  // 添加透明背景选项
    "#F44336","#E91E63","#9C27B0","#673AB7","#3F51B5","#2196F3","#03A9F4","#00BCD4","#009688","#4CAF50","#8BC34A","#CDDC39","#FFEB3B"
  ];

  const handleDownload = async () => {
    const imageToDownload = processedImage || originalImage;
    if (!imageToDownload) return;

    try {
      // 创建一个临时的a标签来触发下载
      const link = document.createElement('a');
      
      // 如果是Data URL，直接使用
      if (imageToDownload.startsWith('data:')) {
        link.href = imageToDownload;
      } else {
        // 如果是Blob URL或普通URL，先获取blob
        const response = await fetch(imageToDownload);
        const blob = await response.blob();
        link.href = URL.createObjectURL(blob);
      }
      
      // 设置文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `edited-image-${timestamp}.png`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      if (!imageToDownload.startsWith('data:')) {
        URL.revokeObjectURL(link.href);
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleFileChange = async (file: File) => {
    if (!file) return;

    // 创建一个临时的URL来显示图片
    const objectUrl = URL.createObjectURL(file);
    console.log('Created object URL:', objectUrl);
    
    setOriginalImage(objectUrl);
    setProcessedImage(objectUrl);
    setActiveTab("result");

    // 重置状态
    setHasRemovedBackground(false);
    setRemovedBgImage(null);
    setBackgroundColor(null);
    
    // 添加到历史记录
    const newHistory = [objectUrl];
    setHistory(newHistory);
    setCurrentIndex(0);
  };

  // 添加新的状态
  const [editHistory, setEditHistory] = useState<HistoryItem[]>([]);
  const saveCurrentEditState = useCallback(() => {
    if (!originalImage) return;
    
    setEditHistory(prev => {
      const currentItem = prev.find(item => 
        item.image === originalImage || item.editState?.processedImage === originalImage
      );
      
      if (!currentItem) return prev;
      
      const updatedHistory = prev.map(item => {
        if (item.id === currentItem.id) {
          return {
            ...item,
            editState: {
              processedImage,
              removedBgImage,
              hasRemovedBackground,
              backgroundColor,
              history,
              currentIndex,
            }
          };
        }
        return item;
      });
      
      return updatedHistory;
    });
  }, [originalImage, processedImage, removedBgImage, hasRemovedBackground, backgroundColor, history, currentIndex]);

  useEffect(() => {
    saveCurrentEditState();
  }, [processedImage, removedBgImage, hasRemovedBackground, backgroundColor, history, currentIndex]);

  const handleNewImage = async (file: File) => {
    try {
      setIsLoading(true);
      const storageService = new StorageService();
      
      // 上传到 Supabase
      const imageUrl = await storageService.uploadImage(file);
      const thumbnail = await createThumbnail(imageUrl);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        image: imageUrl,
        thumbnail,
        timestamp: Date.now(),
        editState: {
          processedImage: imageUrl,
          removedBgImage: null,
          hasRemovedBackground: false,
          backgroundColor: null,
          history: [imageUrl],
          currentIndex: 0
        }
      };
      
      setEditHistory(prev => [newHistoryItem, ...prev]);
      
      // 设置为当前编辑的图片
      setOriginalImage(imageUrl);
      setProcessedImage(imageUrl);
      setHasRemovedBackground(false);
      setRemovedBgImage(null);
      setBackgroundColor(null);
      setHistory([imageUrl]);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryImage = (historyItem: HistoryItem) => {
    // 先保存当前图片的状态
    saveCurrentEditState();
    
    // 恢复选中图片的状态
    setOriginalImage(historyItem.image);
    if (historyItem.editState) {
      setProcessedImage(historyItem.editState.processedImage);
      setRemovedBgImage(historyItem.editState.removedBgImage);
      setHasRemovedBackground(historyItem.editState.hasRemovedBackground);
      setBackgroundColor(historyItem.editState.backgroundColor);
      setHistory(historyItem.editState.history);
      setCurrentIndex(historyItem.editState.currentIndex);
    } else {
      setProcessedImage(historyItem.image);
      setRemovedBgImage(null);
      setHasRemovedBackground(false);
      setBackgroundColor(null);
      setHistory([historyItem.image]);
      setCurrentIndex(0);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storageService = new StorageService();
        const urls = await storageService.getImageHistory();
        
        // 创建历史记录项
        const historyItems = await Promise.all(
          urls.map(async (url) => {
            try {
              const thumbnail = await createThumbnail(url);
              return {
                id: Date.now().toString() + Math.random(),
                image: url,
                thumbnail,
                timestamp: Date.now(),
                editState: {
                  processedImage: url,
                  removedBgImage: null,
                  hasRemovedBackground: false,
                  backgroundColor: null,
                  history: [url],
                  currentIndex: 0
                }
              };
            } catch (error) {
              console.error('Failed to create history item:', error);
              return null;
            }
          })
        );
        
        // 过滤掉失败的项
        const validHistoryItems = historyItems.filter((item): item is HistoryItem => item !== null);
        setEditHistory(validHistoryItems);

        // 如果有历史记录，加载最新的图片
        if (validHistoryItems.length > 0 && !originalImage) {
          const latestItem = validHistoryItems[0];
          setOriginalImage(latestItem.image);
          setProcessedImage(latestItem.image);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };

    loadHistory();
  }, [originalImage]); // 只在组件加载和 originalImage 改变时重新加载

  // 创建缩略图
  const createThumbnail = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置缩略图大小
        const maxSize = 100;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = height * (maxSize / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = width * (maxSize / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制缩略图
        ctx?.drawImage(img, 0, 0, width, height);
        
        try {
          // 转换为 base64
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        } catch (error) {
          console.error('Failed to create thumbnail:', error);
          resolve(imageUrl); // 如果创建缩略图失败，返回原图
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image for thumbnail');
        resolve(imageUrl); // 加载失败时返回原图
      };
      
      // 添加时间戳以避免缓存问题
      const cacheBuster = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      img.src = cacheBuster;
    });
  };

  // 添加全屏loading组件
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white/10 rounded-lg p-8 flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <p className="text-white/80 text-sm">Processing Image...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0118] text-white">
      <style>{globalStyles}</style>
      {isLoading && <LoadingOverlay />}
      
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/5 backdrop-blur-lg z-40 flex items-center px-4">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center transform hover:rotate-180 transition-transform duration-500">
              <Crop className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
              magic crop
            </span>
          </Link>
        </div>
      </nav>

      <main className={`pt-16 min-h-screen ${isLoading ? 'pointer-events-none' : ''}`}>
        <div className="flex h-[calc(100vh-4rem)]">
          {/* 左侧面板 */}
          <div className="flex-1 relative">
            {/* 历史图片和上传部分 - 移到这里并调整样式 */}
            <div className="absolute top-2 left-4 z-10">
              <div className="flex gap-2 h-12">
                {/* 上传按钮 */}
                <label className="h-full aspect-square rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer border border-dashed border-white/10 hover:border-white/20">
                  <Plus className="w-5 h-5 text-white/50" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleNewImage(file);
                      }
                    }}
                  />
                </label>

                {/* 历史图片预览 */}
                {editHistory.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="relative h-full aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleSelectHistoryImage(item)}
                  >
                    <img
                      src={item.thumbnail}
                      alt="历史图片"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>

            <div className="h-full flex items-center justify-center p-8">
              {(originalImage || processedImage) ? (
                <>
                  <div className="relative">
                    <div 
                      className="relative inline-block"
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <div className="transparent-grid">
                        <img
                          ref={imageRef}
                          src={showOriginal ? originalImage : processedImage || originalImage}
                          alt={showOriginal ? "Original" : "Processed"}
                          className="max-w-full max-h-[60vh] w-auto h-auto"
                          style={{ display: 'block' }}
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            const sizeIndicator = img.parentElement?.parentElement?.querySelector('.size-indicator') as HTMLElement;
                            if (sizeIndicator) {
                              sizeIndicator.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                            }
                            if (isCropping) {
                              handleStartCrop();
                            }
                          }}
                        />
                      </div>
                      
                      {isCropping && cropBox && (
                        <>
                          <div className="crop-overlay" />
                          <div
                            className="crop-area"
                            style={{
                              left: cropBox.x,
                              top: cropBox.y,
                              width: cropBox.width,
                              height: cropBox.height,
                            }}
                          />
                          {/* 控制点 */}
                          <div className="control-point" style={{ left: cropBox.x, top: cropBox.y, cursor: 'nw-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x + cropBox.width/2, top: cropBox.y, cursor: 'n-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x + cropBox.width, top: cropBox.y, cursor: 'ne-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x + cropBox.width, top: cropBox.y + cropBox.height/2, cursor: 'e-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x + cropBox.width, top: cropBox.y + cropBox.height, cursor: 'se-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x + cropBox.width/2, top: cropBox.y + cropBox.height, cursor: 's-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x, top: cropBox.y + cropBox.height, cursor: 'sw-resize' }} />
                          <div className="control-point" style={{ left: cropBox.x, top: cropBox.y + cropBox.height/2, cursor: 'w-resize' }} />
                          
                          {/* 确认/取消按钮 */}
                          <div className="crop-buttons">
                            <button
                              onClick={handleConfirmCrop}
                              className="crop-button crop-button-confirm"
                              title="确认裁剪"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleCancelCrop}
                              className="crop-button crop-button-cancel"
                              title="取消"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded size-indicator">
                        {showOriginal ? "Original Size" : "Processed Size"}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Toolbar */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
                      onClick={handleUndo}
                      disabled={!hasRemovedBackground || currentIndex <= 0}
                    >
                      <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50"
                      onClick={handleRedo}
                      disabled={!hasRemovedBackground || currentIndex >= history.length - 1}
                    >
                      <Redo2 className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-white/20" />
                    {!hasRemovedBackground ? (
                      <button
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center gap-2 transition-colors select-none text-white font-medium whitespace-nowrap"
                        onClick={handleRemoveBackground}
                      >
                        <Wand2 className="w-4 h-4" />
                        <span className="text-sm">Remove Background</span>
                      </button>
                    ) : (
                      <button
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full flex items-center gap-2 transition-colors select-none whitespace-nowrap"
                        onMouseDown={handleCompareMouseDown}
                        onMouseUp={handleCompareMouseUp}
                        onMouseLeave={handleCompareMouseUp}
                        style={{ touchAction: 'none' }}
                      >
                        <SplitSquareVertical className="w-4 h-4" />
                        <span className="text-sm">Hold to view original</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-white/50 border-2 border-dashed border-purple-500/50 p-8 rounded-lg transparent-grid">
                  No image loaded
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Tools */}
          <div className="w-80 bg-black/60 backdrop-blur-xl border-l border-white/10 p-4 flex flex-col">
            <div className="space-y-4 flex-1">
              <TooltipProvider>
                {/* Smart Crop */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start space-x-2 hover:bg-white/10"
                      onClick={handleSmartCrop}
                    >
                      <Scan className="w-4 h-4" />
                      <span>Smart Crop</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Automatically crop empty space</p>
                  </TooltipContent>
                </Tooltip>

                {/* Manual Crop */}
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start space-x-2 hover:bg-white/10 ${isCropping ? 'bg-purple-500/20' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCropping) {
                      setIsCropping(true);
                      handleManualCrop();
                    } else {
                      handleCancelCrop();
                    }
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <Crop className="w-4 h-4" />
                    <span>Manual Crop {isCropping ? '(Active)' : ''}</span>
                  </div>
                </Button>

                {/* Background */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setActiveTab(activeTab === "background" ? null : "background")}
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Background
                  </Button>
                  
                  {activeTab === "background" && (
                    <div className="absolute left-0 top-full mt-2 p-4 bg-black/90 rounded-lg border border-white/10 shadow-xl z-50">
                      <div className="grid grid-cols-7 gap-2">
                        {backgroundColors.map((color, index) => (
                          <button
                            key={color}
                            className={`w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95 ${color === "transparent" ? "bg-transparent !border-dashed" : ""}`}
                            style={{ backgroundColor: color === "transparent" ? "transparent" : color }}
                            onClick={() => handleBackgroundChange(color)}
                          >
                            {color === "transparent" && (
                              <svg 
                                className="w-4 h-4 text-white/50" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor"
                              >
                                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                                <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </div>

            {/* Download Section */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
