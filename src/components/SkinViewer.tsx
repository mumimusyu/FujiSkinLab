"use client"

import { useEffect, useRef } from "react"
import * as skinview3d from "skinview3d"
import { SKIN_VIEWER_CONFIG } from "@/lib/skinViewerConfig"

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const viewerRef = useRef<skinview3d.SkinViewer | null>(null)

  // ===== Viewer初期化（1回のみ） =====
  useEffect(() => {

    const canvas = canvasRef.current
    if (!canvas) return

    // ★既に初期化済みなら何もしない（StrictMode対策）
    if (viewerRef.current) return

    try {

      const viewer = new skinview3d.SkinViewer({
        canvas: canvas,
        width: mode === "detail" ? 300 : 180,
        height: mode === "detail" ? 400 : 240,
      })

      // ===== 角度設定 =====
      viewer.controls.enableZoom = false
      viewer.controls.enablePan = false
      viewer.controls.enableRotate = mode !== "card"

      const config =
        mode === "detail"
          ? SKIN_VIEWER_CONFIG.detail
          : SKIN_VIEWER_CONFIG.thumbnail

      viewer.zoom = config.zoom
      viewer.fov = config.fov
      viewer.playerObject.rotation.y = config.rotationY
      viewer.playerObject.rotation.x = config.rotationX

      viewerRef.current = viewer

    } catch (err) {
      console.error("SkinViewer init error:", err)
    }

    return () => {

      if (viewerRef.current) {
        try {
          viewerRef.current.dispose()
        } catch { }
        viewerRef.current = null
      }
    }

  }, [mode])

  // ===== スキン読み込み（URL変更時） =====
  useEffect(() => {

    const viewer = viewerRef.current
    if (!viewer) return
    if (!skinUrl) return

    try {
      viewer.loadSkin(skinUrl, {
        model: skinType === "slim" ? "slim" : "default",
      })
    } catch (err) {
      console.error("Skin load error:", err)
    }

  }, [skinUrl, skinType])

  return (
    <canvas
      ref={canvasRef}
      width={mode === "detail" ? 300 : 180}
      height={mode === "detail" ? 400 : 240}
      style={{
        width: mode === "detail" ? 300 : 180,
        height: mode === "detail" ? 400 : 240,
      }}
    />
  )
}