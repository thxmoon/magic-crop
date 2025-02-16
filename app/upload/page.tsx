"use client"

import { ImageUpload } from "@/components/ui/image-upload"
import Link from "next/link"
import { Crop } from "lucide-react"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-[#0A0118] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
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

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Upload Your Image
            </h1>
            <p className="text-lg text-white/60">
              Choose an image to start editing. We support PNG, JPG, JPEG, and GIF formats.
            </p>
          </div>

          <ImageUpload />
        </div>
      </main>
    </div>
  )
}
