"use client"

import { useEffect, useState } from "react"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import SkinCard from "@/components/SkinCard"

import { Skin } from "../types/skin"

export default function Home() {
  const [skins, setSkins] = useState<Skin[]>([])

  useEffect(() => {
    const fetchSkins = async () => {

      const q = query(
        collection(db, "skins"),
        orderBy("createdAt", "desc")
      )

      const querySnapshot = await getDocs(q)

      const data: Skin[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Skin, "id">),
      }))

      setSkins(data)
    }

    fetchSkins()
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {skins.map((skin) => (
        <SkinCard
          key={skin.id}
          skin={skin}
        />
      ))}
    </div>
  )
}