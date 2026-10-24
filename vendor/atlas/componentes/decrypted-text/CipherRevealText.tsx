// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';

export type RevealDirection = 'start' | 'end' | 'center';
export type CipherTrigger = 'hover' | 'view' | 'view-hover' | 'click';
export type CipherClickMode = 'once' | 'toggle';

export const DEFAULT_CIPHER_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+';

export interface CipherRevealTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Texto final exibido. */
  text?: string;
  /** Intervalo entre tiques (ms). */
  tickMs?: number;
  /** Tiques do modo simultâneo (e base do lote ao recifrar). */
  iterations?: number;
  /** Revela um caractere por tique. */
  sequential?: boolean;
  /** Ordem da revelação sequencial. */
  direction?: RevealDirection;
  /** Embaralha apenas com os caracteres presentes no próprio texto. */
  originalCharsOnly?: boolean;
  /** Conjunto de caracteres de embaralhamento. */
  charset?: string;
  /** Classe dos caracteres revelados. */
  revealedClassName?: string;
  /** Classe dos caracteres ainda cifrados. */
  scrambledClassName?: string;
  /** Classe do contêiner externo. */
  className?: string;
  /** Modo de disparo. */
  trigger?: CipherTrigger;
  /** Comportamento do clique (só no disparo por clique). */
  clickMode?: CipherClickMode;
}

type Snapshot = {
  shown: string[];
  revealed: Set<number>;
  animating: boolean;
  decrypted: boolean;
};

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const EMPTY = new Set<number>();

function scramble(chars: string[], revealed: Set<number>, pool: string[]): string[] {
  return chars.map((ch, i) =>
    ch === ' ' || revealed.has(i) ? ch : pool[Math.floor(Math.random() * pool.length)],
  );
}

// Ordem de revelação; no "centro" alterna meio, meio−1, meio+1… com fallback
// para a primeira posição livre da esquerda quando o índice calculado não serve.
function buildOrder(len: number, direction: RevealDirection): number[] {
  const range = Array.from({ length: len }, (_, i) => i);
  if (direction === 'start') return range;
  if (direction === 'end') return range.reverse();
  const used = new Set<number>();
  const out: number[] = [];
  const mid = Math.floor(len / 2);
  for (let step = 0; step < len; step++) {
    let idx = mid;
    if (step > 0) {
      const k = Math.ceil(step / 2);
      idx = step % 2 === 1 ? mid - k : mid + k;
    }
    if (idx < 0 || idx >= len || used.has(idx)) {
      idx = 0;
      while (used.has(idx)) idx++;
    }
    used.add(idx);
    out.push(idx);
  }
  return out;
}

