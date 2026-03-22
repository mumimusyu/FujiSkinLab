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

    <div className="bg-[var(--sub-background)] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-6">

      {/* アイコン */}
      <div className="flex justify-center sm:block">
        <img
          src={userData.photoURL || "/default-icon.png"}
          className="w-24 h-24 rounded-full object-cover"
        />
      </div>

      {/* 情報 */}
      <div className="flex-1 space-y-4">

        {/* 名前 */}
        <h1 className="text-xl sm:text-2xl font-bold break-all">
          {cleanName}
        </h1>

        {/* 説明 */}
        {userData.bio && (
          <div className="bg-[var(--background)] rounded-xl p-3 text-sm leading-relaxed">
            {userData.bio}
          </div>
        )}

        {/* リンク */}
        {userData.links && userData.links.length > 0 && (
          <div className="space-y-2">

            {userData.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[var(--accent)] text-sm break-all hover:underline"
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