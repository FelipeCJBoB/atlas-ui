// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, type Transition } from 'motion/react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface AvatarGroupItem {
  /** Nome da pessoa (nome acessível e texto padrão do balão). */
  name: string;
  /** Iniciais exibidas quando não há imagem. */
  initials?: string;
  /** Imagem opcional. */
  src?: string;
  /** Fundo do círculo (cor ou gradiente CSS). */
  background?: string;
  /** Cor/estilo do texto das iniciais. */
  textStyle?: CSSProperties;
  /** Conteúdo próprio do círculo (substitui imagem e iniciais). */
  content?: ReactNode;
  /** Conteúdo do balão (padrão: o nome). */
  tooltip?: ReactNode;
}

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  avatars: AvatarGroupItem[];
  /** Primeiro avatar por cima (em vez do último). */
  firstOnTop?: boolean;
  /** Salto no hover: string em % da própria altura ou número em px (negativo = para cima). */
  lift?: string | number;
  liftSpring?: SpringConfig;
  tooltipSpring?: SpringConfig;
  openDelay?: number;
  closeDelay?: number;
  side?: TooltipSide;
  sideOffset?: number;
  align?: TooltipAlign;
  alignOffset?: number;
  /** Sobreposição entre avatares (px). */
  overlap?: number;
  /** Tamanho do avatar (px). */
  size?: number;
}

const MARGEM = 8; // distância mínima do balão às bordas da janela
const DESLOC_ENTRADA = 15;
const OPOSTO: Record<TooltipSide, TooltipSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const ROTACAO: Record<TooltipSide, number> = { top: 0, right: 90, bottom: 180, left: -90 };

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

interface Posicao {
  x: number;
  y: number;
  w: number;
  h: number;
  lado: TooltipSide;
  /** Centro da seta ao longo da borda do balão (px). */
  seta: number;
  fonte: string;
}

const limitar = (v: number, min: number, max: number) => (max < min ? min : Math.min(max, Math.max(min, v)));

/** Posicionamento flutuante próprio: lado (com inversão), alinhamento, deslocamento para caber e seta. */
function calcularPosicao(
  r: DOMRect,
  w: number,
  h: number,
  side: TooltipSide,
  offset: number,
  align: TooltipAlign,
  alignOffset: number,
): Omit<Posicao, 'fonte'> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cabe = (s: TooltipSide) =>
    s === 'top'
      ? r.top - offset - h >= MARGEM
      : s === 'bottom'
        ? r.bottom + offset + h <= vh - MARGEM
        : s === 'left'
          ? r.left - offset - w >= MARGEM
          : r.right + offset + w <= vw - MARGEM;
  let lado = side;
  if (!cabe(lado) && cabe(OPOSTO[lado])) lado = OPOSTO[lado];

  if (lado === 'top' || lado === 'bottom') {
    const y = lado === 'top' ? r.top - offset - h : r.bottom + offset;
    let x = align === 'center' ? r.left + r.width / 2 - w / 2 : align === 'start' ? r.left : r.right - w;
    x = limitar(x + alignOffset, MARGEM, vw - MARGEM - w);
    const seta = limitar(r.left + r.width / 2 - x, 10, w - 10);
    return { x, y, w, h, lado, seta };
  }
  const x = lado === 'left' ? r.left - offset - w : r.right + offset;
  let y = align === 'center' ? r.top + r.height / 2 - h / 2 : align === 'start' ? r.top : r.bottom - h;
  y = limitar(y + alignOffset, MARGEM, vh - MARGEM - h);
  const seta = limitar(r.top + r.height / 2 - y, 10, h - 10);
  return { x, y, w, h, lado, seta };
}

// Deslocamento de entrada/saída: 15 px em direção ao avatar.
function deslocamento(lado: TooltipSide): [number, number] {
  if (lado === 'top') return [0, DESLOC_ENTRADA];
  if (lado === 'bottom') return [0, -DESLOC_ENTRADA];
  if (lado === 'left') return [DESLOC_ENTRADA, 0];
  return [-DESLOC_ENTRADA, 0];
}

