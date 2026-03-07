"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import Link from "next/link"
import { onAuthStateChanged } from "firebase/auth"

type Props = {
  profileUid: string
}

export default function OwnerEditButton({ profileUid }: Props) {
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === profileUid) {
        setIsOwner(true)
      } else {
        setIsOwner(false)
      }
    })

    return () => unsubscribe()
  }, [profileUid])

  if (!isOwner) return null

  return (
    <Link
      href="/profile/edit"
      className="inline-block mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded-xl"
    >
      編集
    </Link>
  )
}