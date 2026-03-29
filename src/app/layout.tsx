import "./globals.css"
import type { Metadata } from "next"
import React from "react"
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "FujiSkinLab",
  description: "Minecraft Skin Sharing Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-[var(--background)] text-[var(--foreground)] min-h-screen flex flex-col">

        {/* Header */}
        <Header />

        {/* Main Layout */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-8">

            {/* 将来広告を入れられる2カラム構造 */}
            <div className="grid grid-cols-12 gap-6">

              {/* Main Content */}
              <main className="col-span-12 md:col-span-9">
                {children}
              </main>

              {/* Ad Space (将来用) */}
              <aside className="hidden md:block md:col-span-3">
                {/* 広告エリア（今は空） */}
              </aside>

            </div>

          </div>
        </div>

        {/* Footer（将来広告やリンク用） */}
        <footer className="mt-16 py-6 text-center text-sm opacity-60">
          © 2026 FujiSkinLab
        </footer>

      </body>
    </html>
  )
}