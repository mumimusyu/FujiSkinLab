"use client"

import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import SkinCard from "@/components/SkinCard"
import { Skin } from "@/types/skin"
import { getRanking } from "@/lib/getRanking"

export default function Home() {

  const [ranking, setRanking] = useState<Skin[]>([])
  const [skins, setSkins] = useState<Skin[]>([])
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // ランキング取得
  useEffect(() => {
    const fetch = async () => {
      const data = await getRanking()
      setRanking(data)
    }
    fetch()
  }, [])

  const fetchMore = async () => {

    if (loading) return
    setLoading(true)

    let q

    if (lastDoc) {
      q = query(
        collection(db, "skins"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(20)
      )
    } else {
      q = query(
        collection(db, "skins"),
        orderBy("createdAt", "desc"),
        limit(20)
      )
    }

    const snap = await getDocs(q)

    const newData: Skin[] = snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Skin, "id">),
    }))

    // ===== ここが修正ポイント（重複排除）=====
    setSkins(prev => {

      const merged = [...prev, ...newData]

      const map = new Map<string, Skin>()

      merged.forEach(item => {
        map.set(item.id, item)
      })

      return Array.from(map.values())
    })

    setLastDoc(snap.docs[snap.docs.length - 1])
    setLoading(false)
  }

  useEffect(() => {
    fetchMore()
  }, [])

  // スクロール検知
  useEffect(() => {

    const handleScroll = () => {

      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300
      ) {
        fetchMore()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)

  }, [lastDoc, loading])

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

      {/* タイトル */}
      <div className="text-center">
        <h1 className="text-4xl font-bold">FujiSkinLab</h1>
        <p className="text-sm opacity-60">見つけよう、自分の姿。</p>
      </div>

      {/* ランキング */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          昨日の人気スキン
        </h2>

        <div className="flex gap-4 overflow-x-auto">
          {ranking.map((skin, i) => (
            <div key={skin.id} className="min-w-[180px]">
              <p className="text-xs opacity-60">{i + 1}位</p>
              <SkinCard skin={skin} />
            </div>
          ))}
        </div>
      </div>

      {/* おすすめ */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">
          おすすめスキン
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {skins.map((skin) => (
            <SkinCard key={skin.id} skin={skin} />
          ))}
        </div>

        {loading && <p className="text-center mt-4">読み込み中...</p>}
      </div>

    </main>
  )
}