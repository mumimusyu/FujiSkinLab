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

    // ===== SSR対策 =====
    if (typeof window === "undefined") return

    // ===== canvas未生成対策（最重要）=====
    if (!canvasRef.current) return

    // ===== StrictMode / 再描画対策 =====
    if (viewerRef.current) {
      viewerRef.current.dispose()
      viewerRef.current = null
    }

    // ===== viewer生成 =====
    const viewer = new skinview3d.SkinViewer({
      canvas: canvasRef.current,
      width: mode === "detail" ? 300 : 180,
      height: mode === "detail" ? 400 : 240,
    })

    viewerRef.current = viewer

    // ===== 共通設定 =====
    viewer.controls.enableZoom = false
    viewer.controls.enablePan = false
    viewer.zoom = 1.0
    viewer.fov = 30

    // ===== モード別設定 =====
    if (mode === "card") {
      viewer.controls.enableRotate = false
    } else {
      viewer.controls.enableRotate = true
    }

    viewer.playerObject.rotation.y = Math.PI / 8
    viewer.playerObject.rotation.x = Math.PI / 12

    // ===== スキン読み込み =====
    if (skinUrl) {
      viewer.loadSkin(skinUrl, {
        model: skinType === "slim" ? "slim" : "default",
      })
    }

    // ===== クリーンアップ =====
    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose()
        viewerRef.current = null
      }
    }

  }, [skinUrl, skinType, mode])

  return <canvas ref={canvasRef} />
}