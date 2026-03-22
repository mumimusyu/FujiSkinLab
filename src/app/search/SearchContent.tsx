"use client"
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import SkinCard from "@/components/SkinCard"
import { Skin } from "@/types/skin"

type TagStat = {
  tag: string
  count: number
  recentCount: number
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get("q") || ""

  const [keyword, setKeyword] = useState(q)
  const [history, setHistory] = useState<string[]>([])
  const [skins, setSkins] = useState<Skin[]>([])
  const [loading, setLoading] = useState(false)

  const [popularTags, setPopularTags] = useState<TagStat[]>([])
  const [trendTags, setTrendTags] = useState<TagStat[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("searchHistory")
    if (saved) setHistory(JSON.parse(saved))
  }, [])

  const saveHistory = (word: string) => {
    let newHistory = [word, ...history.filter(h => h !== word)]
    if (newHistory.length > 10) newHistory = newHistory.slice(0, 10)

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
    router.push(`/search?q=${encodeURIComponent(keyword)}`)
  }

  // タグ取得
  useEffect(() => {
    const fetchTags = async () => {
      const popularSnap = await getDocs(
        query(
          collection(db, "tagStats"),
          orderBy("count", "desc"),
          limit(10)
        )
      )

      const trendSnap = await getDocs(
        query(
          collection(db, "tagStats"),
          orderBy("recentCount", "desc"),
          limit(10)
        )
      )

      setPopularTags(
        popularSnap.docs.map(d => d.data() as TagStat)
      )

      setTrendTags(
        trendSnap.docs.map(d => d.data() as TagStat)
      )
    }

    fetchTags()
  }, [])

  // 検索処理
  useEffect(() => {
    if (!q) return

    const fetchSkins = async () => {
      setLoading(true)

      const isTagSearch = q.startsWith("#")
      const keyword = isTagSearch
        ? q.slice(1).toLowerCase()
        : q.toLowerCase()

      let results: Skin[] = []

      // タグ検索
      if (isTagSearch) {
        const qRef = query(
          collection(db, "skins"),
          where("tags", "array-contains", keyword),
          orderBy("createdAt", "desc"),
          limit(50)
        )

        const snap = await getDocs(qRef)

        results = snap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Skin, "id">),
        }))
      } else {
        // タグ検索
        const tagQuery = query(
          collection(db, "skins"),
          where("tags", "array-contains", keyword),
          orderBy("createdAt", "desc"),
          limit(30)
        )

        const tagSnap = await getDocs(tagQuery)

        const tagResults = tagSnap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<Skin, "id">),
        }))

        // タイトル検索（簡易）
        const recentSnap = await getDocs(
          query(
            collection(db, "skins"),
            orderBy("createdAt", "desc"),
            limit(100)
          )
        )

        const titleResults = recentSnap.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Skin, "id">),
          }))
          .filter(s =>
            s.title?.toLowerCase().includes(keyword)
          )

        // マージ（重複除去）
        const map = new Map<string, Skin>()

          ;[...tagResults, ...titleResults].forEach(s => {
            map.set(s.id, s)
          })

        results = Array.from(map.values())
      }

      setSkins(results)
      setLoading(false)
    }

    fetchSkins()
  }, [q])

  return (
    <main className="max-w-6xl mx-auto p-6">

      {/* 検索結果 */}
      {q && (
        <div className="mt-6">
          <h1 className="text-xl font-bold mb-4">
            「{q}」の検索結果
          </h1>

          {loading && <p>読み込み中...</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skins.map((skin) => (
              <SkinCard key={skin.id} skin={skin} />
            ))}
          </div>

          {!loading && skins.length === 0 && (
            <p className="text-center mt-6 opacity-60">
              見つかりませんでした
            </p>
          )}
        </div>
      )}
    </main>
  )
}