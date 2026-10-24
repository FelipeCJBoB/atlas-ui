// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useState } from 'react';
import BubbleBackground from '../../componentes/bubble/BubbleBackground';

export default function BubbleBackgroundDemo() {
  const [interactive, setInteractive] = useState(true);

  return (
    <div className="relative w-full h-full min-h-[360px]">
      <BubbleBackground
        interactive={interactive}
        className="flex items-center justify-center"
        style={{ position: 'absolute', inset: 0, borderRadius: 14 }}
      />
      <button
        type="button"
        role="switch"
        aria-checked={interactive}
        onClick={() => setInteractive((v) => !v)}
        className="absolute top-3 right-3 flex items-center gap-2 rounded-full px-2.5 py-1 text-xs"
        style={{ color: '#ffffff', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.25)' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 22, height: 12, borderRadius: 999, position: 'relative', transition: 'background 200ms',
            background: interactive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
          }}
        >
          <span
            style={{
              position: 'absolute', top: 2, left: interactive ? 12 : 2, width: 8, height: 8, borderRadius: '50%',
              background: interactive ? '#4c1d95' : '#ffffff', transition: 'left 200ms',
            }}
          />
        </span>
        Seguir o ponteiro
      </button>
    </div>
  );
}
