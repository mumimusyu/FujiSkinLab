"use client"

import { Suspense } from "react"
import SearchContent from "./SearchContent"

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="p-6">読み込み中...</p>}>
      <SearchContent />
    </Suspense>
  )
}