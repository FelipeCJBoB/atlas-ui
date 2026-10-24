// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';

export interface PlayfulTask {
  id: string | number;
  text: string;
  checked?: boolean;
}

export interface PlayfulTodolistProps {
  tasks?: PlayfulTask[];
  /** Duração (s) do desenho e do recuo do rabisco. */
  scribbleDuration?: number;
  onChange?: (id: PlayfulTask['id'], checked: boolean) => void;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
}

export const PLAYFUL_TODOLIST_PADRAO: PlayfulTask[] = [
  { id: 1, text: 'Code in Assembly 💾' },
  { id: 2, text: 'Present a bug as a feature 🪲' },
  { id: 3, text: 'Push to prod on a Friday 🚀' },
];

// Rabisco concebido numa caixa 340 × 32 (só comandos absolutos M/C, pares x,y).
const RABISCO =
  'M4 20 C40 15 88 3 112 5 C132 7 110 22 86 27 C70 30 72 22 96 18 C138 11 180 4 206 4 C228 5 214 22 196 28 C184 31 186 22 206 21 C250 18 298 15 336 13';
const ALTURA_RABISCO = 40;

// Escala o caminho para a largura real do texto, mantendo o traço em 2 px de tela
// sem depender de vector-effect (que confunde o comprimento do tracejado).
function escalarCaminho(d: string, sx: number, sy: number) {
  let k = 0;
  return d.replace(/-?\d*\.?\d+/g, (n) => {
    const v = parseFloat(n) * (k++ % 2 === 0 ? sx : sy);
    return v.toFixed(2);
  });
}

function useTemaEscuro(ref: RefObject<HTMLElement | null>, forcado?: 'light' | 'dark') {
  const [escuro, setEscuro] = useState(forcado === 'dark');
  useLayoutEffect(() => {
    if (forcado) {
      setEscuro(forcado === 'dark');
      return;
    }
    const el = ref.current;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const avaliar = () => {
      const anc = el?.closest('.dark, .light');
      setEscuro(anc ? anc.classList.contains('dark') : mq.matches);
    };
    avaliar();
    mq.addEventListener('change', avaliar);
    const obs = new MutationObserver(avaliar);
    for (let n = el?.parentElement; n; n = n.parentElement) {
      obs.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    return () => {
      mq.removeEventListener('change', avaliar);
      obs.disconnect();
    };
  }, [ref, forcado]);
  return escuro;
}

function Rabisco({ marcada, duracao, cor, reduzir }: { marcada: boolean; duracao: number; cor: string; reduzir: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [largura, setLargura] = useState(200); // valor de fallback antes da medição
  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const medir = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setLargura(w);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const d = escalarCaminho(RABISCO, largura / 340, ALTURA_RABISCO / 32);
  const t: Transition = reduzir
    ? { duration: 0 }
    : {
        pathLength: { duration: duracao, ease: 'easeInOut' },
        // Ao desmarcar, só some quando o recuo termina (evita sobrar a ponta arredondada).
        opacity: { duration: 0.01, delay: marcada ? 0 : duracao },
      };

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      viewBox={`0 0 ${largura} ${ALTURA_RABISCO}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-y-1/2"
      style={{ width: '100%', height: ALTURA_RABISCO, overflow: 'visible' }}
    >
      <motion.path
        d={d}
        fill="none"
        stroke={cor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: marcada ? 1 : 0, opacity: marcada ? 1 : 0 }}
        transition={t}
      />
    </svg>
  );
}

export function PlayfulTodolist({
  tasks = PLAYFUL_TODOLIST_PADRAO,
  scribbleDuration = 1,
  onChange,
  disabled = false,
  theme,
  className,
  style,
}: PlayfulTodolistProps) {
  const raizRef = useRef<HTMLDivElement>(null);
  const escuro = useTemaEscuro(raizRef, theme);
  const reduzir = !!useReducedMotion();
  const base = useId();

  const [estado, setEstado] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((t) => [String(t.id), !!t.checked])),
  );
  // Tarefas novas recebidas depois da montagem entram com o próprio estado inicial.
  useEffect(() => {
    setEstado((prev) => {
      const prox: Record<string, boolean> = {};
      tasks.forEach((t) => {
        const k = String(t.id);
        prox[k] = k in prev ? prev[k] : !!t.checked;
      });
      return prox;
    });
  }, [tasks]);

  const alternar = (id: PlayfulTask['id']) => {
    if (disabled) return;
    const k = String(id);
    const novo = !estado[k];
    setEstado((p) => ({ ...p, [k]: novo }));
    onChange?.(id, novo);
  };

  const c = escuro
    ? {
        cartao: '#171717',
        divisor: '#404040',
        campo: 'rgba(255,255,255,0.15)',
        primaria: '#e5e5e5',
        contraste: '#171717',
        texto: '#fafafa',
        rabisco: '#f5f5f5',
        foco: 'rgba(163,163,163,0.5)',
      }
    : {
        cartao: '#f5f5f5',
        divisor: '#d4d4d4',
        campo: '#e5e5e5',
        primaria: '#171717',
        contraste: '#fafafa',
        texto: '#0a0a0a',
        rabisco: '#171717',
        foco: 'rgba(115,115,115,0.5)',
      };

  return (
    <div
      ref={raizRef}
      className={['flex flex-col', className].filter(Boolean).join(' ')}
      style={{ background: c.cartao, borderRadius: 16, padding: 24, gap: 24, color: c.texto, ...style }}
    >
      {tasks.map((tarefa, i) => {
        const k = String(tarefa.id);
        const marcada = !!estado[k];
        const idCaixa = `${base}-caixa-${k}`;
        const tCheck: Transition = reduzir
          ? { duration: 0 }
          : { duration: 0.2, delay: marcada ? 0.2 : 0 };
        return (
          <Fragment key={k}>
            <div className="flex items-center" style={{ gap: 8 }}>
              <motion.button
                id={idCaixa}
                type="button"
                role="checkbox"
                aria-checked={marcada}
                disabled={disabled}
                onClick={() => alternar(tarefa.id)}
                whileHover={disabled ? undefined : { scale: 1.05 }}
                whileTap={disabled ? undefined : { scale: 0.95 }}
                className="flex shrink-0 items-center justify-center outline-none focus-visible:[outline:3px_solid_var(--ptl-foco)] focus-visible:[outline-offset:2px] disabled:cursor-not-allowed disabled:opacity-50"
                style={
                  {
                    '--ptl-foco': c.foco,
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    border: 'none',
                    padding: 0,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    background: marcada ? c.primaria : c.campo,
                    color: c.contraste,
                    transition: 'background-color 500ms',
                  } as CSSProperties
                }
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <motion.path
                    d="M4.5 12.5 10 18 19.5 6"
                    stroke="currentColor"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={false}
                    animate={{ pathLength: marcada ? 1 : 0, opacity: marcada ? 1 : 0 }}
                    transition={tCheck}
                  />
                </svg>
              </motion.button>
              <span className="relative inline-block">
                <label
                  htmlFor={idCaixa}
                  className="select-none whitespace-nowrap"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    lineHeight: 1,
                    color: c.texto,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                  }}
                >
                  {tarefa.text}
                </label>
                <Rabisco marcada={marcada} duracao={scribbleDuration} cor={c.rabisco} reduzir={reduzir} />
              </span>
            </div>
            {i < tasks.length - 1 && <div aria-hidden="true" style={{ height: 1, width: '100%', background: c.divisor }} />}
          </Fragment>
        );
      })}
    </div>
  );
}

export default PlayfulTodolist;
