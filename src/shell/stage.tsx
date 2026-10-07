import { Suspense, useEffect, useRef, useState } from 'react';
import { Maximize2, Star } from 'lucide-react';
import { Boundary, type Entry, LIB_BY_ID } from './catalog';
import { StageThemeCtx, cn, type StageTheme } from './ctx';

export function useNear(margin = '900px') {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [minH, setMinH] = useState<number | undefined>();
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && el.offsetHeight) setMinH(el.offsetHeight); setNear(e.isIntersecting); }, { rootMargin: margin });
    io.observe(el); return () => io.disconnect();
  }, [margin]);
  return { ref, near, minH };
}

// O palco carrega a classe da biblioteca (.lib-<id>) que escopa tokens/keyframes + dark/light próprio.
export function Stage({ entry, theme, className, big = false }: { entry: Entry; theme: StageTheme; className?: string; big?: boolean }) {
  const [auto, setAuto] = useState<'fill' | 'frame' | null>(null);
  const fs = entry.layout === 'fullscreen' || entry.layout === 'frame' || auto === 'frame';
  const lib = LIB_BY_ID[entry.lib];
  return (
    <div
      data-stage={entry.uid}
      className={cn(
        `lib-${entry.lib}`, theme === 'dark' ? 'dark' : 'light', 'atlas-stage relative flex w-full max-w-full overflow-x-auto overflow-y-hidden rounded-xl border p-4',
        'has-[.full-content]:overflow-auto has-[.full-content]:p-0',
        big ? 'h-[min(72vh,680px)] [contain:layout_paint]' : fs ? 'h-[460px] p-0 [contain:layout_paint]' : 'min-h-[230px]', className,
      )}
    >
      <StageThemeCtx.Provider value={theme}>
        {entry.flags.includes('needs-files') ? (
          <div className="max-w-sm text-center text-xs opacity-60">Página HTML completa (iframe com arquivos próprios): não cabe neste arquivo único. Veja o código; a versão funcional fica para o <span className="font-mono">Atlas On</span>.</div>
        ) : entry.flags.includes('needs-props') ? (
          <div className="max-w-sm text-center text-xs opacity-60">Este componente é só a peça de biblioteca: o repositório não traz um exemplo com dados (exige props). Veja a aba <b>Código</b> para os tipos e a API.</div>
        ) : entry.flags.includes('needs-network') && !navigator.onLine ? (
          <div className="max-w-xs text-center text-xs opacity-60">Este componente precisa de rede (vídeo/iframe/API). Offline ele aparece vazio — veja o código ou abra online. <span className="font-mono">Atlas On</span></div>
        ) : (
          <StageBody entry={entry} wrap={lib?.wrap} auto={auto} setAuto={setAuto} />
        )}
      </StageThemeCtx.Provider>
    </div>
  );
}

// Wrapper do componente: se o conteúdo colapsa para largura 0 (filhos `w-full`/`absolute` dentro de um item flex centralizado),
// passa automaticamente para o modo `fill` (largura total do palco) — evita demos "invisíveis".
function StageBody({ entry, wrap, auto, setAuto }: { entry: Entry; wrap?: string; auto: 'fill' | 'frame' | null; setAuto: (a: 'fill' | 'frame') => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (entry.layout === 'frame' || entry.layout === 'fullscreen' || entry.noAutoFill) return;
    const check = () => {
      const w = ref.current; if (!w || !w.childElementCount || !w.parentElement || w.parentElement.offsetWidth < 40) return;
      if (w.offsetWidth === 0 && entry.layout !== 'fill') setAuto('fill');
      else if (w.offsetHeight === 0 && w.offsetWidth > 0) setAuto('frame');
    };
    const ts = [350, 1200, 3500].map((ms) => setTimeout(check, ms));
    return () => ts.forEach(clearTimeout);
  }, [entry.uid, entry.layout]);
  return (
    <div ref={ref} data-autolayout={auto || undefined} className={cn('m-auto max-w-full', wrap, (entry.layout === 'fill' || auto) && 'w-full', auto === 'fill' && '!max-w-2xl', (entry.layout === 'frame' || auto === 'frame') && 'h-full w-full')}><Boundary key={entry.uid} label={entry.uid}><Suspense fallback={<div className="p-6 font-mono text-[10px] opacity-40">carregando…</div>}><entry.Comp /></Suspense></Boundary></div>
  );
}

export function Tile({ entry, theme, fav, onFav, onOpen }: { entry: Entry; theme: StageTheme; fav: boolean; onFav: () => void; onOpen: () => void }) {
  const { ref, near, minH } = useNear();
  const fs = entry.layout === 'fullscreen' || entry.layout === 'frame';
  const lib = LIB_BY_ID[entry.lib];
  return (
    <article id={`c-${entry.uid}`} data-tile className={cn('group/tile flex min-w-0 flex-col', (entry.wide || fs) && 'sm:col-span-2')}>
      <header className="mb-2 flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-200/80">{lib?.name || entry.lib}</span>
          <h3 className="truncate text-[13px] font-medium text-zinc-200">{entry.name}</h3>
          {entry.flags.includes('needs-network') && <span title="Precisa de rede" className="rounded bg-sky-500/15 px-1 font-mono text-[9px] text-sky-300">ON</span>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onFav} aria-label="Favoritar" className={cn('rounded-md p-1 transition hover:bg-white/5', fav ? 'text-amber-300' : 'text-zinc-600 hover:text-zinc-200')}><Star size={13} fill={fav ? 'currentColor' : 'none'} /></button>
          <button type="button" onClick={onOpen} aria-label={`Abrir ${entry.name}`} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100"><Maximize2 size={11} /> abrir</button>
        </div>
      </header>
      <div ref={ref} className="flex flex-1 flex-col" style={minH && !near ? { minHeight: minH } : undefined}>
        {near ? <Stage entry={entry} theme={theme} className="flex-1" /> : (
          <div className={cn(`lib-${entry.lib}`, theme === 'dark' ? 'dark' : 'light', 'atlas-stage rounded-xl border', fs ? 'h-[460px]' : 'min-h-[230px] flex-1')} style={minH ? { minHeight: minH } : undefined} />
        )}
      </div>
      <p className="mt-1.5 truncate px-1 font-mono text-[10px] text-zinc-600">{entry.lib}/{entry.id}</p>
    </article>
  );
}
