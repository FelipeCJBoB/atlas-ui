// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from 'react';
import CrosshairCursor from '../../componentes/crosshair/CrosshairCursor';

// Tema do palco: classe dark/light do ancestral mais próximo, com fallback para o sistema.
function useIsDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = ref.current;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const host = el?.closest('.dark, .light') ?? null;
    const read = () => setDark(host ? host.classList.contains('dark') : mq.matches);
    read();
    const mo = host ? new MutationObserver(read) : null;
    if (host && mo) mo.observe(host, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener('change', read);
    return () => {
      mo?.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref]);
  return dark;
}

type Mode = 'viewport' | 'targeted';

export default function CrosshairCursorDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark(rootRef);
  const [color, setColor] = useState('#ffffff');
  const [mode, setMode] = useState<Mode>('viewport');
  const [hover, setHover] = useState(false);

  // No tema claro, o branco padrão vira quase preto para ter contraste.
  const lineColor = !dark && color.toLowerCase() === '#ffffff' ? '#18181b' : color;
  const fg = dark ? '#e4e4e7' : '#18181b';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const linkColor = hover ? '#ff00ff' : dark ? '#2f293a' : '#52525b';
  const panelBg = dark ? 'rgba(24,24,27,0.85)' : 'rgba(255,255,255,0.9)';
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full min-h-[360px] overflow-hidden flex flex-col items-center justify-center"
      style={{ minHeight: 360 }}
    >
      {mode === 'targeted' ? (
        <CrosshairCursor color={lineColor} containerRef={rootRef} />
      ) : (
        <CrosshairCursor color={lineColor} />
      )}

      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        className="text-[2rem] md:text-[4rem]"
        style={{
          fontWeight: 600,
          color: linkColor,
          transition: 'color 0.3s',
          textDecoration: 'none',
          textAlign: 'center',
          // Os dois textos ocupam a mesma célula: a largura fica na maior, sem medir.
          display: 'inline-grid',
          lineHeight: 1.1,
        }}
      >
        <span style={{ gridArea: '1 / 1', visibility: hover ? 'hidden' : 'visible' }}>Target</span>
        <span style={{ gridArea: '1 / 1', visibility: hover ? 'visible' : 'hidden' }} aria-hidden={!hover}>
          Locked
        </span>
      </a>
      <p style={{ color: muted, marginTop: -10, fontSize: 14 }}>(hover the text)</p>

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          background: panelBg,
          color: fg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: '6px 10px',
          fontSize: 12,
          zIndex: 10001,
        }}
      >
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Cor" />
        {(['viewport', 'targeted'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              border: `1px solid ${border}`,
              background: mode === m ? (dark ? '#3f3f46' : '#e4e4e7') : 'transparent',
              color: fg,
              cursor: 'pointer',
            }}
          >
            {m === 'viewport' ? 'Viewport' : 'Targeted'}
          </button>
        ))}
      </div>
    </div>
  );
}
