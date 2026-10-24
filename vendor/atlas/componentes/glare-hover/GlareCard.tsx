// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react';

export interface GlareCardProps {
  width?: string;
  height?: string;
  background?: string;
  borderRadius?: string;
  borderColor?: string;
  /** Hex de 3 ou 6 dígitos (vira rgba com a opacidade); outro formato é usado como está. */
  glareColor?: string;
  glareOpacity?: number;
  glareAngle?: number;
  /** Tamanho da imagem de gradiente em % do painel. */
  glareSize?: number;
  transitionDuration?: number;
  /** Anima só na entrada; ao sair volta ao repouso sem varredura. */
  playOnce?: boolean;
  /** Mostra o cursor de mão sobre o painel. */
  pointerCursor?: boolean;
  /** Faz uma passada automática logo após montar (útil em prévias). */
  sweepOnMount?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function toGlare(color: string, opacity: number) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

export function GlareCard({
  width = '500px',
  height = '500px',
  background = '#000',
  borderRadius = '10px',
  borderColor = '#333',
  glareColor = '#ffffff',
  glareOpacity = 0.5,
  glareAngle = -45,
  glareSize = 250,
  transitionDuration = 650,
  playOnce = false,
  pointerCursor = true,
  sweepOnMount = false,
  children,
  className = '',
  style,
}: GlareCardProps) {
  const cls = 'atlas-glare-' + useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [active, setActive] = useState(false);

  // Passada automática: liga o estado "ativo" (equivale ao hover) e desliga depois.
  useEffect(() => {
    if (!sweepOnMount) return;
    const t1 = window.setTimeout(() => setActive(true), 350);
    const t2 = window.setTimeout(() => setActive(false), 350 + transitionDuration + 250);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sweepOnMount]);

  const vars = {
    '--glare-w': width,
    '--glare-h': height,
    '--glare-bg': background,
    '--glare-r': borderRadius,
    '--glare-border': borderColor,
    '--glare-color': toGlare(glareColor, glareOpacity),
    '--glare-angle': `${glareAngle}deg`,
    '--glare-size': `${glareSize}%`,
    '--glare-dur': `${transitionDuration}ms`,
  } as CSSProperties;

  const s = '.' + cls;
  const css = `
${s}{position:relative;overflow:hidden;display:grid;place-items:center;width:var(--glare-w);height:var(--glare-h);background:var(--glare-bg);border:1px solid var(--glare-border);border-radius:var(--glare-r);}
${s}.is-pointer:hover{cursor:pointer;}
${s}::before{content:"";position:absolute;inset:0;pointer-events:none;
background:linear-gradient(var(--glare-angle),transparent 0%,transparent 60%,var(--glare-color) 70%,transparent 85%,transparent 100%);
background-size:var(--glare-size) var(--glare-size);background-repeat:no-repeat;background-position:-100% -100%;
transition:background-position var(--glare-dur) ease;}
${s}:hover::before,${s}:focus-within::before,${s}.is-active::before{background-position:100% 100%;}
${s}.is-once::before{transition:none;}
${s}.is-once:hover::before,${s}.is-once:focus-within::before,${s}.is-once.is-active::before{transition:background-position var(--glare-dur) ease;}
@media (prefers-reduced-motion: reduce){${s}::before,${s}.is-once:hover::before,${s}.is-once.is-active::before{transition:none;}}
`;

  return (
    <>
      <style>{css}</style>
      <div
        className={[cls, playOnce && 'is-once', pointerCursor && 'is-pointer', active && 'is-active', className]
          .filter(Boolean)
          .join(' ')}
        style={{ ...vars, ...style }}
      >
        {children}
      </div>
    </>
  );
}

export default GlareCard;
