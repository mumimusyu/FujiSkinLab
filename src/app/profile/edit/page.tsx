"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"
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
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab select-none pt-2 opacity-60"
      >
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

export default function EditProfilePage() {
  const user = auth.currentUser
  const router = useRouter()

  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [links, setLinks] = useState<LinkItem[]>([])

  useEffect(() => {
    if (!user) return

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid))
      if (snap.exists()) {
        const data = snap.data()
        setDisplayName(data.displayName || "")
        setBio(data.bio || "")
        setLinks(data.links || [])
      }
    }

    fetchUser()
  }, [user])

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = links.findIndex((l) => l.id === active.id)
    const newIndex = links.findIndex((l) => l.id === over.id)

    setLinks(arrayMove(links, oldIndex, newIndex))
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

  const handleSave = async () => {
    if (!user) return

    await updateDoc(doc(db, "users", user.uid), {
      displayName,
      bio,
      links,
    })

    router.push(`/users/${user.uid}`)
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">

      <div className="bg-white rounded-2xl shadow p-8 space-y-8">

        {/* ヘッダー行 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            プロフィール編集
          </h1>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[var(--accent)] text-white rounded-xl"
          >
            保存
          </button>
        </div>

        {/* 表示名 */}
        <div className="space-y-2">
          <p className="text-sm opacity-70">表示名</p>
          <input
            className="w-full p-3 rounded-xl bg-[var(--sub-background)]"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* 説明 */}
        <div className="space-y-2">
          <p className="text-sm opacity-70">説明</p>
          <textarea
            className="w-full p-3 rounded-xl bg-[var(--sub-background)]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* URL編集 */}
        <div className="space-y-4">
          <p className="text-sm opacity-70">リンク</p>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={links.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {links.map((link) => (
                  <SortableItem
                    key={link.id}
                    link={link}
                    updateLink={updateLink}
                    removeLink={removeLink}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <button
            onClick={addLink}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl"
          >
            ＋URLを追加
          </button>
        </div>

      </div>
    </div>
  )
}