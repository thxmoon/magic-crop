import { supabase } from '@/lib/supabase'

export class StorageService {
  async uploadImage(file: File): Promise<string> {
    try {
      const filename = `${Date.now()}-${file.name}`
      
      // 上传到 Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('Upload error:', error)
        throw error
      }
      
      if (!data) {
        throw new Error('Upload failed - no data returned')
      }
      
      // 获取公共 URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path)
      
      return publicUrl
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }

  async getImageHistory(): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .list()
      
      if (error) {
        console.error('List error:', error)
        throw error
      }
      
      if (!data) {
        return []
      }
      
      return data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(file.name)
        return publicUrl
      })
    } catch (error) {
      console.error('Failed to get image history:', error)
      throw error
    }
  }
}
