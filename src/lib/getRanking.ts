import {
  collection,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skin } from "@/types/skin"

export const getRanking = async (): Promise<Skin[]> => {

  const snap = await getDocs(collection(db, "skins"))

  const today = (() => {
    const d = new Date()
    d.setDate(d.getDate() - 1) // 昨日
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
  })()

  const skins: (Skin & { _views: number })[] = snap.docs.map(doc => {

    const data = doc.data() as Skin

    // idが含まれていた場合の保険（削除）
    const { id: _ignore, ...rest } = data as any

    const views =
      data.dailyViews?.[today] ?? 0

    return {
      id: doc.id,
      ...rest,
      _views: views,
    }
  })

  // 並び替え
  skins.sort((a, b) => b._views - a._views)

  // 上位10件
  return skins.slice(0, 10)
}