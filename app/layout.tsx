import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BackgroundRemovalProvider } from "@/components/BackgroundRemovalProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Magic Crop",
  description: "Image editing tool with AI-powered features",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BackgroundRemovalProvider>
          {children}
        </BackgroundRemovalProvider>
      </body>
    </html>
  );
}