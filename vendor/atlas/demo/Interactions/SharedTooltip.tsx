// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Tooltip, TooltipProvider, type TooltipSide } from '../../componentes/tooltip/SharedTooltip';

function DemoButton({ children, dark }: { children: ReactNode; dark: boolean }) {
  const vars = { '--btn-bg': dark ? '#262626' : '#f5f5f5' } as CSSProperties;
  return (
    <button
      type="button"
      className="bg-(--btn-bg) hover:bg-(--btn-bg)/90 outline-none focus-visible:ring-[3px] focus-visible:ring-[#a1a1a1]/50"
      style={{ ...vars, height: 40, padding: '0 16px', borderRadius: 10, border: 0, fontSize: 14, fontWeight: 500, cursor: 'pointer', color: dark ? '#fafafa' : '#171717' }}
    >
      {children}
    </button>
  );
}

const SIDES: TooltipSide[] = ['top', 'right', 'bottom', 'left'];

export default function SharedTooltipDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);
  const [side, setSide] = useState<TooltipSide>('top');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.closest('.dark, .light');
    setDark(host ? host.classList.contains('dark') : window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const border = dark ? 'rgba(255,255,255,0.10)' : '#e5e5e5';
  const muted = dark ? '#a1a1a1' : '#737373';

  return (
    <div ref={ref} className="relative w-full h-full min-h-[360px] flex items-center justify-center">
      {/* key remonta o grupo a cada mudança de lado */}
      <TooltipProvider key={side}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 8, padding: 8, border: `1px solid ${border}`, borderRadius: 14 }}>
            <Tooltip side={side} content="Documentation">
              <DemoButton dark={dark}>Docs</DemoButton>
            </Tooltip>
            <Tooltip
              side={side}
              content={<>Lorem ipsum dolor sit amet<br />consectetur adipisicing elit</>}
            >
              <DemoButton dark={dark}>Lorem</DemoButton>
            </Tooltip>
            <Tooltip side={side} content="User Guide">
              <DemoButton dark={dark}>Guide</DemoButton>
            </Tooltip>
          </div>
          <Tooltip side={side} content="GitHub">
            <DemoButton dark={dark}>Repo</DemoButton>
          </Tooltip>
        </div>
      </TooltipProvider>

      <label className="absolute top-3 right-3 flex items-center gap-1.5 text-xs" style={{ color: muted }}>
        Lado
        <select
          value={side}
          onChange={(e) => setSide(e.target.value as TooltipSide)}
          className="rounded-md px-1.5 py-0.5 text-xs"
          style={{ color: dark ? '#fafafa' : '#0a0a0a', background: dark ? '#171717' : '#ffffff', border: `1px solid ${border}` }}
        >
          {SIDES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
