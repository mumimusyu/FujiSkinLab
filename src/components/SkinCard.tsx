"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import SkinViewer from "./SkinViewer"
import { Skin } from "../types/skin"

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
    creatorId,
    creatorName,
    skinType,
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


  if (!id) return null


  return (

    <Link href={`/skins/${id}`}>

      <div className="bg-[var(--sub-background)] rounded-2xl p-4 hover:shadow-lg transition">

        <div className="bg-white rounded-2xl p-4 mb-4">

          <div className="flex justify-center">

            <SkinViewer
              skinUrl={imageUrl}
              skinType={skinType}
              mode="card"
            />

          </div>

        </div>


        <div className="space-y-2">

          <div className="flex items-center gap-3 text-xs opacity-60">

            <span>
              {getTimeAgo(skin.createdAt)}
            </span>

            <div className="flex items-center gap-1">
              <span>👁</span>
              <span>{skin.viewCount || 0}</span>
            </div>

            <span className="flex items-center gap-1">
              ♡ {skin.likeCount || 0}
            </span>

            <span className="flex items-center gap-1">
              ⬇ {skin.downloadCount || 0}
            </span>

          </div>

          {skin.hashtags && skin.hashtags.length > 0 && (
            <div className="text-xs opacity-60 overflow-hidden text-ellipsis whitespace-nowrap">
              {skin.hashtags?.map((tagObj: { id: string; tag: string }) => (
                <span key={tagObj.id} className="mr-2">
                  #{tagObj.tag}
                </span>
              ))}
            </div>
          )}

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