// Caixa 12 × 6 da seta, centrada 2 px para fora da borda (1 px sobreposto ao balão).
function caixaSeta(p: Posicao): { x: number; y: number } {
  if (p.lado === 'top') return { x: p.seta - 6, y: p.h - 1 };
  if (p.lado === 'bottom') return { x: p.seta - 6, y: -5 };
  if (p.lado === 'left') return { x: p.w - 4, y: p.seta - 3 };
  return { x: -8, y: p.seta - 3 };
}

interface AvatarProps {
  item: AvatarGroupItem;
  indice: number;
  total: number;
  firstOnTop: boolean;
  size: number;
  overlap: number;
  lift: string | number;
  transicaoSalto: Transition;
  aberto: boolean;
  idBalao: string;
  escuro: boolean;
  registrar: (i: number, el: HTMLButtonElement | null) => void;
  abrir: (i: number) => void;
  agendarFechar: () => void;
  fecharJa: () => void;
}

function Avatar({
  item,
  indice,
  total,
  firstOnTop,
  size,
  overlap,
  lift,
  transicaoSalto,
  aberto,
  idBalao,
  escuro,
  registrar,
  abrir,
  agendarFechar,
  fecharJa,
}: AvatarProps) {
  const [hover, setHover] = useState(false);
  const [pressionado, setPressionado] = useState(false);
  const [focoTeclado, setFocoTeclado] = useState(false);
  const abertoNoToque = useRef(false);
  const elevado = hover || pressionado || focoTeclado;
  const corFundoPagina = escuro ? '#0a0a0a' : '#ffffff';
  const corTexto = escuro ? '#fafafa' : '#0a0a0a';

  return (
    <button
      ref={(el) => registrar(indice, el)}
      type="button"
      aria-label={item.name}
      aria-describedby={aberto ? idBalao : undefined}
      className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        position: 'relative',
        flexShrink: 0,
        width: size,
        height: size,
        marginLeft: indice === 0 ? 0 : -overlap,
        zIndex: firstOnTop ? total - indice : indice,
        padding: 0,
        border: 0,
        background: 'transparent',
        borderRadius: '50%',
        cursor: 'pointer',
        outlineColor: corTexto,
        WebkitTapHighlightColor: 'transparent',
      }}
      onPointerEnter={(e) => {
        if (e.pointerType === 'touch') return;
        setHover(true);
        abrir(indice);
      }}
      onPointerLeave={(e) => {
        setPressionado(false);
        if (e.pointerType === 'touch') return;
        setHover(false);
        agendarFechar();
      }}
      onPointerDown={(e) => {
        abertoNoToque.current = aberto;
        setPressionado(true);
        if (e.pointerType === 'touch' && !aberto) abrir(indice);
      }}
      onPointerUp={() => setPressionado(false)}
      onPointerCancel={() => setPressionado(false)}
      onClick={() => {
        // Clique/toque com o balão aberto fecha na hora; o foco do clique não reabre (só :focus-visible abre).
        if (abertoNoToque.current) fecharJa();
        abertoNoToque.current = false;
      }}
      onFocus={(e) => {
        let visivel = false;
        try {
          visivel = e.currentTarget.matches(':focus-visible');
        } catch {
          visivel = false;
        }
        if (visivel) {
          setFocoTeclado(true);
          abrir(indice);
        }
      }}
      onBlur={() => {
        setFocoTeclado(false);
        agendarFechar();
      }}
    >
      <motion.span
        animate={{ y: elevado ? lift : 0 }}
        transition={transicaoSalto}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          boxSizing: 'border-box',
          borderRadius: '50%',
          overflow: 'hidden',
          border: `3px solid ${corFundoPagina}`,
          background: item.background ?? (escuro ? '#262626' : '#f5f5f5'),
          color: corTexto,
          fontSize: Math.round(size / 3),
          fontWeight: 600,
          lineHeight: 1,
          userSelect: 'none',
          pointerEvents: 'none',
          ...item.textStyle,
        }}
      >
        {item.content ??
          (item.src ? (
            <img src={item.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            item.initials
          ))}
      </motion.span>
    </button>
  );
}

