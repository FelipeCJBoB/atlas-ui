// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import CustomCursor from '../../componentes/cursor/CustomCursor';

function useTemaEscuro(ref: RefObject<HTMLElement | null>): boolean {
  const [escuro, setEscuro] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const ler = () => {
      const alvo = el.closest('.dark, .light');
      setEscuro(alvo ? alvo.classList.contains('dark') : mq.matches);
    };
    ler();
    const mo = new MutationObserver(ler);
    for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq.addEventListener('change', ler);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', ler);
    };
  }, [ref]);
  return escuro;
}

export default function CustomCursorDemo() {
  const raizRef = useRef<HTMLDivElement>(null);
  const escuro = useTemaEscuro(raizRef);

  return (
    <div ref={raizRef} className="relative w-full h-full min-h-[440px] flex items-center justify-center p-4">
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          height: 400,
          borderRadius: 10,
          overflow: 'hidden',
          background: escuro ? '#262626' : '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ margin: 0, fontWeight: 500, fontStyle: 'italic', color: escuro ? '#a1a1a1' : '#737373' }}>
          Move your mouse over the div
        </p>
        <CustomCursor label="Designer" side="bottom" align="end" sideOffset={15} alignOffset={5} startAtCenter />
      </div>
    </div>
  );
}
