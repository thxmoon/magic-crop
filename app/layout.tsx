import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./webgpu-polyfill.js"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Remove Background from Image | removebg",
  description:
    "Remove image backgrounds automatically in 5 seconds with just one click. Don't spend hours manually picking pixels. Upload your photo now & see the magic.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}