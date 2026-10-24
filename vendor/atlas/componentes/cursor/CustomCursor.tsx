// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

export type CursorSide = 'top' | 'bottom' | 'left' | 'right';
export type CursorAlign = 'start' | 'center' | 'end';

export interface CustomCursorProps {
  /** Escopo global (janela inteira) em vez do elemento pai. */
  global?: boolean;
  /** Mostrar a seta. */
  arrow?: boolean;
  /** Conteúdo da etiqueta (vazio = sem etiqueta). */
  label?: ReactNode;
  side?: CursorSide;
  sideOffset?: number;
  align?: CursorAlign;
  alignOffset?: number;
  /** Mola da etiqueta. */
  spring?: { stiffness: number; damping: number };
  arrowColor?: string;
  labelBackground?: string;
  labelColor?: string;
  /** Ativa já na montagem, no centro da área (útil em prévias sem movimento do ponteiro). */
  startAtCenter?: boolean;
  className?: string;
  labelClassName?: string;
}

const CLASSE_OCULTA = 'atlas-cursor-oculto';
const ID_ESTILO = 'atlas-cursor-oculto-estilo';

// Regra única compartilhada entre instâncias: esconde o cursor nativo no alvo e descendentes.
function garantirEstilo() {
  if (typeof document === 'undefined' || document.getElementById(ID_ESTILO)) return;
  const s = document.createElement('style');
  s.id = ID_ESTILO;
  s.textContent = `.${CLASSE_OCULTA}, .${CLASSE_OCULTA} * { cursor: none !important; }`;
  document.head.appendChild(s);
}

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

/** Canto superior esquerdo da etiqueta a partir do ponteiro (x, y) e do tamanho L × A. */
export function posicaoEtiqueta(
  x: number,
  y: number,
  L: number,
  A: number,
  side: CursorSide,
  align: CursorAlign,
  d: number,
  a: number,
  meia: number,
): [number, number] {
  if (side === 'top' || side === 'bottom') {
    const topo = side === 'bottom' ? y + d + meia : y - A - d + meia;
    const esq = align === 'end' ? x + a + meia : align === 'center' ? x - L / 2 + meia : x - L - a + meia;
    return [esq, topo];
  }
  const esq = side === 'right' ? x + d + meia : x - L - d + meia;
  const topo = align === 'end' ? y + a + meia : align === 'center' ? y - A / 2 + meia : y - A - a + meia;
  return [esq, topo];
}

