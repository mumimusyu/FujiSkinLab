"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserData(docSnap.data())
        }
      }
    })

    return () => unsubscribe()
  }, [])

  if (!userData) {
    return <p>Loading...</p>
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm max-w-lg">
      <img
        src={userData.photoURL}
        alt="avatar"
        className="w-20 h-20 rounded-full mb-4"
      />
      <h2 className="text-xl font-bold">{userData.displayName}</h2>
    </div>
  )
}