"use client"

import { useState } from "react"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import SkinCard from "@/components/SkinCard"

export default function SearchPage() {

  const [keyword, setKeyword] = useState("")
  const [skins, setSkins] = useState<any[]>([])

  const search = async () => {

    if (!keyword) return

    const q = query(
      collection(db, "skins"),
      where("searchKeywords", "array-contains", keyword)
    )

    const snap = await getDocs(q)

    const result = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    setSkins(result)
  }

  return (

    <div className="max-w-5xl mx-auto mt-10 space-y-8">

      <div className="flex gap-3">

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="スキン検索"
          className="flex-1 p-3 rounded-xl border"
        />

        <button
          onClick={search}
          className="px-6 bg-[var(--accent)] text-white rounded-xl"
        >
          検索
        </button>

      </div>

      <div className="grid grid-cols-3 gap-6">

        {skins.map((skin) => (
          <SkinCard key={skin.id} skin={skin} />
        ))}

      </div>

    </div>
  )
}