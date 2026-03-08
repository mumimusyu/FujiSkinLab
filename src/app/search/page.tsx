"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import SkinCard from "@/components/SkinCard"
import { Skin } from "@/types/skin"

export default function SearchPage() {

  const router = useRouter()
  const searchParams = useSearchParams()

  const queryText = searchParams.get("q") || ""

  const [keyword, setKeyword] = useState(queryText)
  const [history, setHistory] = useState<string[]>([])
  const [skins, setSkins] = useState<Skin[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {

    const stored = localStorage.getItem("searchHistory")

    if (stored) {
      setHistory(JSON.parse(stored))
    }

  }, [])


  useEffect(() => {

    if (!queryText) {
      setSkins([])
      return
    }

    const fetchSkins = async () => {

      setLoading(true)

      const q = query(
        collection(db, "skins"),
        orderBy("createdAt", "desc")
      )

      const snapshot = await getDocs(q)

      const data: Skin[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Skin, "id">),
      }))

      const filtered = data.filter((skin) =>
        skin.title.toLowerCase().includes(queryText.toLowerCase())
      )

      setSkins(filtered)
      setLoading(false)
    }

    fetchSkins()

  }, [queryText])


  const handleSearch = (e: React.FormEvent) => {

    e.preventDefault()

    if (!keyword.trim()) return

    const newHistory = [
      keyword,
      ...history.filter((h) => h !== keyword)
    ].slice(0, 10)

    setHistory(newHistory)

    localStorage.setItem(
      "searchHistory",
      JSON.stringify(newHistory)
    )

    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }


  return (

    <div className="space-y-10">

      {/* 検索バー */}

      <form onSubmit={handleSearch} className="max-w-xl">

        <input
          type="text"
          placeholder="スキンを検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full px-4 py-3 border rounded-xl"
        />

      </form>


      {/* 検索履歴 */}

      {!queryText && (

        <div>

          <h2 className="text-lg font-semibold mb-4">
            検索履歴
          </h2>

          {history.length === 0 ? (
            <p className="opacity-60">
              まだ検索履歴がありません
            </p>
          ) : (

            <div className="flex flex-wrap gap-2">

              {history.map((h) => (

                <button
                  key={h}
                  onClick={() =>
                    router.push(`/search?q=${encodeURIComponent(h)}`)
                  }
                  className="px-3 py-1 bg-gray-200 rounded-full text-sm"
                >
                  {h}
                </button>

              ))}

            </div>

          )}

        </div>

      )}


      {/* 検索結果 */}

      {queryText && (

        <div>

          <h2 className="text-xl font-bold mb-6">
            「{queryText}」の検索結果
          </h2>

          {loading ? (
            <p>検索中...</p>
          ) : skins.length === 0 ? (
            <p>該当するスキンがありません</p>
          ) : (

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              {skins.map((skin) => (
                <SkinCard
                  key={skin.id}
                  skin={skin}
                />
              ))}

            </div>

          )}

        </div>

      )}

    </div>

  )
}