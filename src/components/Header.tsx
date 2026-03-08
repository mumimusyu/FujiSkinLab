"use client"

import Link from "next/link"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import { signOut } from "firebase/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Header() {
  const [user, loading] = useAuthState(auth)
  const [keyword, setKeyword] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!keyword.trim()) return

    router.push(`/search?q=${encodeURIComponent(keyword)}`)
    setKeyword("")
  }

  return (
    <header className="bg-[var(--sub-background)] border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

        <div className="flex items-center gap-6">

          <Link href="/" className="text-xl font-bold">
            FujiSkinLab
          </Link>

          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="スキンを検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="px-3 py-1 rounded-md border text-sm"
            />
          </form>

        </div>

        <nav className="flex items-center gap-6 text-sm">

          <Link href="/upload" className="hover:opacity-70">
            スキンを公開
          </Link>

          {loading ? null : user ? (
            <>
              <Link
                href={`/users/${user.uid}`}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                <img
                  src={user.photoURL || "/default-icon.png"}
                  alt="avatar"
                  className="w-8 h-8 rounded-full"
                />
                <span>
                  {user.displayName?.replace(/"/g, "") || "No Name"}
                </span>
              </Link>

              <button
                onClick={() => signOut(auth)}
                className="opacity-70 hover:opacity-100"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link href="/login">
              ログイン
            </Link>
          )}

        </nav>
      </div>
    </header>
  )
}