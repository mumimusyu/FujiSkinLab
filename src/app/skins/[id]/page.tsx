"use client"

import { useEffect, useState, useRef } from "react"
import { db } from "@/lib/firebase"
import { useParams } from "next/navigation"
import SkinViewer from "@/components/SkinViewer"
import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"

type LinkItem = {
  id: string
  label: string
  url: string
}

type Hashtag = {
  id: string
  tag: string
}

type Skin = {
  title: string
  description?: string
  imageUrl: string
  skinType: "classic" | "slim"
  creatorName: string
  creatorId: string
  creatorPhotoURL?: string
  usagePermission: "allowed" | "disallowed"
  editPermission?: "allowed" | "disallowed" | null
  createdAt?: any
  links?: LinkItem[]

  viewCount?: number
  likeCount?: number
  downloadCount?: number

  hashtags?: string[]
}

export default function SkinDetail() {

  const params = useParams()
  const id = params.id as string

  const [skin, setSkin] = useState<Skin | null>(null)
  const [liked, setLiked] = useState(false)

  const [user] = useAuthState(auth)
  const countedRef = useRef(false)

  // スキン取得 + 閲覧数
  useEffect(() => {

    const fetchSkin = async () => {

      const skinRef = doc(db, "skins", id)
      const snap = await getDoc(skinRef)

      if (snap.exists()) {

        setSkin(snap.data() as Skin)

        // まだカウントしていない場合のみ
        if (!countedRef.current) {

          countedRef.current = true

          await updateDoc(skinRef, {
            viewCount: increment(1),
          })
        }
      }
    }

    if (id) fetchSkin()

  }, [id])


  // いいね状態確認
  useEffect(() => {

    if (!user) return

    const checkLike = async () => {

      const likeRef = doc(db, "skins", id, "likes", user.uid)
      const snap = await getDoc(likeRef)

      setLiked(snap.exists())
    }

    checkLike()

  }, [user, id])


  if (!skin) return <p className="p-10">Loading...</p>

  const createdDate =
    skin.createdAt?.toDate
      ? skin.createdAt.toDate().toLocaleDateString("ja-JP")
      : ""

  const usageText =
    skin.usagePermission === "allowed"
      ? `使用OK / ${skin.editPermission === "allowed"
        ? "加工OK"
        : "加工NG"
      }`
      : "使用NG"

  const skinTypeLabel =
    skin.skinType === "classic" ? "Classic" : "Slim"


  const toggleLike = async () => {

    if (!user) {
      alert("ログインしてください")
      return
    }

    const likeRef = doc(db, "skins", id, "likes", user.uid)
    const skinRef = doc(db, "skins", id)

    const snap = await getDoc(likeRef)

    if (snap.exists()) {

      await deleteDoc(likeRef)

      await updateDoc(skinRef, {
        likeCount: increment(-1),
      })

      setLiked(false)

      setSkin(prev =>
        prev ? { ...prev, likeCount: (prev.likeCount || 1) - 1 } : prev
      )

    } else {

      await setDoc(likeRef, {
        createdAt: serverTimestamp(),
      })

      await updateDoc(skinRef, {
        likeCount: increment(1),
      })

      setLiked(true)

      setSkin(prev =>
        prev ? { ...prev, likeCount: (prev.likeCount || 0) + 1 } : prev
      )
    }
  }
  const handleDownload = async () => {

    const skinRef = doc(db, "skins", id)

    await updateDoc(skinRef, {
      downloadCount: increment(1)
    })

    setSkin(prev =>
      prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : prev
    )

    const link = document.createElement("a")
    link.href = skin.imageUrl
    link.download = `${skin.title}.png`
    link.click()
  }


  return (

    <div className="max-w-4xl mx-auto mt-10 space-y-8">

      <div className="relative bg-white rounded-2xl p-10 shadow-sm flex justify-center">

        <div className="absolute top-6 right-6 flex flex-col items-end gap-2">

          <span className="bg-accent text-white text-sm px-4 py-1 rounded-full">
            {usageText}
          </span>

          <span className="bg-accent text-white text-sm px-4 py-1 rounded-full">
            {skinTypeLabel}
          </span>

        </div>

        {skin.imageUrl && (
          <SkinViewer
            skinUrl={skin.imageUrl}
            skinType={skin.skinType}
            mode="detail"
          />
        )}

      </div>


      <div className="bg-[#f5f0dc] rounded-2xl p-8 relative space-y-6">

        <div className="flex items-center gap-4 text-sm opacity-60">

          <span>{createdDate}</span>

          <div className="flex items-center gap-1">
            <span>👁</span>
            <span>{skin.viewCount || 0}</span>
          </div>

          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 transition ${liked
              ? "text-[var(--accent)]"
              : "text-gray-400"
              }`}
          >
            <span>♡</span>
            <span>{skin.likeCount || 0}</span>
          </button>

          <div className="flex items-center gap-1">
            <span>⬇</span>
            <span>{skin.downloadCount || 0}</span>
          </div>

        </div>

        {skin.hashtags && skin.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {skin.hashtags.map((tagObj: any, i: number) => (
              <span key={tagObj.id || i}>
                #{tagObj.tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl font-bold">
          {skin.title}
        </h1>

        <div className="flex items-center gap-3">

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

          <Link
            href={`/users/${skin.creatorId}`}
            className="hover:underline"
          >
            {skin.creatorName}
          </Link>

        </div>


        {skin.description && (
          <p className="text-sm leading-relaxed pt-2">
            {skin.description}
          </p>
        )}


        {skin.links && skin.links.length > 0 && (

          <div className="pt-4 space-y-2">

            <p className="text-sm font-medium opacity-70">
              関連リンク
            </p>

            {skin.links.map((link) => (

              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[var(--accent)] hover:underline text-sm"
              >
                {link.label}
              </a>

            ))}

          </div>

        )}


        {skin.usagePermission === "allowed" && (
          <div className="pt-4">
            <a
              href={skin.imageUrl.replace("/upload/", "/upload/fl_attachment/")}
              className="bg-accent text-white px-6 py-2 rounded-xl inline-block"
            >
              ダウンロード
            </a>
          </div>
        )}


      </div>

    </div>
  )
}