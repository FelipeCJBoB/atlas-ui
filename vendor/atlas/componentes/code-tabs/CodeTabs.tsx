// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
// Observação: as abas são identificadas pelos rótulos (chaves do mapa `codes`); internamente
// o componente trabalha com índices. Rótulos repetidos não são possíveis num mapa.
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { emLinhas, PALETA_CLARA, PALETA_ESCURA, tokenizar, type Linguagem } from './realce';

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

export interface CodeTabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> {
  /** Código por rótulo de aba. */
  codes: Record<string, string>;
  /** Linguagem do realce. */
  lang?: Linguagem;
  /** Aba inicial (não controlado). Padrão: primeira chave. */
  defaultValue?: string;
  /** Aba ativa (controlado). */
  value?: string;
  onValueChange?: (value: string) => void;
  copyButton?: boolean;
  onCopiedChange?: (copied: boolean, content?: string) => void;
  indicatorSpring?: SpringConfig;
  panelSpring?: SpringConfig;
  /** Tempo mostrando o "check" após copiar (ms). */
  copiedDuration?: number;
}

const FONTE_MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const RESPIRO = 8; // px entre painéis na faixa

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

function arredondarPixel(v: number): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return Math.round(v * dpr) / dpr;
}

export function CodeTabs({
  codes,
  lang = 'bash',
  defaultValue,
  value,
  onValueChange,
  copyButton = true,
  onCopiedChange,
  indicatorSpring = { stiffness: 200, damping: 25 },
  panelSpring = { stiffness: 300, damping: 30 },
  copiedDuration = 3000,
  className,
  style,
  ...resto
}: CodeTabsProps) {
  const raizRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const janelaRef = useRef<HTMLDivElement>(null);
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);
  const paineisRef = useRef<(HTMLDivElement | null)[]>([]);
  const escuro = useTemaEscuro(raizRef);
  const reduzido = useReducedMotion() ?? false;
  const baseId = useId();

  const chaves = useMemo(() => Object.keys(codes), [codes]);
  const [interno, setInterno] = useState<string | undefined>(defaultValue);
  const atual = value ?? interno ?? chaves[0];
  const indice = Math.max(0, chaves.indexOf(atual ?? ''));
  const chaveAtiva = chaves[indice];

  const selecionar = useCallback(
    (i: number) => {
      const k = chaves[i];
      if (k === undefined) return;
      if (value === undefined) setInterno(k);
      if (k !== chaveAtiva) onValueChange?.(k);
    },
    [chaves, value, chaveAtiva, onValueChange],
  );

  // Realce síncrono: tokens por aba.
  const realces = useMemo(() => chaves.map((k) => emLinhas(tokenizar(codes[k] ?? '', lang))), [chaves, codes, lang]);

  // ---- Indicador (posição e largura medidas no rótulo ativo) ----
  const [indicador, setIndicador] = useState<{ x: number; w: number } | null>(null);
  const medirIndicador = useCallback(() => {
    const b = abasRef.current[indice];
    if (!b) return;
    setIndicador((ant) =>
      ant && ant.x === b.offsetLeft && ant.w === b.offsetWidth ? ant : { x: b.offsetLeft, w: b.offsetWidth },
    );
  }, [indice]);
  useLayoutEffect(medirIndicador, [medirIndicador, chaves]);
  useEffect(() => {
    const el = listaRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => medirIndicador());
    ro.observe(el);
    abasRef.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, [medirIndicador, chaves]);

  // ---- Faixa de painéis: largura da janela e altura do painel ativo ----
  const [largura, setLargura] = useState(0);
  const [altura, setAltura] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = janelaRef.current;
    if (!el) return;
    setLargura(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setLargura(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    const p = paineisRef.current[indice];
    if (!p) return;
    const ler = () => setAltura(arredondarPixel(p.getBoundingClientRect().height));
    ler();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(ler);
    ro.observe(p);
    return () => ro.disconnect();
  }, [indice, chaves]);

  // ---- Copiar ----
  const [copiado, setCopiado] = useState(false);
  const timerCopia = useRef<number | undefined>(undefined);
  const onCopiedRef = useRef(onCopiedChange);
  onCopiedRef.current = onCopiedChange;
  useEffect(() => () => window.clearTimeout(timerCopia.current), []);
  const copiar = useCallback(async () => {
    const conteudo = codes[chaveAtiva] ?? '';
    const ok = await copiarTexto(conteudo);
    if (!ok) return;
    setCopiado(true);
    onCopiedRef.current?.(true, conteudo);
    window.clearTimeout(timerCopia.current);
    timerCopia.current = window.setTimeout(() => {
      setCopiado(false);
      onCopiedRef.current?.(false);
    }, copiedDuration);
  }, [codes, chaveAtiva, copiedDuration]);

  // Navegação por teclado com foco "roving".
  const aoTeclar = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = chaves.length;
    if (!n) return;
    let alvo = -1;
    if (e.key === 'ArrowRight') alvo = (indice + 1) % n;
    else if (e.key === 'ArrowLeft') alvo = (indice - 1 + n) % n;
    else if (e.key === 'Home') alvo = 0;
    else if (e.key === 'End') alvo = n - 1;
    if (alvo < 0) return;
    e.preventDefault();
    selecionar(alvo);
    abasRef.current[alvo]?.focus();
  };

  const paleta = escuro ? PALETA_ESCURA : PALETA_CLARA;
  const corBorda = escuro ? 'rgba(255,255,255,0.10)' : '#e5e5e5';
  const corTexto = escuro ? '#fafafa' : '#0a0a0a';
  const corAtenuada = escuro ? '#a1a1a1' : '#737373';
  const instantaneo = { duration: 0 };
  const molaIndicador = reduzido ? instantaneo : { type: 'spring' as const, ...indicatorSpring, mass: 1 };
  const molaPainel = reduzido ? instantaneo : { type: 'spring' as const, ...panelSpring, mass: 1 };

  return (
    <div
      ref={raizRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        overflow: 'hidden',
        borderRadius: 14,
        border: `1px solid ${corBorda}`,
        background: escuro ? 'rgba(38,38,38,0.5)' : 'rgba(245,245,245,0.5)',
        boxSizing: 'border-box',
        ...style,
      }}
      {...resto}
    >
      {/* Cabeçalho */}
      <div
        style={{
          height: 40,
          width: '100%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxSizing: 'border-box',
          background: escuro ? '#262626' : '#f5f5f5',
          borderBottom: `1px solid ${escuro ? 'rgba(255,255,255,0.05)' : 'rgba(229,229,229,0.75)'}`,
        }}
      >
        <div
          ref={listaRef}
          role="tablist"
          aria-orientation="horizontal"
          onKeyDown={aoTeclar}
          style={{ position: 'relative', display: 'flex', gap: 12, height: '100%', alignItems: 'stretch', minWidth: 0 }}
        >
          {chaves.map((k, i) => {
            const ativa = i === indice;
            return (
              <button
                key={k}
                ref={(el) => {
                  abasRef.current[i] = el;
                }}
                id={`${baseId}-aba-${i}`}
                type="button"
                role="tab"
                aria-selected={ativa}
                aria-controls={`${baseId}-painel-${i}`}
                tabIndex={ativa ? 0 : -1}
                onClick={() => selecionar(i)}
                className="focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                style={{
                  height: '100%',
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  color: ativa ? corTexto : corAtenuada,
                  outlineColor: corTexto,
                  transition: reduzido ? undefined : 'color 0.2s ease',
                }}
              >
                {k}
              </button>
            );
          })}
          {indicador && (
            <motion.div
              aria-hidden="true"
              initial={false}
              animate={{ x: indicador.x, width: indicador.w }}
              transition={molaIndicador}
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                height: 2,
                borderRadius: '9999px 9999px 0 0',
                background: corTexto,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {copyButton && (
          <motion.button
            type="button"
            aria-label="Copiar código"
            title="Copiar código"
            onClick={copiar}
            whileHover={{ backgroundColor: escuro ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)' }}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={{
              position: 'relative',
              width: 28,
              height: 28,
              flexShrink: 0,
              marginRight: -10,
              padding: 0,
              border: 0,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0)',
              color: corAtenuada,
              cursor: 'pointer',
              outlineColor: corTexto,
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

      {/* Janela dos painéis: anima a altura até a do painel ativo */}
      <motion.div
        ref={janelaRef}
        initial={false}
        animate={{ height: altura ?? 'auto' }}
        transition={molaPainel}
        style={{ position: 'relative', overflow: 'hidden', width: '100%' }}
      >
        <motion.div
          initial={false}
          animate={{ x: -indice * (largura + RESPIRO) }}
          transition={molaPainel}
          style={{ display: 'flex', gap: RESPIRO, alignItems: 'flex-start', width: '100%' }}
        >
          {chaves.map((k, i) => {
            const ativo = i === indice;
            return (
              <motion.div
                key={k}
                ref={(el: HTMLDivElement | null) => {
                  paineisRef.current[i] = el;
                }}
                id={`${baseId}-painel-${i}`}
                role="tabpanel"
                aria-labelledby={`${baseId}-aba-${i}`}
                aria-hidden={!ativo || undefined}
                inert={!ativo}
                initial={false}
                animate={{ filter: ativo || reduzido ? 'blur(0px)' : 'blur(4px)' }}
                transition={reduzido ? instantaneo : { type: 'spring', stiffness: 200, damping: 25 }}
                style={{ flex: '0 0 100%', minWidth: 0 }}
              >
                <pre
                  tabIndex={ativo ? 0 : -1}
                  style={{
                    margin: 0,
                    padding: 16,
                    overflow: 'auto',
                    background: 'transparent',
                    border: 0,
                    fontFamily: FONTE_MONO,
                    fontSize: 13,
                    lineHeight: 1.6,
                    whiteSpace: 'pre',
                    color: paleta.plain,
                    boxSizing: 'border-box',
                    outlineColor: corTexto,
                  }}
                >
                  <code style={{ fontFamily: 'inherit', background: 'transparent', padding: 0 }}>
                    {realces[i]?.map((linha, li) => (
                      <Fragment key={li}>
                        {li > 0 && '\n'}
                        {linha.map((tk, j) =>
                          tk.k === 'plain' ? (
                            <Fragment key={j}>{tk.t}</Fragment>
                          ) : (
                            <span key={j} style={{ color: paleta[tk.k] }}>
                              {tk.t}
                            </span>
                          ),
                        )}
                      </Fragment>
                    ))}
                  </code>
                </pre>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default CodeTabs;
