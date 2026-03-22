"use client"

import { useState } from "react"
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  increment,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useAuthState } from "react-firebase-hooks/auth"

import { DndContext, closestCenter } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type LinkItem = {
  id: string
  label: string
  url: string
}

type HashtagItem = {
  id: string
  tag: string
}

function SortableItem({
  link,
  updateLink,
  removeLink,
}: {
  link: LinkItem
  updateLink: (id: string, key: "label" | "url", value: string) => void
  removeLink: (id: string) => void
}) {

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: link.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 bg-[var(--sub-background)] p-3 rounded-xl"
    >
      <div {...attributes} {...listeners} className="cursor-grab pt-2 opacity-60">
        ︙
      </div>

      <div className="flex-1 space-y-2">
        <input
          className="w-full p-2 rounded-lg bg-white"
          placeholder="サイト名"
          value={link.label}
          onChange={(e) =>
            updateLink(link.id, "label", e.target.value)
          }
        />
        <input
          className="w-full p-2 rounded-lg bg-white"
          placeholder="URL"
          value={link.url}
          onChange={(e) =>
            updateLink(link.id, "url", e.target.value)
          }
        />
      </div>

      <button
        onClick={() => removeLink(link.id)}
        className="text-red-500 pt-2"
      >
        🗑
      </button>
    </div>
  )
}

function SortableHashtagItem({
  tag,
  updateTag,
  removeTag,
}: {
  tag: HashtagItem
  updateTag: (id: string, value: string) => void
  removeTag: (id: string) => void
}) {

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: tag.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-[var(--sub-background)] p-3 rounded-xl"
    >
      <div {...attributes} {...listeners} className="cursor-grab opacity-60">
        ︙
      </div>

      <input
        className="flex-1 p-2 rounded-lg bg-white"
        placeholder="#タグ"
        value={tag.tag}
        onChange={(e) =>
          updateTag(tag.id, e.target.value)
        }
      />

      <button
        onClick={() => removeTag(tag.id)}
        className="text-red-500"
      >
        🗑
      </button>
    </div>
  )
}

