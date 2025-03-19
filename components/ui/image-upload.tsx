"use client"

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Upload } from 'lucide-react'
import { StorageService } from '@/services/storage'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function ImageUpload() {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    if (file.size > MAX_FILE_SIZE) {
      alert('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      const storageService = new StorageService()
      const { url, error } = await storageService.uploadImage(file)
      
      if (error) {
        throw error
      }

      if (url) {
        router.push(`/edit?image=${encodeURIComponent(url)}`)
      } else {
        throw new Error('Failed to get upload URL')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20 hover:border-white/40'
      } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-4 rounded-full transition-colors ${
          isDragActive ? 'bg-purple-500/20' : 'bg-white/5'
        }`}>
          <Upload className={`w-8 h-8 ${
            isDragActive ? 'text-purple-400' : 'text-white/80'
          }`} />
        </div>
        {uploading ? (
          <p className="text-lg text-white/80">Uploading...</p>
        ) : isDragActive ? (
          <p className="text-lg text-purple-400">Drop the image here...</p>
        ) : (
          <>
            <p className="text-lg text-white/80">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-sm text-white/50">
              Supports PNG, JPG, JPEG, GIF (max. 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  )
}
