// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useState, type ReactNode } from 'react';
import MagnifyDock, { type MagnifyDockItem } from '../../componentes/dock/MagnifyDock';

function StrokeIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-white/90"
    >
      {children}
    </svg>
  );
}

const HomeIcon = () => (
  <StrokeIcon>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
  </StrokeIcon>
);

const ArchiveIcon = () => (
  <StrokeIcon>
    <rect x="2.5" y="3.5" width="19" height="5" rx="1" />
    <path d="M4.5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V8.5" />
    <path d="M10 12.5h4" />
  </StrokeIcon>
);

const UserIcon = () => (
  <StrokeIcon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
  </StrokeIcon>
);

const GearIcon = () => (
  <StrokeIcon>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </StrokeIcon>
);

const ITEMS: MagnifyDockItem[] = [
  { icon: <HomeIcon />, label: 'Home', onClick: () => alert('Home!') },
  { icon: <ArchiveIcon />, label: 'Archive', onClick: () => alert('Archive!') },
  { icon: <UserIcon />, label: 'Profile', onClick: () => alert('Profile!') },
  { icon: <GearIcon />, label: 'Settings', onClick: () => alert('Settings!') },
];

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      <span>
        {label}: {value}
      </span>
      <input type="range" min={min} max={max} step={10} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export default function MagnifyDockDemo() {
  const [panelHeight, setPanelHeight] = useState(68);
  const [baseItemSize, setBaseItemSize] = useState(50);
  const [magnification, setMagnification] = useState(70);

  // Cada mudança remonta o dock.
  const key = `${panelHeight}|${baseItemSize}|${magnification}`;

  return (
    <div className="w-full h-full min-h-[320px] flex flex-col gap-4 bg-[#0b0a10] p-4 text-white">
      {/* Área de prévia transparente: só o painel do dock tem cor. */}
      <div
        style={{
          position: 'relative',
          minHeight: 400,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'transparent',
        }}
      >
        <p
          style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 500,
            color: '#a3a3a3',
            pointerEvents: 'none',
          }}
        >
          Try it out!
        </p>
        <MagnifyDock
          key={key}
          items={ITEMS}
          panelHeight={panelHeight}
          baseItemSize={baseItemSize}
          magnification={magnification}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Slider label="Altura do painel" value={panelHeight} min={30} max={200} onChange={setPanelHeight} />
        <Slider label="Tamanho base" value={baseItemSize} min={20} max={60} onChange={setBaseItemSize} />
        <Slider label="Ampliação" value={magnification} min={50} max={100} onChange={setMagnification} />
      </div>
    </div>
  );
}