export function AvatarGroup({
  avatars,
  firstOnTop = true,
  lift = '-30%',
  liftSpring = { stiffness: 300, damping: 17 },
  tooltipSpring = { stiffness: 300, damping: 35 },
  openDelay = 0,
  closeDelay = 0,
  side = 'top',
  sideOffset = 25,
  align = 'center',
  alignOffset = 0,
  overlap = 12,
  size = 48,
  className,
  style,
  ...resto
}: AvatarGroupProps) {
  const grupoRef = useRef<HTMLDivElement>(null);
  const medidaRef = useRef<HTMLDivElement>(null);
  const itensRef = useRef<(HTMLButtonElement | null)[]>([]);
  const escuro = useTemaEscuro(grupoRef);
  const reduzido = useReducedMotion() ?? false;
  const idBalao = useId();

  const [aberto, setAberto] = useState<number | null>(null);
  const [pos, setPos] = useState<Posicao | null>(null);
  const abertoRef = useRef<number | null>(null);
  const timerAbrir = useRef<number | undefined>(undefined);
  const timerFechar = useRef<number | undefined>(undefined);
  const ultimoFechamento = useRef(-Infinity);

  const registrar = useCallback((i: number, el: HTMLButtonElement | null) => {
    itensRef.current[i] = el;
  }, []);

  const definir = useCallback((i: number) => {
    abertoRef.current = i;
    setAberto(i);
  }, []);

  const abrir = useCallback(
    (i: number) => {
      window.clearTimeout(timerFechar.current);
      window.clearTimeout(timerAbrir.current);
      const imediato =
        abertoRef.current !== null || performance.now() - ultimoFechamento.current < closeDelay || openDelay <= 0;
      if (imediato) definir(i);
      else timerAbrir.current = window.setTimeout(() => definir(i), openDelay);
    },
    [closeDelay, openDelay, definir],
  );

  const fecharJa = useCallback(() => {
    window.clearTimeout(timerAbrir.current);
    window.clearTimeout(timerFechar.current);
    if (abertoRef.current === null) return;
    abertoRef.current = null;
    ultimoFechamento.current = performance.now();
    setAberto(null);
  }, []);

  const agendarFechar = useCallback(() => {
    window.clearTimeout(timerAbrir.current);
    window.clearTimeout(timerFechar.current);
    if (abertoRef.current === null) return;
    timerFechar.current = window.setTimeout(fecharJa, closeDelay);
  }, [closeDelay, fecharJa]);

  useEffect(
    () => () => {
      window.clearTimeout(timerAbrir.current);
      window.clearTimeout(timerFechar.current);
    },
    [],
  );

  // Posição sempre calculada a partir do alvo atual (índice aberto → elemento registrado).
  useLayoutEffect(() => {
    if (aberto === null) {
      setPos(null);
      return;
    }
    const alvo = itensRef.current[aberto];
    const medida = medidaRef.current;
    if (!alvo || !medida) return;
    const rm = medida.getBoundingClientRect();
    const w = Math.ceil(rm.width);
    const h = Math.ceil(rm.height);
    const base = calcularPosicao(alvo.getBoundingClientRect(), w, h, side, sideOffset, align, alignOffset);
    const fonte = grupoRef.current ? getComputedStyle(grupoRef.current).fontFamily : 'inherit';
    setPos({ ...base, fonte });
  }, [aberto, avatars, side, sideOffset, align, alignOffset]);

  // Fechamento imediato: Escape, rolagem que move o grupo, redimensionamento, toque fora.
  useEffect(() => {
    if (aberto === null) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fecharJa();
    };
    const aoRolar = (e: Event) => {
      const alvo = e.target;
      const grupo = grupoRef.current;
      if (!grupo || alvo === document || alvo === window || (alvo instanceof Node && alvo.contains(grupo))) fecharJa();
    };
    const aoPressionar = (e: PointerEvent) => {
      const grupo = grupoRef.current;
      if (grupo && e.target instanceof Node && !grupo.contains(e.target)) fecharJa();
    };
    document.addEventListener('keydown', aoTeclar);
    window.addEventListener('scroll', aoRolar, { capture: true, passive: true });
    window.addEventListener('resize', fecharJa);
    document.addEventListener('pointerdown', aoPressionar, true);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('scroll', aoRolar, { capture: true });
      window.removeEventListener('resize', fecharJa);
      document.removeEventListener('pointerdown', aoPressionar, true);
    };
  }, [aberto, fecharJa]);

  const transicaoSalto: Transition = reduzido
    ? { duration: 0.15, ease: 'easeOut' }
    : { type: 'spring', stiffness: liftSpring.stiffness, damping: liftSpring.damping, mass: 1 };
  const mola = { type: 'spring' as const, stiffness: tooltipSpring.stiffness, damping: tooltipSpring.damping, mass: 1 };
  // Com movimento reduzido: sem deslize entre avatares, só um esmaecer curto.
  const transicaoBalao: Transition = reduzido
    ? { duration: 0, opacity: { duration: 0.12 }, scale: { duration: 0.12 } }
    : mola;

  const corBalao = escuro ? '#fafafa' : '#0a0a0a';
  const corTextoBalao = escuro ? '#0a0a0a' : '#fafafa';
  const conteudo = aberto !== null ? (avatars[aberto]?.tooltip ?? avatars[aberto]?.name) : null;
  const tipografia: CSSProperties = {
    fontSize: 12,
    lineHeight: '16px',
    textAlign: 'center',
    textWrap: 'balance',
    fontFamily: pos?.fonte,
  } as CSSProperties;

  let balao: ReactNode = null;
  if (aberto !== null && pos) {
    const [dx, dy] = deslocamento(pos.lado);
    const s = caixaSeta(pos);
    const fora = reduzido
      ? { opacity: 0, scale: 1, x: pos.x, y: pos.y }
      : { opacity: 0, scale: 0, x: pos.x + dx, y: pos.y + dy };
    balao = (
      <motion.div
        key="balao"
        id={idBalao}
        role="tooltip"
        initial={{ ...fora, width: pos.w, height: pos.h }}
        animate={{ opacity: 1, scale: 1, x: pos.x, y: pos.y, width: pos.w, height: pos.h }}
        exit={fora}
        transition={transicaoBalao}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 50,
          borderRadius: 8,
          background: corBalao,
          color: corTextoBalao,
          pointerEvents: 'none',
          transformOrigin:
            pos.lado === 'top' || pos.lado === 'bottom'
              ? `${pos.seta}px ${pos.lado === 'top' ? pos.h : 0}px`
              : `${pos.lado === 'left' ? pos.w : 0}px ${pos.seta}px`,
        }}
      >
        <div
          style={{
            ...tipografia,
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.max(0, pos.w - 24),
            transform: 'translate(-50%, -50%)',
          }}
        >
          {conteudo}
        </div>
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ x: s.x, y: s.y, rotate: ROTACAO[pos.lado] }}
          transition={reduzido ? { duration: 0 } : mola}
          style={{ position: 'absolute', left: 0, top: 0, width: 12, height: 6 }}
        >
          <svg width={12} height={6} viewBox="0 0 12 6" style={{ display: 'block', overflow: 'visible' }}>
            <path d="M0 0 H12 L7.3 4.9 Q6 6.2 4.7 4.9 Z" fill={corBalao} />
          </svg>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <>
      <div
        ref={grupoRef}
        className={className}
        style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', height: size, ...style }}
        {...resto}
      >
        {avatars.map((item, i) => (
          <Avatar
            key={i}
            item={item}
            indice={i}
            total={avatars.length}
            firstOnTop={firstOnTop}
            size={size}
            overlap={overlap}
            lift={lift}
            transicaoSalto={transicaoSalto}
            aberto={aberto === i}
            idBalao={idBalao}
            escuro={escuro}
            registrar={registrar}
            abrir={abrir}
            agendarFechar={agendarFechar}
            fecharJa={fecharJa}
          />
        ))}
      </div>
      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Medidor invisível do conteúdo do balão (largura ajustada ao conteúdo). */}
            {aberto !== null && (
              <div
                ref={medidaRef}
                aria-hidden="true"
                style={{
                  ...tipografia,
                  fontFamily: grupoRef.current ? getComputedStyle(grupoRef.current).fontFamily : undefined,
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  padding: '6px 12px',
                  width: 'max-content',
                  maxWidth: 'min(240px, calc(100vw - 16px))',
                  boxSizing: 'border-box',
                }}
              >
                {conteudo}
              </div>
            )}
            <AnimatePresence>{balao}</AnimatePresence>
          </>,
          document.body,
        )}
    </>
  );
}

export default AvatarGroup;
