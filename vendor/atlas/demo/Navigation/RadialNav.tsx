// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import type { CSSProperties, ReactNode } from 'react';
import RadialNav, { type RadialNavItem } from '../../componentes/radial-nav/RadialNav';

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

const IconeGrade = tracado(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
  </>,
);
const IconeMarcador = tracado(<path d="M6.5 4.5a1.5 1.5 0 0 1 1.5-1.5h8a1.5 1.5 0 0 1 1.5 1.5V21L12 16.5 6.5 21z" />);
const IconeUsuario = tracado(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 21c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
  </>,
);

const ITENS: RadialNavItem[] = [
  { id: 1, icon: IconeGrade, label: 'Projects', angle: 0 },
  { id: 2, icon: IconeMarcador, label: 'Bookmarks', angle: -115 },
  { id: 3, icon: IconeUsuario, label: 'About', angle: 115 },
];

export default function RadialNavDemo() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center px-24 py-12">
      <RadialNav items={ITENS} defaultActiveId={1} />
    </div>
  );
}
