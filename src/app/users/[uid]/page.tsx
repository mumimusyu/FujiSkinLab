"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useAuthState } from "react-firebase-hooks/auth"
import SkinCard from "@/components/SkinCard"
import OwnerEditButton from "@/components/OwnerEditButton"

type LinkItem = {
  id: string
  label: string
  url: string
}

type Skin = {
  id: string
  title: string
  imageUrl: string
  creatorId: string
  creatorName: string
  skinType: "classic" | "slim"
}

type UserData = {
  displayName?: string
  photoURL?: string
  bio?: string
  links?: LinkItem[]
}

export default function UserProfile() {
  const params = useParams()
  const uid = params.uid as string

  const [authUser, loadingAuth] = useAuthState(auth)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [skins, setSkins] = useState<Skin[]>([])
  const [loading, setLoading] = useState(true)

  const isOwner = authUser?.uid === uid

  useEffect(() => {
    if (!uid) return

    const fetchData = async () => {
      try {
        // ユーザー取得
        const userSnap = await getDoc(doc(db, "users", uid))

        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData)
        } else if (isOwner) {
          // 自分なのにドキュメントが無い場合
          setUserData({
            displayName: authUser?.displayName || "No Name",
            photoURL: authUser?.photoURL || "",
          })
        } else {
          setUserData(null)
        }

        // スキン取得
        const q = query(
          collection(db, "skins"),
          where("creatorId", "==", uid)
        )

        const snap = await getDocs(q)

        const list: Skin[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Skin, "id">),
        }))

        setSkins(list)
      } catch (e) {
        console.error(e)
        setUserData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [uid, isOwner, authUser])

  const handleDelete = async (skinId: string) => {
    const confirmDelete = confirm("本当に消しますか？")
    if (!confirmDelete) return

    await deleteDoc(doc(db, "skins", skinId))
    setSkins((prev) => prev.filter((s) => s.id !== skinId))
  }

  if (loadingAuth || loading)
    return <p className="p-10">Loading...</p>

  if (!userData)
    return <p className="p-10">ユーザーが見つかりません</p>

  const cleanName =
    userData.displayName?.replace(/"/g, "") || "No Name"

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-10">

      <div className="bg-white rounded-2xl p-8 shadow-sm flex gap-6">

        <img
          src={userData.photoURL || "/default-icon.png"}
          className="w-24 h-24 rounded-full object-cover"
        />

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{cleanName}</h1>
            {isOwner && <OwnerEditButton profileUid={uid} />}
          </div>

          {userData.bio && (
            <p className="text-sm opacity-80">{userData.bio}</p>
          )}

          {userData.links && userData.links.length > 0 && (
            <div className="space-y-2 mt-4">
              {userData.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[var(--accent)]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6">
          投稿したスキン
        </h2>

        {skins.length === 0 ? (
          <p className="opacity-60">まだ投稿がありません</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {skins.map((skin) => (
              <div key={skin.id} className="relative">
                <SkinCard skin={skin} />
                {isOwner && (
                  <button
                    onClick={() => handleDelete(skin.id)}
                    className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}