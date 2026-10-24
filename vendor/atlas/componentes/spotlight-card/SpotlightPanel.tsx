// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useRef, type PointerEvent, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SpotlightPanelProps {
  /** Conteúdo do cartão. */
  children?: ReactNode;
  /** Classe(s) adicional(is) do cartão. */
  className?: string;
  /** Cor do centro do gradiente do holofote. */
  spotlightColor?: string;
}

export function SpotlightPanel({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.25)',
}: SpotlightPanelProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Grava posição e cor como variáveis CSS direto no elemento (sem estado React, sem re-render).
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
    card.style.setProperty('--spot-color', spotlightColor);
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      className={twMerge(
        clsx(
          'group/spot relative overflow-hidden rounded-[1.5rem] border border-solid border-[#222] bg-[#111] p-8 text-[#eee]',
          className,
        ),
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-[ease] group-hover/spot:opacity-60 group-focus-within/spot:opacity-60 motion-reduce:transition-none"
        style={{
          background:
            'radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spot-color, rgba(255, 255, 255, 0.05)), transparent 80%)',
        }}
      />
      {children}
    </div>
  );
}

export default SpotlightPanel;
