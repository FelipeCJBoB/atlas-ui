// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from 'react';
import PixelCard, { type PixelCardVariant } from '../../componentes/pixel-card/PixelCard';

// Paletas escuras usadas quando o palco está em tema claro.
const LIGHT_PALETTES: Record<PixelCardVariant, string[]> = {
  default: ['#18181b', '#52525b', '#a1a1aa'],
  blue: ['#0c4a6e', '#0369a1', '#0284c7'],
  yellow: ['#713f12', '#a16207', '#ca8a04'],
  pink: ['#831843', '#be123c', '#e11d48'],
};

const DARK_PALETTES: Record<PixelCardVariant, string[]> = {
  default: ['#f8fafc', '#f1f5f9', '#cbd5e1'],
  blue: ['#e0f2fe', '#7dd3fc', '#0ea5e9'],
  yellow: ['#fef08a', '#fde047', '#eab308'],
  pink: ['#fecdd3', '#fda4af', '#e11d48'],
};

const OPTIONS: { value: PixelCardVariant; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'blue', label: 'Blue' },
  { value: 'pink', label: 'Pink' },
];

// Tema do palco: classe `dark`/`light` no ancestral mais próximo; senão, preferência do sistema.
function useIsDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const read = () => {
      const marked = el.closest('.dark, .light');
      setDark(marked ? marked.classList.contains('dark') : !!mq?.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let node = el.parentElement; node; node = node.parentElement) {
      mo.observe(node, { attributes: true, attributeFilter: ['class'] });
    }
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, [ref]);
  return dark;
}

export default function PixelCardDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDark(rootRef);
  const [variant, setVariant] = useState<PixelCardVariant>('default');
  const palette = (isDark ? DARK_PALETTES : LIGHT_PALETTES)[variant];

  return (
    <div
      ref={rootRef}
      className="relative flex h-[500px] min-h-[360px] w-full items-center justify-center overflow-hidden"
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 500, minHeight: 360, overflow: 'hidden' }}
    >
      <label
        className="absolute left-4 top-4 z-10 flex flex-col gap-1 text-xs"
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: isDark ? '#a1a1aa' : '#52525b' }}
      >
        Variant
        <select
          value={variant}
          onChange={(e) => setVariant(e.target.value as PixelCardVariant)}
          className="rounded-md border px-2 py-1 text-sm"
          style={{
            width: 150,
            background: isDark ? '#18181b' : '#ffffff',
            color: isDark ? '#f4f4f5' : '#18181b',
            borderColor: isDark ? '#3f3f46' : '#d4d4d8',
          }}
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <PixelCard variant={variant} colors={palette}>
        <div
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-semibold"
          style={{ fontSize: '3rem', color: isDark ? '#f4f4f5' : '#18181b' }}
        >
          Hover Me.
        </div>
      </PixelCard>
    </div>
  );
}
