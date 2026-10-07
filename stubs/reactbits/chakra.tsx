import * as React from 'react';
// Substituto mínimo do Chakra UI: converte as props de estilo usadas nas demos do React Bits em style inline
const MAP: Record<string, string | string[]> = {
  h: 'height', w: 'width', minH: 'minHeight', maxH: 'maxHeight', minW: 'minWidth', maxW: 'maxWidth',
  p: 'padding', px: ['paddingLeft', 'paddingRight'], py: ['paddingTop', 'paddingBottom'], pt: 'paddingTop', pb: 'paddingBottom', pl: 'paddingLeft', pr: 'paddingRight',
  m: 'margin', mx: ['marginLeft', 'marginRight'], my: ['marginTop', 'marginBottom'], mt: 'marginTop', mb: 'marginBottom', ml: 'marginLeft', mr: 'marginRight',
  bg: 'background', justify: 'justifyContent', align: 'alignItems', direction: 'flexDirection', gap: 'gap',
  position: 'position', overflow: 'overflow', display: 'display', fontSize: 'fontSize', fontWeight: 'fontWeight', color: 'color', zIndex: 'zIndex',
  top: 'top', left: 'left', right: 'right', bottom: 'bottom', height: 'height', width: 'width', flexShrink: 'flexShrink', flex: 'flex',
  textAlign: 'textAlign', letterSpacing: 'letterSpacing', userSelect: 'userSelect', alignItems: 'alignItems', justifyContent: 'justifyContent',
  flexDirection: 'flexDirection', borderBottom: 'borderBottom', borderRadius: 'borderRadius', border: 'border', opacity: 'opacity', lineHeight: 'lineHeight',
  cursor: 'cursor', objectFit: 'objectFit', pointerEvents: 'pointerEvents', transition: 'transition', boxShadow: 'boxShadow', gridTemplateColumns: 'gridTemplateColumns',
};
const SPACE = new Set(['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'gap']);
const val = (k: string, v: any) => (typeof v === 'number' && SPACE.has(k) ? v * 4 : v);
function split(props: any) {
  const style: any = { ...(props.style || {}) }, rest: any = {};
  for (const k of Object.keys(props)) {
    if (k === 'style' || k === 'as') continue;
    const m = MAP[k];
    if (!m) { rest[k] = props[k]; continue; }
    for (const css of Array.isArray(m) ? m : [m]) style[css] = val(k, props[k]);
  }
  return { style, rest };
}
const make = (tag: string, base: React.CSSProperties = {}) => React.forwardRef<any, any>(({ as, children, ...p }, ref) => {
  const { style, rest } = split(p); const T: any = as || tag;
  return <T ref={ref} {...rest} style={{ ...base, ...style }}>{children}</T>;
});
export const Box = make('div');
export const Flex = make('div', { display: 'flex' });
export const Text = make('p', { margin: 0 });
export const Center = make('div', { display: 'flex', alignItems: 'center', justifyContent: 'center' });
export const Button = make('button');
export const Input = make('input');
export const Image = make('img');
export const Icon = make('span', { display: 'inline-block' });
export const Spacer = make('div', { flex: 1 });
export const Grid = make('div', { display: 'grid' });
export const GridItem = make('div');
export const Spinner = make('div');
export const Stack = make('div', { display: 'flex', flexDirection: 'column' });
export const VStack = Stack;
export const HStack = make('div', { display: 'flex', alignItems: 'center' });
