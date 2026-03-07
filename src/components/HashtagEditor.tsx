"use client"

import { useState } from "react"

type Props = {
  value: string[]
  onChange: (tags: string[]) => void
}

export default function HashtagEditor({ value, onChange }: Props) {

  const addTag = () => {
    onChange([...value, ""])
  }

  const updateTag = (index: number, text: string) => {

    const newTags = [...value]
    newTags[index] = text.replace("#", "")
    onChange(newTags)

  }

  const removeTag = (index: number) => {

    const newTags = value.filter((_, i) => i !== index)
    onChange(newTags)

  }

  const moveTag = (index: number, direction: "up" | "down") => {

    const newTags = [...value]

    const target =
      direction === "up" ? index - 1 : index + 1

    if (target < 0 || target >= newTags.length) return

    const temp = newTags[index]
    newTags[index] = newTags[target]
    newTags[target] = temp

    onChange(newTags)
  }

  return (

    <div className="space-y-3">

      {value.map((tag, index) => (

        <div
          key={index}
          className="flex items-center gap-2"
        >

          {/* 並び替え */}
          <button
            type="button"
            onClick={() => moveTag(index, "up")}
            className="text-lg opacity-60 hover:opacity-100"
          >
            ︙
          </button>

          {/* 入力 */}
          <input
            type="text"
            value={tag}
            placeholder="ハッシュタグ"
            onChange={(e) =>
              updateTag(index, e.target.value)
            }
            className="flex-1 bg-[var(--sub-background)] rounded-xl px-3 py-2"
          />

          {/* 削除 */}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="text-red-500"
          >
            🗑
          </button>

        </div>

      ))}

      <button
        type="button"
        onClick={addTag}
        className="text-sm opacity-70 hover:opacity-100"
      >
        ＋ハッシュタグ
      </button>

    </div>

  )
}