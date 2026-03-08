"use client"

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

type Props = {
  userData: UserData
  children?: React.ReactNode
}

export default function ProfileCard({ userData, children }: Props) {

  const cleanName =
    userData.displayName?.replace(/"/g, "") || "No Name"

  return (

    <div className="bg-white rounded-2xl p-8 shadow-sm flex gap-6">

      <img
        src={userData.photoURL || "/default-icon.png"}
        className="w-24 h-24 rounded-full object-cover"
      />

      <div className="flex-1 space-y-2">

        <h1 className="text-2xl font-bold">
          {cleanName}
        </h1>

        {userData.bio && (
          <p className="text-sm opacity-80">
            {userData.bio}
          </p>
        )}

        {userData.links && userData.links.length > 0 && (

          <div className="space-y-1 pt-1">

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

        {children}

      </div>

    </div>

  )
}