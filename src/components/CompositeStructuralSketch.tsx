import type { CSSProperties } from 'react'
import type { CompositeSketchProjection, SketchPart } from './compositeStructuralSketchProjection'
import './CompositeStructuralSketch.css'

function resolveZeroDividerAnchor(
  connection: Extract<CompositeSketchProjection, { status: 'ready' }>['connections'][number],
  partsById: ReadonlyMap<string, SketchPart>,
) {
  const from = partsById.get(connection.fromId)
  const to = partsById.get(connection.toId)
  if (!from || !to) return null

  // ZERO_DIVIDER remains an explicit relationship, never an inferred profile.
  // If a door participates, the visual marker belongs to the contacting door side.
  // Otherwise it is anchored to the geometrically later part so the relationship
  // still reads at the contact edge without inventing a new member.
  const anchor = from.function === 'door'
    ? from
    : to.function === 'door'
      ? to
      : from.x <= to.x ? to : from
  const other = anchor.id === from.id ? to : from
  const anchorSide: 'left' | 'right' = other.x <= anchor.x ? 'left' : 'right'
  const anchorX = anchorSide === 'left' ? anchor.x : anchor.x + anchor.width
  const overlapTop = Math.max(anchor.y, other.y)
  const overlapBottom = Math.min(anchor.y + anchor.height, other.y + other.height)
  const hasOverlap = overlapBottom > overlapTop

  return {
    anchor,
    anchorSide,
    anchorX,
    markerTop: hasOverlap ? overlapTop : anchor.y,
    markerBottom: hasOverlap ? overlapBottom : anchor.y + anchor.height,
  }
}

export function CompositeStructuralSketch({ projection, scale, offset }: {
  projection: CompositeSketchProjection
  scale: number
  offset: { xPx: number; yPx: number }
}) {
  if (projection.status !== 'ready') return <div className="composite-sketch-message" role="status">
    <b>{projection.message}</b>
    {projection.status === 'unresolved' && <p>Отвори „Структура на модула“ и подреди рамковите части.</p>}
  </div>

  const x = (value: number) => offset.xPx + value * scale
  const y = (value: number) => offset.yPx + value * scale
  const partsById = new Map(projection.parts.map((part) => [part.id, part]))

  return <div className="composite-sketch-layer" aria-label="Техническа скица на рамковите части · само преглед">
    <svg className="composite-sketch-connections" aria-label="Изрично зададени връзки">
      {projection.connections.map((connection) => {
        const resolved = resolveZeroDividerAnchor(connection, partsById)
        if (!resolved) return null
        const anchorXPx = x(resolved.anchorX)
        const markerTopPx = y(resolved.markerTop)
        const markerBottomPx = y(resolved.markerBottom)
        const direction = resolved.anchorSide === 'left' ? -1 : 1
        const markerXPx = anchorXPx + direction * 11
        const middleYPx = (markerTopPx + markerBottomPx) / 2
        const labelXPx = markerXPx + direction * 9
        const labelYPx = middleYPx

        return <g key={connection.id} data-connection-id={connection.id}
          data-from-id={connection.fromId} data-to-id={connection.toId}
          data-zero-divider-anchor-id={resolved.anchor.id}
          data-zero-divider-anchor-side={resolved.anchorSide}>
          <path className="composite-zero-divider-line" d={`M ${markerXPx} ${markerTopPx} V ${markerBottomPx}`} />
          <path className="composite-zero-divider-leader" d={`M ${markerXPx} ${middleYPx} H ${anchorXPx}`} />
          <text className="composite-zero-divider-label" x={labelXPx} y={labelYPx}
            textAnchor="middle" transform={`rotate(-90 ${labelXPx} ${labelYPx})`}>Нулев делител</text>
        </g>
      })}
    </svg>

    {projection.parts.map((part, index) => {
      // Presentation-only face width. It scales with the canvas but is deliberately
      // clamped and is NOT an engineering/profile dimension.
      const frameBandPx = Math.max(7, Math.min(18, 46 * scale))
      const partStyle = {
        left: x(part.x),
        top: y(part.y),
        width: part.width * scale,
        height: part.height * scale,
        '--composite-frame-face-px': `${frameBandPx}px`,
      } as CSSProperties

      return <div className={`composite-sketch-part composite-sketch-${part.function ?? 'frame'}`} key={part.id}
        data-frame-part-id={part.id} style={partStyle}>
        {(['top', 'right', 'bottom', 'left'] as const).filter((side) => part.sides[side]).map((side) =>
          <span key={side} data-frame-side={side} data-frame-band="schematic"
            className={`composite-sketch-side side-${side}`} />)}

        <div className="composite-sketch-profile-tag">
          <span>Каса</span>
          <b>{part.profileCode ?? 'профил не е избран'}</b>
        </div>

        <div className="composite-sketch-label" title={`${part.label} · ${part.dimensions}`}>
          <b>{part.label}</b>
          <span>{part.dimensions}</span>
        </div>

        <div className="composite-sketch-width-dimension" aria-hidden="true">
          <i className="dimension-tick dimension-tick-start" />
          <i className="dimension-line" />
          <em>{part.widthMm} mm</em>
          <i className="dimension-tick dimension-tick-end" />
        </div>

        {(index === 0 || index === projection.parts.length - 1) && <div
          className={`composite-sketch-height-dimension ${index === 0 ? 'is-left' : 'is-right'}`} aria-hidden="true">
          <i className="dimension-tick dimension-tick-start" />
          <i className="dimension-line" />
          <em>{part.heightMm} mm</em>
          <i className="dimension-tick dimension-tick-end" />
        </div>}
      </div>
    })}
  </div>
}
