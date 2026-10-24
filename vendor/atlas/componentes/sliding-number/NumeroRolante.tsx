// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';

export interface MolaRolo {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export interface NumeroRolanteProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Valor-alvo a exibir. */
  valor: number;
  /** Valor inicial da contagem; se ausente, troca direta (modo A). */
  valorInicial?: number;
  /** Aviso a cada valor exibido durante a contagem (modo B). */
  aoMudarValor?: (valor: number) => void;
  /** Completa com zeros à esquerda até o número de dígitos do alvo. */
  preencherZeros?: boolean;
  separadorDecimal?: string;
  casasDecimais?: number;
  /** Separador de milhar; ausente = sem agrupamento. */
  separadorMilhar?: string;
  /** Mola de cada coluna. */
  mola?: MolaRolo;
  /** Atraso em ms antes de iniciar a contagem / rolar as colunas decimais. */
  atraso?: number;
  /** Aparece já no valor-alvo, sem animar na montagem. */
  estavelNaMontagem?: boolean;
  /** Só anima quando estiver visível na tela. */
  animarAoVer?: boolean;
  /** Margem (CSS) para a detecção de visibilidade. */
  margemVisibilidade?: string;
  /** Detecta a visibilidade só uma vez. */
  verUmaVez?: boolean;
}

const MOLA_PADRAO = { stiffness: 200, damping: 20, mass: 0.4 };
const MOLA_CONTAGEM = { stiffness: 90, damping: 50 };

// Deslocamento circular (em "alturas") do algarismo d quando o rolo está em v: faixa (−5, 5].
function deslocamento(d: number, v: number) {
  let o = (((d - v) % 10) + 10) % 10;
  if (o > 5) o -= 10;
  return o;
}

function arredondar(v: number, casas: number) {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}

function partes(v: number, casas: number) {
  const [int, frac = ''] = Math.abs(v).toFixed(casas).split('.');
  return { int, frac };
}

function Algarismo({
  d,
  rolo,
  altura,
}: {
  d: number;
  rolo: MotionValue<number>;
  altura: MotionValue<number>;
}) {
  // Com altura medida, desloca em px; sem medição, cai para "em" (altura de linha 1 = 1em).
  const y = useTransform([rolo, altura], ([v, h]: number[]) => {
    const o = deslocamento(d, v);
    return h > 0 ? `${o * h}px` : `${o}em`;
  });
  return (
    <motion.span
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        y,
      }}
    >
      {d}
    </motion.span>
  );
}

function Coluna({
  digito,
  inicial,
  atraso,
  mola,
  reduzir,
}: {
  digito: number;
  inicial: number;
  atraso: number;
  mola: Required<MolaRolo>;
  reduzir: boolean;
}) {
  const rolo = useSpring(inicial, mola);
  const altura = useMotionValue(0);
  const medidor = useRef<HTMLSpanElement>(null);

  // Mede a altura de uma linha (o "0" invisível) e acompanha mudanças de fonte/zoom.
  useEffect(() => {
    const el = medidor.current;
    if (!el) return;
    const medir = () => altura.set(el.getBoundingClientRect().height);
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [altura]);

  useEffect(() => {
    const rolar = () => {
      const atual = rolo.get();
      // Caminho mais curto no círculo: 9 → 0 avança um passo.
      let delta = (((digito - atual) % 10) + 10) % 10;
      if (delta > 5) delta -= 10;
      if (reduzir) rolo.jump(atual + delta);
      else rolo.set(atual + delta);
    };
    if (atraso > 0 && !reduzir) {
      const t = setTimeout(rolar, atraso);
      return () => clearTimeout(t);
    }
    rolar();
  }, [digito, atraso, reduzir, rolo]);

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '1ch',
        minHeight: '1em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        overflowX: 'visible',
        overflowY: 'clip',
      }}
    >
      <span ref={medidor} style={{ visibility: 'hidden', display: 'block', lineHeight: 1 }}>
        0
      </span>
      {Array.from({ length: 10 }, (_, d) => (
        <Algarismo key={d} d={d} rolo={rolo} altura={altura} />
      ))}
    </span>
  );
}

