export type Hashtag = {
  id: string
  tag: string
}

export type Skin = {
  id: string
  title: string
  imageUrl: string

  skinType: "classic" | "slim"

  creatorId: string
  creatorName?: string
  creatorPhotoURL?: string

  createdAt?: any

  viewCount?: number
  likeCount?: number
  downloadCount?: number

  hashtags?: Hashtag[]

  dailyViews?: {
    [date: string]: number
  }
}