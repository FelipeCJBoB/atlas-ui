// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Sparkle } from 'lucide-react';
import SpotlightPanel from '../../componentes/spotlight-card/SpotlightPanel';

const DEFAULT_COLOR = 'rgba(255, 255, 255, 0.25)';
// Alfa do padrão (0,25 ≈ 0x40), mantido ao escolher outra cor no seletor.
const ALPHA_HEX = '40';

// Detecta o tema do palco (classe `light`/`dark` no ancestral mais próximo; sem ela, preferência do sistema).
function useLightStage(ref: RefObject<HTMLElement | null>): boolean {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const read = () => {
      const stage = el.closest('.light, .dark');
      setLight(stage ? stage.classList.contains('light') : mq.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq.addEventListener('change', read);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref]);
  return light;
}

export default function SpotlightPanelDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const light = useLightStage(rootRef);
  const [color, setColor] = useState(DEFAULT_COLOR);

  // No tema claro, com a cor no padrão, usa preto quase transparente.
  const effectiveColor = light && color === DEFAULT_COLOR ? '#18181b14' : color;
  const pickerValue = color === DEFAULT_COLOR ? '#ffffff' : color.slice(0, 7);

  return (
    <div
      ref={rootRef}
      className="w-full h-full min-h-[320px] flex flex-col items-center justify-center gap-6 py-10 px-4"
    >
      <SpotlightPanel className="w-[350px] max-w-full" spotlightColor={effectiveColor}>
        <div className="flex flex-col items-start justify-center">
          <Sparkle className="size-12 mb-3" fill="currentColor" aria-hidden="true" />
          <h3 className="m-0 font-semibold text-[1.4rem] tracking-[-0.5px]">Boost Your Experience</h3>
          <p className="text-[14px] text-neutral-400 mt-1 mb-8">
            Get exclusive benefits, features &amp; 24/7 support as a permanent club member.
          </p>
        </div>
      </SpotlightPanel>

      <label
        className="flex items-center gap-3 text-xs"
        style={{ color: light ? '#18181b' : '#e4e4e7' }}
      >
        <span className="opacity-70">Cor do holofote</span>
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => setColor(e.target.value + ALPHA_HEX)}
          className="h-7 w-12 cursor-pointer bg-transparent"
        />
      </label>
    </div>
  );
}
