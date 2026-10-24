// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useState } from 'react';
import { Plus } from 'lucide-react';
import LiquidButton, {
  type LiquidButtonSize,
  type LiquidButtonVariant,
} from '../../componentes/liquid-button/LiquidButton';

const VARIANTS: { value: LiquidButtonVariant; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'destructive', label: 'Destrutivo' },
  { value: 'ghost', label: 'Fantasma' },
  { value: 'secondary', label: 'Secundário' },
];

const SIZES: { value: LiquidButtonSize; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'sm', label: 'Pequeno' },
  { value: 'lg', label: 'Grande' },
  { value: 'icon', label: 'Ícone' },
  { value: 'icon-sm', label: 'Ícone pequeno' },
  { value: 'icon-lg', label: 'Ícone grande' },
];

const selectClass =
  'rounded-md border border-[#a1a1aa]/50 bg-transparent px-2 py-1 text-sm text-current [&>option]:text-[#18181b]';

export default function LiquidButtonDemo() {
  const [variant, setVariant] = useState<LiquidButtonVariant>('default');
  const [size, setSize] = useState<LiquidButtonSize>('lg');
  const iconOnly = size.startsWith('icon');

  return (
    <div
      className="relative flex h-full min-h-[360px] w-full items-center justify-center"
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: 360 }}
    >
      <div
        className="absolute left-4 top-4 z-10 flex flex-wrap gap-3 text-xs opacity-80"
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, opacity: 0.8 }}
      >
        <label className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Variante
          <select className={selectClass} value={variant} onChange={(e) => setVariant(e.target.value as LiquidButtonVariant)}>
            {VARIANTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Tamanho
          <select className={selectClass} value={size} onChange={(e) => setSize(e.target.value as LiquidButtonSize)}>
            {SIZES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <LiquidButton variant={variant} size={size} aria-label={iconOnly ? 'Adicionar' : undefined}>
        {iconOnly ? <Plus /> : 'Hover me'}
      </LiquidButton>
    </div>
  );
}
