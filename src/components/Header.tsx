"use client"

import Link from "next/link"
import { auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"

export default function Header() {

  const [user, loading] = useAuthState(auth)

  return (
    <header className="bg-[var(--sub-background)] border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link href="/" className="text-xl font-bold">
          FujiSkinLab
        </Link>

        <nav className="flex items-center gap-6 text-sm">

          <Link href="/search" className="hover:opacity-70">
            探す
          </Link>

          <Link href="/upload" className="hover:opacity-70">
            公開
          </Link>

          {loading ? null : user ? (
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