function useReducedMotionPref(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function CipherRevealText({
  text = '',
  tickMs = 50,
  iterations = 10,
  sequential = false,
  direction = 'start',
  originalCharsOnly = false,
  charset = DEFAULT_CIPHER_CHARSET,
  revealedClassName = '',
  scrambledClassName = '',
  className = '',
  trigger = 'hover',
  clickMode = 'once',
  style,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onKeyDown,
  ...rest
}: CipherRevealTextProps) {
  const reduced = useReducedMotionPref();
  const chars = useMemo(() => Array.from(text), [text]);
  const pool = useMemo(() => {
    const src = originalCharsOnly
      ? Array.from(new Set(chars.filter((c) => c !== ' ')))
      : Array.from(charset);
    return src.length > 0 ? src : Array.from(DEFAULT_CIPHER_CHARSET);
  }, [originalCharsOnly, chars, charset]);

  // Configuração mais recente, lida pelos tiques sem recriar callbacks.
  const cfg = useRef({ chars, pool, tickMs, iterations, sequential, direction, reduced });
  cfg.current = { chars, pool, tickMs, iterations, sequential, direction, reduced };

  const startsScrambled = trigger === 'click' && !reduced;
  const [snap, setSnap] = useState<Snapshot>(() => ({
    shown: startsScrambled ? scramble(chars, EMPTY, pool) : chars,
    revealed: new Set(),
    animating: false,
    decrypted: !startsScrambled,
  }));
  const snapRef = useRef(snap);
  const commit = useCallback((next: Snapshot) => {
    snapRef.current = next;
    setSnap(next);
  }, []);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showPlain = useCallback(() => {
    stopTimer();
    commit({ shown: cfg.current.chars, revealed: new Set(), animating: false, decrypted: true });
  }, [commit, stopTimer]);

  const run = useCallback(
    (mode: 'decrypt' | 'encrypt') => {
      stopTimer();
      const { chars: c, pool: p, tickMs: ms, iterations: it, sequential: seq, direction: dir } =
        cfg.current;
      const n = c.length;
      if (cfg.current.reduced || n === 0) {
        showPlain();
        return;
      }
      const maxIter = Math.max(1, Math.floor(it));
      const interval = Math.max(1, ms);

      const finish = (decrypted: boolean) => {
        stopTimer();
        commit({
          shown: decrypted ? c : scramble(c, EMPTY, p),
          revealed: new Set(),
          animating: false,
          decrypted,
        });
      };

      if (mode === 'decrypt') {
        const revealed = new Set<number>();
        commit({ shown: scramble(c, revealed, p), revealed: new Set(), animating: true, decrypted: false });
        if (seq) {
          const order = buildOrder(n, dir);
          let ptr = 0;
          timerRef.current = setInterval(() => {
            revealed.add(order[ptr++]);
            if (ptr >= order.length) finish(true);
            else
              commit({ shown: scramble(c, revealed, p), revealed: new Set(revealed), animating: true, decrypted: false });
          }, interval);
        } else {
          let iter = 0;
          timerRef.current = setInterval(() => {
            iter++;
            if (iter >= maxIter) finish(true);
            else commit({ shown: scramble(c, EMPTY, p), revealed: new Set(), animating: true, decrypted: false });
          }, interval);
        }
        return;
      }

      // Recifrar: parte de tudo revelado e oculta posições até não restar nenhuma.
      const revealed = new Set(Array.from({ length: n }, (_, i) => i));
      commit({ shown: c, revealed: new Set(revealed), animating: true, decrypted: true });
      if (seq) {
        const order = buildOrder(n, dir).reverse();
        let ptr = 0;
        timerRef.current = setInterval(() => {
          revealed.delete(order[ptr++]);
          if (revealed.size === 0) finish(false);
          else
            commit({ shown: scramble(c, revealed, p), revealed: new Set(revealed), animating: true, decrypted: true });
        }, interval);
      } else {
        const batch = Math.max(1, Math.ceil(n / maxIter));
        let iter = 0;
        timerRef.current = setInterval(() => {
          iter++;
          const left = Array.from(revealed);
          for (let k = 0; k < batch && left.length > 0; k++) {
            const j = Math.floor(Math.random() * left.length);
            revealed.delete(left[j]);
            left.splice(j, 1);
          }
          if (revealed.size === 0 || iter >= maxIter) finish(false);
          else
            commit({ shown: scramble(c, revealed, p), revealed: new Set(revealed), animating: true, decrypted: true });
        }, interval);
      }
    },
    [commit, showPlain, stopTimer],
  );

  // Texto, modo de disparo ou preferência de movimento mudaram: reinicia o estado.
  useEffect(() => {
    stopTimer();
    if (trigger === 'click' && !reduced) {
      const { chars: c, pool: p } = cfg.current;
      commit({ shown: scramble(c, EMPTY, p), revealed: new Set(), animating: false, decrypted: false });
    } else {
      showPlain();
    }
    return stopTimer;
  }, [text, trigger, reduced, commit, showPlain, stopTimer]);

  // Disparo único ao entrar na tela (≥ 10% visível).
  const rootRef = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (trigger !== 'view' && trigger !== 'view-hover') return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let fired = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (fired || !entries.some((e) => e.isIntersecting)) return;
        fired = true;
        io.disconnect();
        run('decrypt');
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger, run]);

  const hoverEnabled = trigger === 'hover' || trigger === 'view-hover';
  const isClick = trigger === 'click';

  const activate = () => {
    if (!isClick) return;
    const s = snapRef.current;
    if (s.animating) return; // cliques durante a animação são ignorados
    if (clickMode === 'toggle') run(s.decrypted ? 'encrypt' : 'decrypt');
    else if (!s.decrypted) run('decrypt');
  };

  const handleEnter = (e: MouseEvent<HTMLSpanElement>) => {
    onMouseEnter?.(e);
    if (hoverEnabled && !snapRef.current.animating) run('decrypt');
  };
  const handleLeave = (e: MouseEvent<HTMLSpanElement>) => {
    onMouseLeave?.(e);
    if (hoverEnabled) showPlain();
  };
  const handleClick = (e: MouseEvent<HTMLSpanElement>) => {
    onClick?.(e);
    activate();
  };
  const handleKey = (e: KeyboardEvent<HTMLSpanElement>) => {
    onKeyDown?.(e);
    if (isClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      activate();
    }
  };

  return (
    <span
      role={isClick ? 'button' : undefined}
      tabIndex={isClick ? 0 : undefined}
      {...rest}
      ref={rootRef}
      className={className || undefined}
      style={{ display: 'inline-block', whiteSpace: 'pre-wrap', ...style }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      onKeyDown={handleKey}
    >
      <span style={SR_ONLY}>{text}</span>
      <span aria-hidden="true">
        {snap.shown.map((ch, i) => {
          const isRevealed = snap.revealed.has(i) || (!snap.animating && snap.decrypted);
          const cls = isRevealed ? revealedClassName : scrambledClassName;
          return (
            <span key={i} className={cls || undefined}>
              {ch}
            </span>
          );
        })}
      </span>
    </span>
  );
}

export default CipherRevealText;
