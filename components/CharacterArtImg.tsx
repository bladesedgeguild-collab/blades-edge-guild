'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'

type Status = 'loading' | 'ok' | 'missing'

type Props = {
  src: string
  className?: string
  style?: CSSProperties
  /** Optional wrapper, used for the oath hero glow. Omitted when the file is missing. */
  frameClassName?: string
}

/**
 * Character wireframe that stays out of the layout when the PNG is missing.
 * The image stays hidden until it loads, so a 404 never flashes a broken icon.
 */
export function CharacterArtImg({ src, className, style, frameClassName }: Props) {
  const [status, setStatus] = useState<Status>('loading')

  function mark(img: HTMLImageElement) {
    setStatus(img.naturalWidth > 0 ? 'ok' : 'missing')
  }

  if (status === 'missing') return null

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={className}
      draggable={false}
      ref={(node) => {
        if (node?.complete) mark(node)
      }}
      style={{ ...style, visibility: status === 'ok' ? 'visible' : 'hidden' }}
      onLoad={(e) => mark(e.currentTarget)}
      onError={() => setStatus('missing')}
    />
  )

  if (!frameClassName) return img
  return (
    <span className={frameClassName} style={{ visibility: status === 'ok' ? 'visible' : 'hidden' }}>
      {img}
    </span>
  )
}
