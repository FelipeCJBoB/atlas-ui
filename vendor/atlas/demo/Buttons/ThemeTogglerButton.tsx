// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ThemeTogglerButton, {
  type ResolvedTheme,
  type RevealDirection,
  type ThemeMode,
  type ThemeTogglerSize,
  type ThemeTogglerVariant,
} from '../../componentes/theme-toggler/ThemeTogglerButton';

const VARIANTS: { value: ThemeTogglerVariant; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'accent', label: 'Destaque' },
  { value: 'outline', label: 'Contorno' },
  { value: 'ghost', label: 'Fantasma' },
];

const SIZES: { value: ThemeTogglerSize; label: string }[] = [
  { value: 'default', label: 'Padrão' },
  { value: 'sm', label: 'Pequeno' },
  { value: 'lg', label: 'Grande' },
];

const DIRECTIONS: { value: RevealDirection; label: string }[] = [
  { value: 'ltr', label: 'Esq → dir' },
  { value: 'rtl', label: 'Dir → esq' },
  { value: 'ttb', label: 'Cima → baixo' },
  { value: 'btt', label: 'Baixo → cima' },
];

const selectClass =
  'rounded-md border border-[#a1a1aa]/50 bg-transparent px-2 py-1 text-sm text-current [&>option]:text-[#18181b]';

// O tema é aplicado só a este contêiner (a raiz da página não pode receber "dark").
const STAGE_CSS =
  '.atlas-tt-stage{background:#ffffff;color:#0a0a0a}.atlas-tt-stage.dark{background:#0a0a0a;color:#fafafa}';

function useSystemDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const read = () => setDark(mq.matches);
    read();
    mq.addEventListener?.('change', read);
    return () => mq.removeEventListener?.('change', read);
  }, []);
  return dark;
}

export default function ThemeTogglerButtonDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ThemeMode>('light');
  const [label, setLabel] = useState<ThemeMode>('light');
  const [variant, setVariant] = useState<ThemeTogglerVariant>('default');
  const [size, setSize] = useState<ThemeTogglerSize>('default');
  const [direction, setDirection] = useState<RevealDirection>('ltr');
  const [withSystem, setWithSystem] = useState(false);
  const sysDark = useSystemDark();
  const resolved: ResolvedTheme = mode === 'system' ? (sysDark ? 'dark' : 'light') : mode;

  // Estado inicial: o tema do palco (classe do ancestral ou preferência do sistema).
  useLayoutEffect(() => {
    const el = stageRef.current;
    const marked = el?.parentElement?.closest('.dark, .light');
    const dark = marked ? marked.classList.contains('dark') : !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const initial: ThemeMode = dark ? 'dark' : 'light';
    setMode(initial);
    setLabel(initial);
  }, []);

  return (
    <div
      ref={stageRef}
      className={`atlas-tt-stage ${resolved}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        minHeight: 360,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <style>{STAGE_CSS}</style>

      <div
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, opacity: 0.8, maxWidth: 'calc(100% - 32px)' }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Variante
          <select className={selectClass} value={variant} onChange={(e) => setVariant(e.target.value as ThemeTogglerVariant)}>
            {VARIANTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Tamanho
          <select className={selectClass} value={size} onChange={(e) => setSize(e.target.value as ThemeTogglerSize)}>
            {SIZES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          Direção
          <select className={selectClass} value={direction} onChange={(e) => setDirection(e.target.value as RevealDirection)}>
            {DIRECTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingBottom: 6 }}>
          <input type="checkbox" checked={withSystem} onChange={(e) => setWithSystem(e.target.checked)} />
          Sistema
        </label>
      </div>

      <ThemeTogglerButton
        variant={variant}
        size={size}
        direction={direction}
        modes={withSystem ? ['light', 'dark', 'system'] : ['light', 'dark']}
        theme={mode}
        resolvedTheme={resolved}
        setTheme={setMode}
        target={stageRef}
        onImmediateChange={setLabel}
      />

      <span
        style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% + 32px)', textAlign: 'center', fontSize: 14, opacity: 0.6, pointerEvents: 'none' }}
      >
        {label}
      </span>
    </div>
  );
}
