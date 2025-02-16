import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { BackgroundRemovalProvider } from "@/components/BackgroundRemovalProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Magic Crop",
  description: "Image editing tool with AI-powered features",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackgroundRemovalProvider>
          {children}
        </BackgroundRemovalProvider>
      </body>
    </html>
  )
}