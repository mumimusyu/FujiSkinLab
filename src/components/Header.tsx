"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"

export default function Header() {

  const [user, loading] = useAuthState(auth)

  const [keyword, setKeyword] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])

  const [showDropdown, setShowDropdown] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // 履歴取得（5件に制限）
  useEffect(() => {
    const saved = localStorage.getItem("searchHistory")
    if (saved) {
      const parsed = JSON.parse(saved)
      setHistory(parsed.slice(0, 5))
    }
  }, [])

  // 人気タグ取得（上位3件）
  useEffect(() => {
    const fetchTags = async () => {

      const qRef = query(
        collection(db, "tagStats"),
        orderBy("count", "desc"),
        limit(3)
      )

      const snap = await getDocs(qRef)

      const tags = snap.docs.map(doc => doc.id)
      setPopularTags(tags)
    }

    fetchTags()
  }, [])

  const saveHistory = (word: string) => {
    let newHistory = [word, ...history.filter(h => h !== word)]
    if (newHistory.length > 5) newHistory = newHistory.slice(0, 5)

    setHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))
  }

  const deleteHistory = (word: string) => {
    const newHistory = history.filter(h => h !== word)
    setHistory(newHistory)
    localStorage.setItem("searchHistory", JSON.stringify(newHistory))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return

    saveHistory(keyword)
    setShowDropdown(false)

    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }

  useEffect(() => {
    if (isSearchMode) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isSearchMode])

  return (
    <header className="bg-[var(--sub-background)] border-b sticky top-0 z-50">

      <div className="max-w-6xl mx-auto px-4 py-3">

        {/* スマホ検索モード */}
        {isSearchMode && (
          <div className="md:hidden space-y-2">

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSearchMode(false)}
                className="text-lg px-2"
              >
                ←
              </button>

              <form onSubmit={handleSearch} className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="スキンを検索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--background)]"
                />
              </form>
            </div>

            {showDropdown && (
              <div className="bg-[var(--background)] rounded-xl shadow w-full p-2 space-y-2">

                {/* 検索履歴 */}
                {history.length > 0 && (
                  <div>
                    <p className="text-xs opacity-60 mb-1">検索履歴</p>
                    {history.map((item) => (
                      <div
                        key={item}
                        className="flex justify-between items-center px-2 py-1"
                        onMouseDown={() => {
                          saveHistory(item)
                          router.push(`/search?q=${encodeURIComponent(item)}`)
                        }}
                      >
                        <span>{item}</span>
                        <button
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            deleteHistory(item)
                          }}
                          className="text-gray-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 人気タグ */}
                {popularTags.length > 0 && (
                  <div>
                    <p className="text-xs opacity-60 mb-1">人気タグ</p>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map(tag => (
                        <span
                          key={tag}
                          onMouseDown={() =>
                            router.push(`/search?q=${encodeURIComponent("#" + tag)}`)
                          }
                          className="px-2 py-1 bg-[var(--sub-background)] rounded-full text-sm cursor-pointer"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* 通常ヘッダー */}
        {!isSearchMode && (
          <div className="flex justify-between items-start">

            <Link href="/" className="text-xl font-bold pt-2">
              FujiSkinLab
            </Link>

            {/* PC検索 */}
            <div className="hidden md:flex flex-col w-64">

              <form onSubmit={handleSearch}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="スキンを検索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--background)] text-sm"
                />
              </form>

              {showDropdown && (
                <div className="mt-1 bg-[var(--background)] rounded-xl shadow w-full p-2 space-y-2">

                  {/* 履歴 */}
                  {history.length > 0 && (
                    <div>
                      <p className="text-xs opacity-60 mb-1">検索履歴</p>
                      {history.map((item) => (
                        <div
                          key={item}
                          className="flex justify-between items-center px-2 py-1 cursor-pointer"
                          onMouseDown={() => {
                            saveHistory(item)
                            router.push(`/search?q=${encodeURIComponent(item)}`)
                          }}
                        >
                          <span>{item}</span>
                          <button
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              deleteHistory(item)
                            }}
                            className="text-gray-400"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 人気タグ */}
                  {popularTags.length > 0 && (
                    <div>
                      <p className="text-xs opacity-60 mb-1">人気タグ</p>
                      <div className="flex flex-wrap gap-2">
                        {popularTags.map(tag => (
                          <span
                            key={tag}
                            onMouseDown={() =>
                              router.push(`/search?q=${encodeURIComponent("#" + tag)}`)
                            }
                            className="px-2 py-1 bg-[var(--sub-background)] rounded-full text-sm cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            <nav className="flex items-center gap-6 text-sm">

              <button
                onClick={() => setIsSearchMode(true)}
                className="md:hidden"
              >
                検索
              </button>

              <Link href="/upload">
                公開
              </Link>

              {loading ? null : user ? (
                <Link
                  href={`/users/${user.uid}`}
                  className="flex items-center gap-2"
                >
                  <img
                    src={user.photoURL || "/default-icon.png"}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>
                    {user.displayName?.replace(/"/g, "") || "No Name"}
                  </span>
                </Link>
              ) : (
                <Link href="/login">
                  ログイン
                </Link>
              )}

            </nav>

          </div>
        )}

      </div>

    </header>
  )
}