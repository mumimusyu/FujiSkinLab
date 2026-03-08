"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ProfileCard from "@/components/ProfileCard"

type LinkItem = {
  id: string
  label: string
  url: string
}

type UserData = {
  displayName?: string
  photoURL?: string
  bio?: string
  links?: LinkItem[]
}

export default function ProfilePage() {

  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {

    const unsubscribe = auth.onAuthStateChanged(async (user) => {

      if (!user) return

      const docRef = doc(db, "users", user.uid)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData)
      }

    })

    return () => unsubscribe()

  }, [])


  if (!userData) {
    return <p>Loading...</p>
  }

  const cleanName =
    userData.displayName?.replace(/"/g, "") || "No Name"

  return (

    <ProfileCard userData={userData} />

  )
}