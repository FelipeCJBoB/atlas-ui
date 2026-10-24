// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { emLinhas, PALETA_CLARA, PALETA_ESCURA, tokenizar, type Linguagem } from './realce';

export interface CodeBlockWriteInfo {
  index: number;
  length: number;
  done: boolean;
}

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
  /** Código-fonte exibido (e copiado por inteiro). */
  code: string;
  /** Linguagem do realce. */
  lang?: Linguagem;
  /** Ícone do cabeçalho (16 px). */
  icon?: ComponentType<{ className?: string; style?: CSSProperties }>;
  /** Texto do cabeçalho (nome do arquivo). Sem ícone nem título, o cabeçalho some. */
  title?: ReactNode;
  copyButton?: boolean;
  /** Animar a digitação. */
  writing?: boolean;
  /** Duração total da digitação (ms). */
  duration?: number;
  /** Atraso antes de começar (ms). */
  delay?: number;
  /** Mostrar o cursor "|" durante a digitação. */
  cursor?: boolean;
  /** Só começar quando o bloco entrar na viewport. */
  inView?: boolean;
  inViewMargin?: string;
  inViewOnce?: boolean;
  onDone?: () => void;
  onWrite?: (info: CodeBlockWriteInfo) => void;
  /** Tempo mostrando o "check" após copiar (ms). */
  copiedDuration?: number;
}

const FONTE_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

// Tema do ancestral mais próximo (.dark/.light), com fallback para a preferência do sistema.
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

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    /* cai para o método antigo */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

const TROCA_ICONE = {
  initial: { scale: 0, opacity: 0.4, filter: 'blur(4px)' },
  animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
  exit: { scale: 0, opacity: 0.4, filter: 'blur(4px)' },
  transition: { duration: 0.25 },
};