export function NumeroRolante({
  valor,
  valorInicial,
  aoMudarValor,
  preencherZeros = false,
  separadorDecimal = '.',
  casasDecimais = 0,
  separadorMilhar,
  mola,
  atraso = 0,
  estavelNaMontagem = false,
  animarAoVer = false,
  margemVisibilidade = '0px',
  verUmaVez = true,
  className,
  ...resto
}: NumeroRolanteProps) {
  const casas = Math.max(0, Math.floor(casasDecimais));
  const molaColuna: Required<MolaRolo> = useMemo(
    () => ({ ...MOLA_PADRAO, ...mola }),
    [mola?.stiffness, mola?.damping, mola?.mass], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const contando = valorInicial !== undefined;
  const reduzir = useReducedMotion() ?? false;

  const raiz = useRef<HTMLSpanElement>(null);
  const emVista = useInView(raiz, {
    once: verUmaVez,
    margin: margemVisibilidade as NonNullable<Parameters<typeof useInView>[1]>['margin'],
  });
  // Estável na montagem: já nasce no alvo, então conta como visível desde o início.
  const visivel = !animarAoVer || emVista || estavelNaMontagem;

  // ---- Modo B: contagem por mola lenta ----
  const partida = estavelNaMontagem ? valor : valorInicial ?? 0;
  const contador = useSpring(partida, MOLA_CONTAGEM);
  const [contado, setContado] = useState(() => arredondar(partida, casas));
  const ultimo = useRef(contado);
  const avisar = useRef(aoMudarValor);
  avisar.current = aoMudarValor;

  useEffect(() => {
    if (!contando) return;
    return contador.on('change', (v) => {
      const r = arredondar(v, casas);
      if (r === ultimo.current) return;
      ultimo.current = r;
      setContado(r);
      avisar.current?.(r);
    });
  }, [contando, contador, casas]);

  useEffect(() => {
    if (!contando || !visivel) return;
    if (reduzir) {
      contador.jump(valor);
      return;
    }
    if (atraso > 0) {
      const t = setTimeout(() => contador.set(valor), atraso);
      return () => clearTimeout(t);
    }
    contador.set(valor);
  }, [contando, visivel, valor, atraso, reduzir, contador]);

  // ---- Valor exibido ----
  const exibido = contando ? contado : visivel ? arredondar(valor, casas) : 0;
  const { int, frac } = partes(exibido, casas);
  const larguraInt = preencherZeros
    ? Math.max(partes(valor, casas).int.length, int.length)
    : int.length;
  const intCompleto = int.padStart(larguraInt, '0');

  // Valor anterior: ponto de partida dos rolos recém-montados (sem histórico = 0).
  const anterior = useRef<number>(estavelNaMontagem ? valor : 0);
  useEffect(() => {
    anterior.current = exibido;
  });
  const ant = partes(anterior.current, casas);
  const antInt = ant.int.padStart(larguraInt, '0').slice(-larguraInt);
  const antFrac = ant.frac.slice(0, casas).padEnd(casas, '0');

  const negativo = exibido < 0;

  const itens: ReactNode[] = [];
  for (let i = 0; i < larguraInt; i++) {
    const ordem = larguraInt - 1 - i; // 0 = unidades
    itens.push(
      <Coluna
        key={`i${ordem}`}
        digito={Number(intCompleto[i])}
        inicial={Number(antInt[i])}
        atraso={0}
        mola={molaColuna}
        reduzir={reduzir}
      />,
    );
    if (separadorMilhar && ordem > 0 && ordem % 3 === 0) {
      itens.push(
        <span key={`m${ordem}`} aria-hidden="true">
          {separadorMilhar}
        </span>,
      );
    }
  }
  if (casas > 0) {
    itens.push(
      <span key="sep-dec" aria-hidden="true">
        {separadorDecimal}
      </span>,
    );
    for (let k = 0; k < casas; k++) {
      itens.push(
        <Coluna
          key={`f${k}`}
          digito={Number(frac[k])}
          inicial={Number(antFrac[k])}
          atraso={atraso}
          mola={molaColuna}
          reduzir={reduzir}
        />,
      );
    }
  }

  // Texto acessível com o valor-alvo formatado.
  const alvo = partes(valor, casas);
  const alvoInt = separadorMilhar
    ? alvo.int.replace(/\B(?=(\d{3})+(?!\d))/g, separadorMilhar)
    : alvo.int;
  const rotulo =
    (valor < 0 ? '−' : '') + alvoInt + (casas > 0 ? separadorDecimal + alvo.frac : '');

  return (
    <span
      ref={raiz}
      className={className}
      {...resto}
      style={{ display: 'inline-flex', alignItems: 'center', ...resto.style }}
    >
      {negativo && (
        <span aria-hidden="true" style={{ marginRight: '0.25rem' }}>
          -
        </span>
      )}
      {itens}
      <span
        aria-live="polite"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {rotulo}
      </span>
    </span>
  );
}

export default NumeroRolante;
