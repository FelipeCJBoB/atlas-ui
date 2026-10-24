// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import type { CSSProperties, ReactNode } from 'react';
import PinList, { type PinListItem } from '../../componentes/pin-list/PinList';

type IconProps = { size?: number; className?: string; style?: CSSProperties };

// Ícones de traço próprios (2 px).
function tracado(children: ReactNode) {
  return function Icone({ size = 20, className, style }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
        aria-hidden="true"
      >
        {children}
      </svg>
    );
  };
}

const IconeCommit = tracado(
  <>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M2.5 12h6M15.5 12h6" />
  </>,
);
const IconeAlerta = tracado(
  <>
    <path d="M12 3.5 2.8 19.5a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L12 3.5z" />
    <path d="M12 10v4.5M12 17.6v.1" />
  </>,
);
const IconeCaixa = tracado(
  <>
    <path d="M12 2.8 20.5 7.4v9.2L12 21.2 3.5 16.6V7.4z" />
    <path d="M3.8 7.6 12 12l8.2-4.4M12 12v9" />
  </>,
);
const IconeChave = tracado(
  <>
    <circle cx="7.5" cy="15.5" r="4" />
    <path d="m10.4 12.6 9.1-9.1M16 7l2.6 2.6M18.2 4.8l2.4 2.4" />
  </>,
);
const IconeRegex = tracado(
  <>
    <path d="M17 3v9M13.1 5.25l7.8 4.5M20.9 5.25l-7.8 4.5" />
    <rect x="4" y="15.5" width="4.5" height="4.5" rx="1" />
  </>,
);

const ITENS: PinListItem[] = [
  { id: 1, title: 'Commit Zone', info: 'Code updates · Closes 9:00 PM', icon: IconeCommit, pinned: true },
  { id: 2, title: '404 Room', info: 'Fixing errors · Open 24 hours', icon: IconeAlerta, pinned: true },
  { id: 3, title: 'NPM Stop', info: 'Install stuff · Closes 8:00 PM', icon: IconeCaixa, pinned: false },
  { id: 4, title: 'Token Lock', info: 'Login stuff · Open 24 hours', icon: IconeChave, pinned: false },
  { id: 5, title: 'Regex Zone', info: 'Find words · Closes 9:00 PM', icon: IconeRegex, pinned: false },
];

export default function PinListDemo() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center p-6">
      <div style={{ width: 360, maxWidth: '100%' }}>
        <PinList items={ITENS} />
      </div>
    </div>
  );
}
