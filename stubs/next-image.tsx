import * as React from 'react';
// Substituto de next/image (aceita string ou StaticImageData {src,width,height})
export default function Image({ src, alt = '', fill, width, height, priority, placeholder, blurDataURL, quality, loader, unoptimized, sizes, onLoadingComplete, style, ...rest }: any) {
  const s = typeof src === 'string' ? src : src?.src;
  const st = fill ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', ...style } : style;
  return <img src={s} alt={alt} width={fill ? undefined : width ?? src?.width} height={fill ? undefined : height ?? src?.height} style={st} {...rest} />;
}
