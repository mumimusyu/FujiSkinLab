"use client"

import { useEffect, useState, useRef } from "react"
import { db } from "@/lib/firebase"
import { useParams, useRouter } from "next/navigation"
import SkinViewer from "@/components/SkinViewer"
import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase"
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  increment,
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

  hashtags?: Hashtag[]
}

export default function SkinDetail() {

  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [skin, setSkin] = useState<Skin | null>(null)
  const [liked, setLiked] = useState(false)

  const [user, loading] = useAuthState(auth)
  const countedRef = useRef(false)

  // ===== スキン取得 + 閲覧数（安全化） =====
  useEffect(() => {

    if (!id || loading) return

    const fetchSkin = async () => {

      const skinRef = doc(db, "skins", id)
      const snap = await getDoc(skinRef)

      if (snap.exists()) {

        const data = snap.data()

        // ★ データ正規化（UI崩れ防止）
        setSkin({
          title: data.title ?? "",
          description: data.description ?? "",
          imageUrl: data.imageUrl ?? "",
          skinType: data.skinType ?? "classic",
          creatorName: data.creatorName ?? "不明",
          creatorId: data.creatorId ?? "",
          creatorPhotoURL: data.creatorPhotoURL ?? "",
          usagePermission: data.usagePermission ?? "disallowed",
          editPermission: data.editPermission ?? null,
          createdAt: data.createdAt ?? null,
          links: data.links ?? [],
          viewCount: data.viewCount ?? 0,
          likeCount: data.likeCount ?? 0,
          downloadCount: data.downloadCount ?? 0,
          hashtags: data.hashtags ?? [],
        })

        // ===== 閲覧数処理 =====
        if (!countedRef.current) {

          countedRef.current = true

          const today = (() => {
            const d = new Date()
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, "0")
            const day = String(d.getDate()).padStart(2, "0")
            return `${y}-${m}-${day}`
          })()

          const viewKey = `viewed_${id}_${today}`

          if (localStorage.getItem(viewKey)) return
          localStorage.setItem(viewKey, "1")

          const sessionId =
            localStorage.getItem("sessionId") ||
            crypto.randomUUID()

          localStorage.setItem("sessionId", sessionId)

          const viewRef = doc(db, "skins", id, "views", sessionId)

          try {

            const viewSnap = await getDoc(viewRef)
            if (!viewSnap.exists()) {

              await setDoc(viewRef, {
                createdAt: serverTimestamp(),
              })

              await runTransaction(db, async (tx) => {
                const freshSnap = await tx.get(skinRef)
                if (!freshSnap.exists()) return

                tx.update(skinRef, {
                  viewCount: increment(1),
                  [`dailyViews.${today}`]: increment(1),
                })
              })
            }

          } catch (e) {
            console.warn("view increment skipped", e)
          }
        }
      }
    }

    fetchSkin()

  }, [id, loading])


  // ===== いいね状態確認 =====
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


  // ===== いいね（トランザクション化） =====
  const toggleLike = async () => {

    if (!user) {
      alert("ログインしてください")
      return
    }

    const skinRef = doc(db, "skins", id)
    const likeRef = doc(db, "skins", id, "likes", user.uid)

    await runTransaction(db, async (tx) => {

      const likeSnap = await tx.get(likeRef)

      if (likeSnap.exists()) {

        tx.delete(likeRef)
        tx.update(skinRef, {
          likeCount: increment(-1),
        })

        setLiked(false)

        setSkin(prev =>
          prev
            ? { ...prev, likeCount: (prev.likeCount || 1) - 1 }
            : prev
        )

      } else {

        tx.set(likeRef, {
          createdAt: serverTimestamp(),
        })

        tx.update(skinRef, {
          likeCount: increment(1),
        })

        setLiked(true)

        setSkin(prev =>
          prev
            ? { ...prev, likeCount: (prev.likeCount || 0) + 1 }
            : prev
        )
      }
    })
  }


  // ===== ダウンロード =====
  const handleDownload = async () => {

    try {

      const skinRef = doc(db, "skins", id)

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(skinRef)
        if (!snap.exists()) return

        tx.update(skinRef, {
          downloadCount: increment(1),
        })
      })

      setSkin(prev =>
        prev
          ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 }
          : prev
      )

      const res = await fetch(skin.imageUrl)
      const blob = await res.blob()

      const url = window.URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `${skin.title}.png`
      a.click()

      window.URL.revokeObjectURL(url)

    } catch (err) {

      console.error(err)
      alert("ダウンロードに失敗しました")

    }
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


      <div className="bg-[var(--sub-background)] rounded-2xl p-8 relative space-y-6">

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


        {/* ハッシュタグ */}
        {skin.hashtags && skin.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {skin.hashtags.map((tagObj, i) => (
              <span
                key={tagObj.id || i}
                onClick={() =>
                  router.push(`/search?q=${encodeURIComponent("#" + tagObj.tag)}`)
                }
                className="cursor-pointer hover:underline text-sm"
              >
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


        {/* ★ 常に表示 */}
        <p className="text-sm leading-relaxed pt-2">
          {skin.description || "説明なし"}
        </p>


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
            <button
              onClick={handleDownload}
              className="bg-accent text-white px-6 py-2 rounded-xl"
            >
              ダウンロード
            </button>
          </div>
        )}

      </div>

    </div>
  )
}