export function CustomCursor({
  global = false,
  arrow = true,
  label,
  side = 'bottom',
  sideOffset = 15,
  align = 'end',
  alignOffset = 5,
  spring = { stiffness: 500, damping: 50 },
  arrowColor,
  labelBackground,
  labelColor,
  startAtCenter = false,
  className,
  labelClassName,
}: CustomCursorProps) {
  const marcadorRef = useRef<HTMLSpanElement>(null);
  const etiquetaRef = useRef<HTMLDivElement>(null);
  const escuro = useTemaEscuro(marcadorRef);
  const reduzido = useReducedMotion() ?? false;
  const [ativo, setAtivo] = useState(false);
  const ativoRef = useRef(false);
  const recemAtivado = useRef(false);

  // Valores animados fora do ciclo de render.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const lx = useMotionValue(0);
  const ly = useMotionValue(0);
  const sx = useSpring(lx, { stiffness: spring.stiffness, damping: spring.damping, mass: 1 });
  const sy = useSpring(ly, { stiffness: spring.stiffness, damping: spring.damping, mass: 1 });

  const ponteiro = useRef({ x: 0, y: 0 });
  const tamanho = useRef({ w: 80, h: 28 }); // fallback até medir
  const opcoes = useRef({ side, align, sideOffset, alignOffset, arrow });
  opcoes.current = { side, align, sideOffset, alignOffset, arrow };

  const atualizarEtiqueta = useCallback(() => {
    const o = opcoes.current;
    const [ex, ey] = posicaoEtiqueta(
      ponteiro.current.x,
      ponteiro.current.y,
      tamanho.current.w,
      tamanho.current.h,
      o.side,
      o.align,
      o.sideOffset,
      o.alignOffset,
      o.arrow ? 12 : 10,
    );
    lx.set(ex);
    ly.set(ey);
  }, [lx, ly]);

  useEffect(() => {
    const pai = marcadorRef.current?.parentElement;
    if (!pai) return;
    // Sem ponteiro fino (toque), mantém o cursor nativo e não mostra o efeito.
    if (!window.matchMedia('(any-pointer: fine)').matches) return;
    garantirEstilo();

    const alvoCursor = global ? document.documentElement : pai;
    let posicaoOriginal: string | null = null;
    if (!global && getComputedStyle(pai).position === 'static') {
      posicaoOriginal = pai.style.position;
      pai.style.position = 'relative';
    }

    const mover = (px: number, py: number) => {
      ponteiro.current = { x: px, y: py };
      x.set(px);
      y.set(py);
      atualizarEtiqueta();
      if (!ativoRef.current) {
        ativoRef.current = true;
        alvoCursor.classList.add(CLASSE_OCULTA);
        // A etiqueta nasce no alvo, sem atravessar a área.
        sx.jump(lx.get());
        sy.jump(ly.get());
        recemAtivado.current = true;
        setAtivo(true);
      }
    };
    const desativar = () => {
      if (!ativoRef.current) return;
      ativoRef.current = false;
      alvoCursor.classList.remove(CLASSE_OCULTA);
      setAtivo(false);
    };
    const coordenadas = (e: PointerEvent): [number, number] => {
      if (global) return [e.clientX, e.clientY];
      const r = pai.getBoundingClientRect();
      return [e.clientX - r.left - pai.clientLeft + pai.scrollLeft, e.clientY - r.top - pai.clientTop + pai.scrollTop];
    };
    const aoMover = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const [px, py] = coordenadas(e);
      mover(px, py);
    };
    const aoSairLocal = (e: PointerEvent) => {
      const rel = e.relatedTarget as Node | null;
      if (!rel || !pai.contains(rel)) desativar();
    };
    const aoSairJanela = (e: PointerEvent) => {
      if (!e.relatedTarget) desativar();
    };
    const aoVisibilidade = () => {
      if (document.hidden) desativar();
    };

    if (global) {
      window.addEventListener('pointermove', aoMover);
      document.addEventListener('pointerout', aoSairJanela);
      document.addEventListener('visibilitychange', aoVisibilidade);
    } else {
      pai.addEventListener('pointermove', aoMover);
      pai.addEventListener('pointerout', aoSairLocal);
    }

    if (startAtCenter) {
      if (global) mover(window.innerWidth / 2, window.innerHeight / 2);
      else mover((pai.clientWidth || 400) / 2 + pai.scrollLeft, (pai.clientHeight || 400) / 2 + pai.scrollTop);
    }

    return () => {
      if (global) {
        window.removeEventListener('pointermove', aoMover);
        document.removeEventListener('pointerout', aoSairJanela);
        document.removeEventListener('visibilitychange', aoVisibilidade);
      } else {
        pai.removeEventListener('pointermove', aoMover);
        pai.removeEventListener('pointerout', aoSairLocal);
      }
      alvoCursor.classList.remove(CLASSE_OCULTA);
      if (posicaoOriginal !== null) pai.style.position = posicaoOriginal;
      ativoRef.current = false;
      setAtivo(false);
    };
  }, [global, startAtCenter, x, y, lx, ly, sx, sy, atualizarEtiqueta]);

  // Mede a etiqueta ao aparecer (ou mudar de conteúdo/opções) e recalcula o alvo.
  useLayoutEffect(() => {
    const el = etiquetaRef.current;
    if (!ativo || !el) return;
    tamanho.current = { w: el.offsetWidth, h: el.offsetHeight };
    atualizarEtiqueta();
    if (recemAtivado.current) {
      recemAtivado.current = false;
      sx.jump(lx.get());
      sy.jump(ly.get());
    }
  }, [ativo, label, side, align, sideOffset, alignOffset, arrow, atualizarEtiqueta, sx, sy, lx, ly]);

  const corSeta = arrowColor ?? (escuro ? '#fafafa' : '#0a0a0a');
  const fundoEtiqueta = labelBackground ?? (escuro ? '#fafafa' : '#0a0a0a');
  const textoEtiqueta = labelColor ?? (escuro ? '#0a0a0a' : '#ffffff');
  const posicao: CSSProperties['position'] = global ? 'fixed' : 'absolute';
  const temEtiqueta = label !== undefined && label !== null && label !== false && label !== '';

  const entrada = reduzido ? { scale: 1, opacity: 0 } : { scale: 0, opacity: 0 };
  const transicao = reduzido
    ? { opacity: { duration: 0.3 } }
    : { scale: { type: 'spring' as const, stiffness: 500, damping: 25 }, opacity: { duration: 0.3 } };

  const camadas = (
    <AnimatePresence>
      {ativo && arrow && (
        <motion.div
          key="seta"
          aria-hidden="true"
          className={className}
          initial={entrada}
          animate={{ scale: 1, opacity: 1 }}
          exit={entrada}
          transition={transicao}
          style={{
            position: posicao,
            left: 0,
            top: 0,
            width: 24,
            height: 24,
            x,
            y,
            zIndex: 9999,
            pointerEvents: 'none',
            transformOrigin: '0 0',
            color: corSeta,
          }}
        >
          <svg viewBox="0 0 40 40" width={24} height={24} style={{ display: 'block', overflow: 'visible' }}>
            <path
              d="M2 4 L8 37 Q17 27.5 31 22 Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
      {ativo && temEtiqueta && (
        <motion.div
          key="etiqueta"
          ref={etiquetaRef}
          aria-hidden="true"
          className={labelClassName}
          initial={entrada}
          animate={{ scale: 1, opacity: 1 }}
          exit={entrada}
          transition={transicao}
          style={{
            position: posicao,
            left: 0,
            top: 0,
            x: reduzido ? lx : sx,
            y: reduzido ? ly : sy,
            zIndex: 9998,
            pointerEvents: 'none',
            transformOrigin: '0 0',
            background: fundoEtiqueta,
            color: textoEtiqueta,
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 14,
            lineHeight: '20px',
            whiteSpace: 'nowrap',
            width: 'max-content',
          }}
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span ref={marcadorRef} aria-hidden="true" style={{ display: 'none' }} />
      {global ? (typeof document !== 'undefined' ? createPortal(camadas, document.body) : null) : camadas}
    </>
  );
}

export default CustomCursor;
