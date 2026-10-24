// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type RefObject,
} from 'react';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from 'motion/react';

export type PinListIcon = ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;

export interface PinListItem {
  id: number;
  title: string;
  info: string;
  icon: PinListIcon;
  pinned: boolean;
}

export interface PinListLabelAnimation {
  initial?: { opacity: number };
  animate?: { opacity: number };
  exit?: { opacity: number };
  transition?: Transition;
}

export interface PinListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: PinListItem[];
  labels?: { pinned?: string; all?: string };
  transition?: Transition;
  labelMotion?: PinListLabelAnimation;
  labelClassName?: string;
  pinnedSectionClassName?: string;
  allSectionClassName?: string;
  /** Tempo (ms) até as duas seções voltarem à mesma camada. */
  zIndexResetDelay?: number;
  /** Força o tema; por padrão é detectado pelo ancestral `.dark`/`.light`. */
  theme?: 'light' | 'dark';
  /** Disparado a cada alternância, com a lista já reordenada. */
  onItemsChange?: (items: PinListItem[]) => void;
  /** Disparado a cada alternância com o id e o novo estado. */
  onPinnedChange?: (id: number, pinned: boolean) => void;
}

const MOLA_PADRAO: Transition = { type: 'spring', stiffness: 320, damping: 20, mass: 0.8 };
const ROTULO_PADRAO: Required<PinListLabelAnimation> = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22, ease: 'easeInOut' },
};

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

function IconeAlfinete({ preenchido, size = 16 }: { preenchido: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#ffffff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3h6v5.5l3 3.5v1.5H6V12l3-3.5z" fill={preenchido ? '#ffffff' : 'none'} />
      <path d="M12 13.5V21" />
    </svg>
  );
}

type Secao = 'pinned' | 'all';

