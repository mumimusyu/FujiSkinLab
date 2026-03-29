import { db } from "@/lib/firebase"
import {
  doc,
  updateDoc,
  increment,
  runTransaction,
  getDoc,
} from "firebase/firestore"

// 閲覧数（1人1回制御）
export const incrementView = async (skinId: string, userId?: string) => {
  const key = `viewed_${skinId}`

  // 未ログインでもlocalStorageで制御
  if (typeof window !== "undefined") {
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, "1")
  }

  const ref = doc(db, "skins", skinId)

  await updateDoc(ref, {
    viewCount: increment(1),
    dailyViews: increment(1),
  })
}

// ダウンロード
export const incrementDownload = async (skinId: string) => {
  const ref = doc(db, "skins", skinId)

  await updateDoc(ref, {
    downloadCount: increment(1),
  })
}

// いいね（トランザクションで安全化）
export const toggleLikeTx = async (
  skinId: string,
  userId: string
) => {
  const skinRef = doc(db, "skins", skinId)
  const likeRef = doc(db, "skins", skinId, "likes", userId)

  return await runTransaction(db, async (tx) => {
    const likeSnap = await tx.get(likeRef)

    if (likeSnap.exists()) {
      tx.delete(likeRef)
      tx.update(skinRef, {
        likeCount: increment(-1),
      })
      return false
    } else {
      tx.set(likeRef, { createdAt: new Date() })
      tx.update(skinRef, {
        likeCount: increment(1),
      })
      return true
    }
  })
}