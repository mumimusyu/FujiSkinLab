"use client"

import { useEffect, useRef } from "react"
import * as skinview3d from "skinview3d"

type Props = {
  skinUrl: string
  skinType: "classic" | "slim"
  mode?: "detail" | "card"
}

export default function SkinViewer({
  skinUrl,
  skinType,
  mode = "detail",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<skinview3d.SkinViewer | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    if (viewerRef.current) {
      viewerRef.current.dispose()
    }

    const viewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width: mode === "detail" ? 300 : 180,
      height: mode === "detail" ? 400 : 240,
    })

    viewerRef.current = viewer

    // 共通設定
    viewer.controls.enableZoom = false
    viewer.controls.enablePan = false
    viewer.zoom = 1.0
    viewer.fov = 30

    if (mode === "card") {
      // 一覧カードは完全固定
      viewer.controls.enableRotate = false
      viewer.playerObject.rotation.y = Math.PI / 8
      viewer.playerObject.rotation.x = Math.PI / 12
    } else {
      // 詳細ページはドラッグ回転可
      viewer.controls.enableRotate = true
      viewer.playerObject.rotation.y = Math.PI / 8
      viewer.playerObject.rotation.x = Math.PI / 12
    }

    if (skinUrl) {
      viewer.loadSkin(skinUrl, {
        model: skinType === "slim" ? "slim" : "default",
      })
    }

    return () => {
      viewer.dispose()
    }
  }, [skinUrl, skinType, mode])

  return <canvas ref={canvasRef} />
}