export function CodeBlock({
  code,
  lang = 'tsx',
  icon: Icone,
  title,
  copyButton = false,
  writing = false,
  duration = 5000,
  delay = 0,
  cursor = false,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  onDone,
  onWrite,
  copiedDuration = 3000,
  className,
  style,
  ...resto
}: CodeBlockProps) {
  const raizRef = useRef<HTMLDivElement>(null);
  const corpoRef = useRef<HTMLDivElement>(null);
  const escuro = useTemaEscuro(raizRef);
  const reduzido = useReducedMotion() ?? false;
  const animar = writing && !reduzido;

  // Contagem por ponto de código: offsets[k] = comprimento UTF-16 dos k primeiros pontos.
  const offsets = useMemo(() => {
    const arr = [0];
    for (const ch of code) arr.push(arr[arr.length - 1] + ch.length);
    return arr;
  }, [code]);
  const total = offsets.length - 1;
  // Realça o código inteiro uma única vez; a digitação só corta os tokens.
  const tokens = useMemo(() => tokenizar(code, lang), [code, lang]);

  const [visiveis, setVisiveis] = useState(() => (animar ? 0 : total));
  // ciclo > 0 libera o início (sempre, ou quando entrar na viewport).
  const [ciclo, setCiclo] = useState(inView ? 0 : 1);

  const onDoneRef = useRef(onDone);
  const onWriteRef = useRef(onWrite);
  onDoneRef.current = onDone;
  onWriteRef.current = onWrite;

  useEffect(() => {
    if (!inView) {
      setCiclo((c) => (c > 0 ? c : 1));
      return;
    }
    const el = raizRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setCiclo((c) => (c > 0 ? c : 1));
      return;
    }
    let dentro = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !dentro) {
          dentro = true;
          setCiclo((c) => c + 1);
          if (inViewOnce) io.disconnect();
        } else if (!e.isIntersecting) {
          dentro = false;
        }
      },
      { rootMargin: inViewMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, inViewMargin, inViewOnce]);

  useEffect(() => {
    if (!animar) {
      setVisiveis(total);
      return;
    }
    setVisiveis(0);
    if (ciclo === 0) return;
    if (total === 0) {
      onDoneRef.current?.();
      return;
    }
    const intervalo = duration / total;
    let raf = 0;
    let t0 = 0;
    let ultimo = 0;
    const passo = (agora: number) => {
      if (!t0) t0 = agora;
      const k = Math.min(total, intervalo > 0 ? Math.floor((agora - t0) / intervalo) : total);
      if (k !== ultimo) {
        for (let i = ultimo + 1; i <= k; i++) onWriteRef.current?.({ index: i, length: total, done: i === total });
        ultimo = k;
        setVisiveis(k);
      }
      if (k < total) raf = requestAnimationFrame(passo);
      else onDoneRef.current?.();
    };
    const timer = window.setTimeout(() => {
      raf = requestAnimationFrame(passo);
    }, Math.max(0, delay));
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [animar, ciclo, total, duration, delay, code]);

  // Sem digitação, o estado "concluído" vale desde o início.
  const concluido = !animar || visiveis >= total;
  const linhas = useMemo(() => emLinhas(tokens, offsets[Math.min(visiveis, total)]), [tokens, offsets, visiveis, total]);

  // Rolagem: uma vez por render (no máximo uma por quadro), acompanhando a última linha.
  const [rolavel, setRolavel] = useState(false);
  useEffect(() => {
    const el = corpoRef.current;
    if (!el) return;
    const ha = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
    setRolavel(ha);
    if (animar && visiveis > 0 && el.scrollHeight > el.clientHeight + el.scrollTop + 1) {
      el.scrollTo({ top: el.scrollHeight, behavior: reduzido ? 'auto' : 'smooth' });
    }
  }, [visiveis, animar, reduzido]);
  useEffect(() => {
    const el = corpoRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() =>
      setRolavel(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Copiar
  const [copiado, setCopiado] = useState(false);
  const timerCopia = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerCopia.current), []);
  const copiar = useCallback(async () => {
    const ok = await copiarTexto(code);
    if (!ok) return;
    setCopiado(true);
    window.clearTimeout(timerCopia.current);
    timerCopia.current = window.setTimeout(() => setCopiado(false), copiedDuration);
  }, [code, copiedDuration]);

  const paleta = escuro ? PALETA_ESCURA : PALETA_CLARA;
  const corBorda = escuro ? 'rgba(255,255,255,0.10)' : '#e5e5e5';
  const corAtenuada = escuro ? '#a1a1a1' : '#737373';
  const mostrarCabecalho = Boolean(Icone || title || copyButton);
  const mostrarCursor = cursor && !concluido;

  return (
    <div
      ref={raizRef}
      className={className}
      aria-busy={!concluido || undefined}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `1px solid ${corBorda}`,
        borderRadius: 10,
        background: escuro ? 'rgba(38,38,38,0.5)' : 'rgba(245,245,245,0.5)',
        ...style,
      }}
      {...resto}
    >
      {mostrarCabecalho && (
        <div
          style={{
            height: 40,
            width: '100%',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 16px',
            boxSizing: 'border-box',
            background: escuro ? '#262626' : '#f5f5f5',
            borderBottom: `1px solid ${escuro ? 'rgba(255,255,255,0.05)' : 'rgba(229,229,229,0.75)'}`,
            fontSize: 14,
            color: corAtenuada,
          }}
        >
          {Icone && <Icone style={{ width: 16, height: 16, flexShrink: 0 }} />}
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          {copyButton && (
            <motion.button
              type="button"
              aria-label="Copiar código"
              title="Copiar código"
              onClick={copiar}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              whileHover={{ scale: 1.05, backgroundColor: escuro ? 'rgba(38,38,38,0.5)' : '#f5f5f5' }}
              whileTap={{ scale: 0.95 }}
              style={{
                position: 'relative',
                width: 28,
                height: 28,
                padding: 8,
                marginLeft: 'auto',
                flexShrink: 0,
                border: 0,
                borderRadius: 8,
                background: 'transparent',
                backgroundColor: 'rgba(0,0,0,0)',
                color: 'inherit',
                cursor: 'pointer',
                outlineColor: escuro ? '#fafafa' : '#0a0a0a',
              }}
            >
              <AnimatePresence initial={false}>
                <motion.span
                  key={copiado ? 'check' : 'copy'}
                  {...TROCA_ICONE}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {copiado ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          )}
          <span aria-live="polite" style={SR_ONLY}>
            {copiado ? 'Código copiado' : ''}
          </span>
        </div>
      )}

      <div
        ref={corpoRef}
        tabIndex={rolavel ? 0 : undefined}
        style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16, boxSizing: 'border-box' }}
      >
        {/* Para leitores de tela: o código completo, sem anunciar caractere a caractere. */}
        {!concluido && <span style={SR_ONLY}>{code}</span>}
        <pre
          aria-hidden={!concluido || undefined}
          style={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            border: 0,
            fontFamily: FONTE_MONO,
            fontSize: 13,
            lineHeight: 1.6,
            whiteSpace: 'pre',
            color: paleta.plain,
          }}
        >
          <code style={{ fontFamily: 'inherit', background: 'transparent', padding: 0 }}>
            {linhas.map((linha, i) => (
              <Fragment key={i}>
                {i > 0 && '\n'}
                <span>
                  {linha.map((tk, j) =>
                    tk.k === 'plain' ? (
                      <Fragment key={j}>{tk.t}</Fragment>
                    ) : (
                      <span key={j} style={{ color: paleta[tk.k] }}>
                        {tk.t}
                      </span>
                    ),
                  )}
                  {mostrarCursor && i === linhas.length - 1 && (
                    <motion.span
                      aria-hidden="true"
                      style={{ display: 'inline-block', width: '1ch', x: -1, y: -1, color: paleta.plain }}
                      animate={{ opacity: [1, 1, 0, 0] }}
                      transition={{ duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: 'linear' }}
                    >
                      |
                    </motion.span>
                  )}
                </span>
              </Fragment>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

export default CodeBlock;
