"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, Crop, Wand2 } from "lucide-react"
import { ImageUpload } from "@/components/ui/image-upload"

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0118] text-white overflow-hidden">
      {/* Animated background */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-colors duration-300"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`,
        }}
      />

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
              Transform Your Images with{" "}
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                AI Magic
              </span>
            </h1>
            <p className="text-lg text-white/60">
              Upload your image and let our AI do the magic. Remove backgrounds, enhance quality, and more.
            </p>
          </div>

          <ImageUpload />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-white/5 backdrop-blur">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Remove Background</h3>
              <p className="text-sm text-white/60">
                Instantly remove backgrounds with our AI technology
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 backdrop-blur">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Crop className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Smart Crop</h3>
              <p className="text-sm text-white/60">
                Automatically crop and adjust your images
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 backdrop-blur">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Batch Processing</h3>
              <p className="text-sm text-white/60">
                Process multiple images at once
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
