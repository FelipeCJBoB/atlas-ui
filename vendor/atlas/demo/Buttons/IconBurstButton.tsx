// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import IconBurstButton, { type IconBurstSize, type IconBurstVariant } from '../../componentes/icon/IconBurstButton';

const VARIANTS: { value: IconBurstVariant; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'accent', label: 'Destaque' },
  { value: 'outline', label: 'Contorno' },
  { value: 'ghost', label: 'Fantasma' },
];

const SIZES: { value: IconBurstSize; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'sm', label: 'Pequeno' },
  { value: 'lg', label: 'Grande' },
];

const selectClass =
  'rounded-md border border-[#a1a1aa]/50 bg-transparent px-2 py-1 text-sm text-current [&>option]:text-[#18181b]';

// Tema do palco: classe dark/light do ancestral mais próximo, senão prefers-color-scheme.
function useStageDark() {
  const ref = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const read = () => {
      const marked = el.parentElement?.closest('.dark, .light');
      setDark(marked ? marked.classList.contains('dark') : !!mq?.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, []);
  return [ref, dark] as const;
}

export default function IconBurstButtonDemo() {
  const [ref, dark] = useStageDark();
  const [variant, setVariant] = useState<IconBurstVariant>('default');
  const [size, setSize] = useState<IconBurstSize>('default');

  return (
    <div
      ref={ref}
      className="relative flex h-full min-h-[360px] w-full items-center justify-center"
      style={{ color: dark ? '#fafafa' : '#0a0a0a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: 360 }}
    >
      <div
        className="absolute left-4 top-4 z-10 flex flex-wrap gap-3 text-xs opacity-80"
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, opacity: 0.8 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Variante
          <select className={selectClass} value={variant} onChange={(e) => setVariant(e.target.value as IconBurstVariant)}>
            {VARIANTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Tamanho
          <select className={selectClass} value={size} onChange={(e) => setSize(e.target.value as IconBurstSize)}>
            {SIZES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <IconBurstButton variant={variant} size={size} aria-label="Favoritar" icon={<Star size={16} strokeWidth={2} />} />
    </div>
  );
}
