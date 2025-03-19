import { supabase } from '@/lib/supabase'

export class StorageService {
  private bucketName = 'images'

  async uploadImage(file: File): Promise<{ url: string | null; error: Error | null }> {
    try {
      const filename = `${Date.now()}-${file.name}`
      
      // 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        // 如果是因为 bucket 不存在的错误，尝试使用默认 bucket
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          console.log('Trying with default bucket...');
          const { data: defaultData, error: defaultError } = await supabase.storage
            .from('public')
            .upload(filename, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (defaultError) {
            console.error('Upload error with default bucket:', defaultError);
            return { url: null, error: defaultError };
          }
          
          if (!defaultData) {
            const newError = new Error('Upload failed - no data returned');
            return { url: null, error: newError };
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(defaultData.path);
            
          return { url: publicUrl, error: null };
        }
        
        console.error('Upload error:', error);
        return { url: null, error };
      }
      
      if (!data) {
        const error = new Error('Upload failed - no data returned');
        return { url: null, error };
      }
      
      // 获取公共 URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);
      
      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Upload failed:', error);
      return { url: null, error: error as Error };
    }
  }

  async getImageHistory(): Promise<string[]> {
    try {
      // 尝试从主要 bucket 获取
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list()
      
      // 如果出错，尝试从 public bucket 获取
      if (error) {
        console.log('Trying to get history from default bucket...');
        const { data: defaultData, error: defaultError } = await supabase.storage
          .from('public')
          .list();
          
        if (defaultError || !defaultData) {
          console.error('List error from default bucket:', defaultError);
          return [];
        }
        
        return defaultData.map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(file.name);
          return publicUrl;
        });
      }
      
      if (!data) {
        return [];
      }
      
      return data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(file.name);
        return publicUrl;
      });
    } catch (error) {
      console.error('Failed to get image history:', error);
      return [];
    }
  }

  async getRecentImageHistory(hoursAgo: number = 12): Promise<string[]> {
    try {
      // 计算过滤时间戳（当前时间减去指定小时数）
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursAgo);
      
      // 尝试从主要 bucket 获取
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list();
      
      // 如果出错，尝试从 public bucket 获取
      if (error) {
        console.log('Trying to get history from default bucket...');
        const { data: defaultData, error: defaultError } = await supabase.storage
          .from('public')
          .list();
          
        if (defaultError || !defaultData) {
          console.error('List error from default bucket:', defaultError);
          return [];
        }
        
        // 过滤最近的文件
        const recentFiles = defaultData.filter(file => {
          // 从文件名中提取时间戳（假设文件名格式为：timestamp-filename）
          const timestampStr = file.name.split('-')[0];
          if (!timestampStr || isNaN(Number(timestampStr))) return false;
          
          const fileTimestamp = new Date(Number(timestampStr));
          return fileTimestamp >= cutoffTime;
        });
        
        return recentFiles.map(file => {
          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(file.name);
          return publicUrl;
        });
      }
      
      if (!data) {
        return [];
      }
      
      // 过滤最近的文件
      const recentFiles = data.filter(file => {
        // 从文件名中提取时间戳（假设文件名格式为：timestamp-filename）
        const timestampStr = file.name.split('-')[0];
        if (!timestampStr || isNaN(Number(timestampStr))) return false;
        
        const fileTimestamp = new Date(Number(timestampStr));
        return fileTimestamp >= cutoffTime;
      });
      
      return recentFiles.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(file.name);
        return publicUrl;
      });
    } catch (error) {
      console.error('Failed to get recent image history:', error);
      return [];
    }
  }
}
