"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import SkinCard from "@/components/SkinCard"
import { Skin } from "@/types/skin"

export default function SearchPage() {

  const searchParams = useSearchParams()
  const keyword = searchParams.get("q") || ""

  const [skins, setSkins] = useState<Skin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchSkins = async () => {

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
        skin.title.toLowerCase().includes(keyword.toLowerCase())
      )

      setSkins(filtered)
      setLoading(false)
    }

    fetchSkins()

  }, [keyword])

  return (

    <div>

      <h1 className="text-2xl font-bold mb-6">
        「{keyword}」の検索結果
      </h1>

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
  )
}