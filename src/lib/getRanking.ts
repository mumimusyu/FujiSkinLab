import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skin } from "@/types/skin"

export const getYesterdayKey = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")

  return `${y}-${m}-${day}`
}

export const getRanking = async (): Promise<Skin[]> => {

  const snap = await getDocs(collection(db, "skins"))

  const all: Skin[] = snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Skin, "id">),
  }))

  const key = getYesterdayKey()

  return all
    .map(s => ({
      ...s,
      yesterdayViews: s.dailyViews?.[key] || 0,
    }))
    .sort((a, b) => b.yesterdayViews - a.yesterdayViews)
    .slice(0, 10)
}