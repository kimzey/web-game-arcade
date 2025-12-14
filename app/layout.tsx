import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "Co-op Arcade",
  description: "Play co-op games with your friends using P2P connection",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={fontSans.variable}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
