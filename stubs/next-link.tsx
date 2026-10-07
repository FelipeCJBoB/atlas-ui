import * as React from 'react';
// Substituto de next/link para rodar fora do Next.js
const Link = React.forwardRef<HTMLAnchorElement, any>(function Link({ href, children, prefetch, replace, scroll, shallow, passHref, legacyBehavior, ...rest }, ref) {
  const h = typeof href === 'string' ? href : href?.pathname ?? '#';
  return <a ref={ref} href={h} {...rest}>{children}</a>;
});
export default Link;
