"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skin } from "../types/skin"
import { useRouter } from "next/navigation"

type Props = {
  skin: Skin
}

type CreatorData = {
  displayName?: string
  photoURL?: string
}

export default function SkinCard({ skin }: Props) {

  const {
    id,
    title,
    imageUrl,
    thumbnailUrl, // ★追加
    creatorId,
    creatorName,
  } = skin

  const [creator, setCreator] = useState<CreatorData | null>(null)

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return ""

    const date = timestamp.toDate()
    const diff = Date.now() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}分前`
    if (hours < 24) return `${hours}時間前`
    return `${days}日前`
  }

  useEffect(() => {
    const fetchCreator = async () => {
      const snap = await getDoc(doc(db, "users", creatorId))
      if (snap.exists()) {
        setCreator(snap.data() as CreatorData)
      }
    }
    if (creatorId) fetchCreator()
  }, [creatorId])

  const router = useRouter()

  if (!id) return null

  // ★ サムネイル優先
  const displayImage = thumbnailUrl || imageUrl

  return (
    <Link href={`/skins/${id}`}>

      <div className="bg-[var(--sub-background)] rounded-2xl p-4 hover:shadow-lg transition">

        {/* サムネイル */}
        <div className="bg-white rounded-2xl p-2 mb-4 flex items-end justify-center h-[200px]">
          <img
            src={displayImage}
            alt={title}
            className="h-full object-contain"
          />
        </div>

        <div className="space-y-2">

          {/* 投稿日だけ残す */}
          <div className="text-xs opacity-60">
            {getTimeAgo(skin.createdAt)}
          </div>

          <h2 className="font-semibold text-lg">
            {title}
          </h2>

          <div className="flex items-center gap-2 text-sm">
            <img
              src={
                typeof skin.creatorPhotoURL === "string" &&
                  skin.creatorPhotoURL.startsWith("http")
                  ? skin.creatorPhotoURL
                  : "/default-icon.png"
              }
              alt="creator"
              className="w-8 h-8 rounded-full object-cover"
            />

            <span className="opacity-80">
              {(creator?.displayName || creatorName || "unknown").replace(/"/g, "")}
            </span>
          </div>

        </div>

      </div>

    </Link>
  )
}