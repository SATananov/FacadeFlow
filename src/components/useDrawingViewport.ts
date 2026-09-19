import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

/** Visual coordinates only. The scaled page reserves its full scrollable area. */
export function useDrawingViewport(viewKey: string, initialMode: 'fit' | 'actual' = 'fit') {
  const viewportRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 1, height: 1, viewportWidth: 1, viewportHeight: 1 })
  const [manualZoom, setManualZoom] = useState(100)
  const [fit, setFit] = useState(initialMode === 'fit')
  const center = useRef<{ x: number; y: number } | null>(null)
  const fitScale = Math.min((size.viewportWidth - 32) / size.width, (size.viewportHeight - 32) / size.height, 1)
  const scale = fit ? Math.max(0.1, fitScale) : manualZoom / 100

  useLayoutEffect(() => {
    const viewport = viewportRef.current, canvas = canvasRef.current
    if (!viewport || !canvas) return
    const measure = () => setSize(previous => {
      const next = {
        width: canvas.offsetWidth, height: canvas.offsetHeight,
        viewportWidth: viewport.clientWidth, viewportHeight: viewport.clientHeight,
      }
      return Object.keys(next).every(key => next[key as keyof typeof next] === previous[key as keyof typeof next]) ? previous : next
    })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [viewKey])

  useLayoutEffect(() => {
    center.current = null
    setManualZoom(100)
    setFit(initialMode === 'fit')
  }, [viewKey, initialMode])
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    if (fit) viewport.scrollTo({ left: 0, top: 0 })
    else if (center.current) {
      viewport.scrollTo({
        left: Math.max(0, center.current.x * scale + Math.max(16, (viewport.clientWidth - size.width * scale) / 2) - viewport.clientWidth / 2),
        top: Math.max(0, center.current.y * scale + Math.max(16, (viewport.clientHeight - size.height * scale) / 2) - viewport.clientHeight / 2),
      })
      center.current = null
    }
  }, [scale, fit, size])

  const setZoom = (percent: number) => {
    const viewport = viewportRef.current
    if (viewport) center.current = {
      x: (viewport.scrollLeft + viewport.clientWidth / 2 - Math.max(16, (viewport.clientWidth - size.width * scale) / 2)) / scale,
      y: (viewport.scrollTop + viewport.clientHeight / 2 - Math.max(16, (viewport.clientHeight - size.height * scale) / 2)) / scale,
    }
    setManualZoom(Math.max(25, Math.min(300, Math.round(percent))))
    setFit(false)
  }
  return {
    viewportRef, canvasRef, fit, zoom: Math.round(scale * 100), setZoom,
    fitToView: () => { center.current = null; setFit(true) },
    spaceStyle: { width: Math.max(size.viewportWidth, size.width * scale + 32), height: Math.max(size.viewportHeight, size.height * scale + 32) } as CSSProperties,
    pageStyle: { width: size.width * scale, height: size.height * scale } as CSSProperties,
    canvasStyle: { transform: `scale(${scale})`, transformOrigin: 'top left' } as CSSProperties,
  }
}