export default function UploadPage() {

  const router = useRouter()
  const [user, loadingAuth] = useAuthState(auth)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [skinType, setSkinType] = useState<"classic" | "slim">("classic")

  const [usagePermission, setUsagePermission] =
    useState<"allowed" | "disallowed">("allowed")

  const [editPermission, setEditPermission] =
    useState<"allowed" | "disallowed">("disallowed")

  const [links, setLinks] = useState<LinkItem[]>([])
  const [hashtags, setHashtags] = useState<HashtagItem[]>([])

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const isInvalid = (value: any) =>
    submitted && (!value || value === "")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const addHashtag = () => {
    setHashtags([
      ...hashtags,
      { id: crypto.randomUUID(), tag: "" },
    ])
  }

  const updateTag = (id: string, value: string) => {
    setHashtags(
      hashtags.map((t) =>
        t.id === id ? { ...t, tag: value } : t
      )
    )
  }

  const removeTag = (id: string) => {
    setHashtags(hashtags.filter((t) => t.id !== id))
  }

  const handleDragEnd = (event: any) => {

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndexLinks = links.findIndex((l) => l.id === active.id)
    const newIndexLinks = links.findIndex((l) => l.id === over.id)

    if (oldIndexLinks !== -1 && newIndexLinks !== -1) {
      setLinks(arrayMove(links, oldIndexLinks, newIndexLinks))
      return
    }

    const oldIndexTags = hashtags.findIndex((t) => t.id === active.id)
    const newIndexTags = hashtags.findIndex((t) => t.id === over.id)

    if (oldIndexTags !== -1 && newIndexTags !== -1) {
      setHashtags(arrayMove(hashtags, oldIndexTags, newIndexTags))
    }
  }

  const addLink = () => {
    setLinks([
      ...links,
      { id: crypto.randomUUID(), label: "", url: "" },
    ])
  }

  const updateLink = (
    id: string,
    key: "label" | "url",
    value: string
  ) => {
    setLinks(
      links.map((link) =>
        link.id === id ? { ...link, [key]: value } : link
      )
    )
  }

  const removeLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id))
  }

  const uploadToCloudinary = async (file: File) => {

    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "FujiSkinLab_cloudinary")

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/djmhhxvib/image/upload",
      {
        method: "POST",
        body: formData,
      }
    )

    const data = await res.json()

    if (!res.ok || !data.secure_url) {
      throw new Error("Cloudinary upload failed")
    }

    return data.secure_url
  }

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault()
    setSubmitted(true)

    if (!title || !file) return

    try {

      setLoading(true)

      const imageUrl = await uploadToCloudinary(file)

      // ハッシュタグ正規化
      const cleanedTags = hashtags
        .map((t) => t.tag.trim().toLowerCase().replace(/^#/, ""))
        .filter((t) => t !== "")

      const uniqueTags = Array.from(new Set(cleanedTags))

      // スキン保存
      await addDoc(collection(db, "skins"), {
        title,
        description,
        imageUrl,
        skinType,
        creatorId: user?.uid,
        creatorName: user?.displayName,
        creatorPhotoURL: user?.photoURL || "",
        usagePermission,
        editPermission:
          usagePermission === "allowed"
            ? editPermission
            : null,
        links,

        hashtags: uniqueTags.map((tag) => ({
          id: crypto.randomUUID(),
          tag,
        })),

        tags: uniqueTags,

        viewCount: 0,
        likeCount: 0,
        downloadCount: 0,
        createdAt: serverTimestamp(),
      })

      // ★ tagStats更新
      for (const tag of uniqueTags) {

        const ref = doc(db, "tagStats", tag)

        await setDoc(
          ref,
          {
            tag,
            count: increment(1),
            recentCount: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }

      router.push("/")

    } catch (err) {

      console.error(err)
      alert("アップロード中にエラーが発生しました")

    } finally {
      setLoading(false)
    }
  }

  if (loadingAuth) return <p className="p-10">Loading...</p>
  if (!user) return <p className="p-10">ログインしてください</p>

  return (
    <div className="max-w-xl mx-auto mt-10 bg-[var(--sub-background)] p-8 rounded-2xl shadow space-y-6">

      <h1 className="text-2xl font-bold">
        スキンをアップロード
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="スキン名"
          className={`w-full p-3 rounded-xl bg-[var(--background)] border-2 ${
            isInvalid(title)
              ? "border-[var(--accent)]"
              : "border-transparent"
          }`}
        />

        {/* ハッシュタグ */}
        <div className="space-y-4">

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={hashtags.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {hashtags.map((tag) => (
                <SortableHashtagItem
                  key={tag.id}
                  tag={tag}
                  updateTag={updateTag}
                  removeTag={removeTag}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addHashtag}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl"
          >
            ＋ハッシュタグを追加
          </button>

        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="説明（任意）"
          className="w-full p-3 rounded-xl bg-[var(--background)]"
        />

        <input
          type="file"
          accept="image/png"
          onChange={handleFileChange}
          className={`w-full p-3 rounded-xl bg-[var(--background)] border-2 ${
            isInvalid(file)
              ? "border-[var(--accent)]"
              : "border-transparent"
          }`}
        />

        {/* スキンタイプ */}
        <div className="space-y-2">
          <p className="text-sm opacity-70">スキンタイプ</p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setSkinType("classic")}
              className={`px-4 py-2 rounded-xl ${skinType === "classic"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--background)]"
                }`}
            >
              Classic
            </button>

            <button
              type="button"
              onClick={() => setSkinType("slim")}
              className={`px-4 py-2 rounded-xl ${skinType === "slim"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--background)]"
                }`}
            >
              Slim
            </button>
          </div>
        </div>

        {/* 使用許可 */}
        <div className="space-y-2">
          <p className="text-sm opacity-70">使用設定</p>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setUsagePermission("allowed")}
              className={`px-4 py-2 rounded-xl ${usagePermission === "allowed"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--background)]"
                }`}
            >
              使用OK
            </button>

            <button
              type="button"
              onClick={() => setUsagePermission("disallowed")}
              className={`px-4 py-2 rounded-xl ${usagePermission === "disallowed"
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--background)]"
                }`}
            >
              使用NG
            </button>
          </div>
        </div>

        {/* 加工許可（使用OKのときだけ） */}
        {usagePermission === "allowed" && (
          <div className="space-y-2">
            <p className="text-sm opacity-70">加工設定</p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setEditPermission("allowed")}
                className={`px-4 py-2 rounded-xl ${editPermission === "allowed"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--background)]"
                  }`}
              >
                加工OK
              </button>

              <button
                type="button"
                onClick={() => setEditPermission("disallowed")}
                className={`px-4 py-2 rounded-xl ${editPermission === "disallowed"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--background)]"
                  }`}
              >
                加工NG
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--accent)] text-white rounded-xl"
        >
          {loading ? "アップロード中..." : "アップロード"}
        </button>

      </form>

    </div>
  )
}