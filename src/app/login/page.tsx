"use client"

import { auth, db } from "@/lib/firebase"
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      const user = result.user

      // Firestoreにユーザーが存在するか確認
      const userRef = doc(db, "users", user.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        // 初回ログイン時のみ作成
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || "No Name",
          email: user.email || "",
          photoURL: user.photoURL || "",
          createdAt: new Date(),
        })
      }

      router.push("/")
    } catch (error) {
      console.error(error)
      alert("ログインに失敗しました")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[var(--sub-background)] p-10 rounded-2xl shadow-sm text-center space-y-6">
        <h1 className="text-2xl font-bold">
          FujiSkinLab にログイン
        </h1>

        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:opacity-90 transition"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  )
}