export function PinList({
  items,
  labels,
  transition = MOLA_PADRAO,
  labelMotion,
  className,
  labelClassName,
  pinnedSectionClassName,
  allSectionClassName,
  zIndexResetDelay = 500,
  theme,
  onItemsChange,
  onPinnedChange,
  style,
  ...rest
}: PinListProps) {
  const raizRef = useRef<HTMLDivElement>(null);
  const escuro = useTemaEscuro(raizRef, theme);
  const reduzir = useReducedMotion();

  const [lista, setLista] = useState<PinListItem[]>(items);
  // Sincroniza com mudanças externas (a lista recebida deve ser estável/memoizada).
  const recebidaRef = useRef(items);
  useEffect(() => {
    if (recebidaRef.current !== items) {
      recebidaRef.current = items;
      setLista(items);
    }
  }, [items]);

  const [secaoAbaixo, setSecaoAbaixo] = useState<Secao | null>(null);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const alternar = (id: number) => {
    const alvo = lista.find((i) => i.id === id);
    if (!alvo) return;
    const restantes = lista.filter((i) => i.id !== id);
    const atualizado: PinListItem = { ...alvo, pinned: !alvo.pinned };
    let nova: PinListItem[];
    if (alvo.pinned) {
      // Desafixado: vai para o início da seção "todos".
      const idx = restantes.findIndex((i) => !i.pinned);
      nova = idx === -1 ? [...restantes, atualizado] : [...restantes.slice(0, idx), atualizado, ...restantes.slice(idx)];
    } else {
      // Fixado: vai para o final da seção de fixados.
      let ultimo = -1;
      restantes.forEach((i, k) => {
        if (i.pinned) ultimo = k;
      });
      nova = [...restantes.slice(0, ultimo + 1), atualizado, ...restantes.slice(ultimo + 1)];
    }

    // A seção de origem fica por baixo enquanto o cartão viaja.
    setSecaoAbaixo(alvo.pinned ? 'pinned' : 'all');
    const t = setTimeout(() => {
      timersRef.current.delete(t);
      setSecaoAbaixo(null);
    }, zIndexResetDelay);
    timersRef.current.add(t);

    setLista(nova);
    onItemsChange?.(nova);
    onPinnedChange?.(id, atualizado.pinned);
  };

  const fixados = lista.filter((i) => i.pinned);
  const demais = lista.filter((i) => !i.pinned);

  const mola: Transition = reduzir ? { duration: 0 } : transition;
  const rot = { ...ROTULO_PADRAO, ...labelMotion };
  const rotTransicao: Transition = reduzir ? { duration: 0.12 } : rot.transition;

  const cores = escuro
    ? { cartao: '#262626', pagina: '#0a0a0a', icone: '#a3a3a3', info: '#a3a3a3', texto: '#fafafa', rotulo: '#d4d4d4', alfinete: '#525252' }
    : { cartao: '#e5e5e5', pagina: '#ffffff', icone: '#737373', info: '#737373', texto: '#0a0a0a', rotulo: '#737373', alfinete: '#a3a3a3' };

  const idBase = `pin-list${useId().replace(/:/g, '')}`;

  const rotulo = (texto: string, id: string) => (
    <motion.p
      key={id}
      id={id}
      layout="position"
      initial={rot.initial}
      animate={rot.animate}
      exit={rot.exit}
      transition={{ opacity: rotTransicao, layout: mola }}
      className={labelClassName}
      style={{ padding: '0 12px', fontSize: 14, fontWeight: 500, color: cores.rotulo, margin: '0 0 8px' }}
    >
      {texto}
    </motion.p>
  );

  const cartao = (item: PinListItem) => {
    const Icone = item.icon;
    return (
      <motion.li
        key={item.id}
        layoutId={`${idBase}-item-${item.id}`}
        transition={mola}
        style={{ listStyle: 'none', borderRadius: 16 }}
      >
        <button
          type="button"
          onClick={() => alternar(item.id)}
          aria-pressed={item.pinned}
          aria-label={`${item.pinned ? 'Desafixar' : 'Fixar'} ${item.title}`}
          className="group flex w-full cursor-pointer items-center justify-between text-left outline-none focus-visible:[outline:2px_solid_currentColor] focus-visible:[outline-offset:2px]"
          style={{
            gap: 20,
            padding: 8,
            borderRadius: 16,
            background: cores.cartao,
            color: cores.texto,
            border: 'none',
            boxShadow: 'none',
            font: 'inherit',
          }}
        >
          <span className="flex min-w-0 flex-1 items-center" style={{ gap: 8 }}>
            <span
              className="flex shrink-0 items-center justify-center"
              style={{ padding: 8, borderRadius: 8, background: cores.pagina }}
            >
              <Icone size={20} style={{ color: cores.icone, width: 20, height: 20 }} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: cores.texto }}>
                {item.title}
              </span>
              <span className="truncate" style={{ fontSize: 12, fontWeight: 500, color: cores.info }}>
                {item.info}
              </span>
            </span>
          </span>
          <span
            aria-hidden="true"
            className={
              item.pinned
                ? 'flex shrink-0 items-center justify-center rounded-full'
                : 'flex shrink-0 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-60'
            }
            style={{ width: 32, height: 32, background: cores.alfinete, transition: 'opacity 250ms' }}
          >
            <IconeAlfinete preenchido={item.pinned} />
          </span>
        </button>
      </motion.li>
    );
  };

  const zSecao = (s: Secao) => (secaoAbaixo === s ? 5 : 10);
  const nomeFixados = labels?.pinned ?? 'Pinned Items';
  const nomeTodos = labels?.all ?? 'All Items';

  return (
    <div
      ref={raizRef}
      className={['flex w-full flex-col', className].filter(Boolean).join(' ')}
      style={{ gap: 40, ...style }}
      {...rest}
    >
      <LayoutGroup id={idBase}>
        <div className={pinnedSectionClassName} style={{ position: 'relative', zIndex: zSecao('pinned') }}>
          <AnimatePresence initial={false}>
            {fixados.length > 0 && rotulo(nomeFixados, `${idBase}-rot-fixados`)}
          </AnimatePresence>
          {fixados.length > 0 && (
            <ul
              aria-labelledby={`${idBase}-rot-fixados`}
              className="flex flex-col"
              style={{ gap: 12, margin: 0, padding: 0, position: 'relative' }}
            >
              {fixados.map(cartao)}
            </ul>
          )}
        </div>
        <div className={allSectionClassName} style={{ position: 'relative', zIndex: zSecao('all') }}>
          <AnimatePresence initial={false}>
            {demais.length > 0 && rotulo(nomeTodos, `${idBase}-rot-todos`)}
          </AnimatePresence>
          {demais.length > 0 && (
            <ul
              aria-labelledby={`${idBase}-rot-todos`}
              className="flex flex-col"
              style={{ gap: 12, margin: 0, padding: 0, position: 'relative' }}
            >
              {demais.map(cartao)}
            </ul>
          )}
        </div>
      </LayoutGroup>
    </div>
  );
}

export default PinList;
