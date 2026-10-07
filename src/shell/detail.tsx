import { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { type Entry, LIB_BY_ID, loadSources } from './catalog';
import { Stage } from './stage';
import { cn, type StageTheme } from './ctx';

const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); } catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); } };

export function Detail({ entry, theme, onClose }: { entry: Entry; theme: StageTheme; onClose: () => void }) {
  const [tab, setTab] = useState<'preview' | 'code' | 'license'>('preview');
  const [files, setFiles] = useState<Record<string, string>>({});
  const [active, setActive] = useState(entry.files[0]);
  const [done, setDone] = useState(false);
  const [local, setLocal] = useState<StageTheme>(theme);
  const lib = LIB_BY_ID[entry.lib];
  useEffect(() => { loadSources(entry.lib).then(setFiles); }, [entry.lib]);
  useEffect(() => { setActive(entry.files[0]); setTab('preview'); }, [entry.uid]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const code = files[active] ?? '';
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/60 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-[min(1100px,100vw)] flex-col border-l border-white/10 bg-zinc-950 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/80">{lib?.name} · {entry.category}</div>
            <h2 className="truncate font-display text-xl font-semibold">{entry.name}</h2>
            {entry.desc && <p className="truncate text-xs text-zinc-500">{entry.desc}</p>}
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>
        <div className="flex items-center gap-1 border-b border-white/10 px-4 py-2 text-sm">
          {(['preview', 'code', 'license'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('rounded-md px-3 py-1.5 transition', tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-200')}>{{ preview: 'Preview', code: 'Código', license: 'Licença' }[t]}</button>
          ))}
          <div className="ml-auto flex items-center gap-1 font-mono text-[11px]">
            {(['dark', 'light'] as const).map((t) => <button key={t} onClick={() => setLocal(t)} className={cn('rounded px-2 py-1', local === t ? 'bg-white/10 text-white' : 'text-zinc-500')}>{t === 'dark' ? 'escuro' : 'claro'}</button>)}
          </div>
        </div>
        <div className="sb min-h-0 flex-1 overflow-auto p-5">
          {tab === 'preview' && <Stage entry={entry} theme={local} big className="!h-[min(74vh,720px)]" />}
          {tab === 'code' && (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {entry.files.map((f) => <button key={f} onClick={() => setActive(f)} className={cn('rounded-md border px-2 py-1 font-mono text-[11px]', active === f ? 'border-amber-200/40 bg-amber-200/10 text-amber-100' : 'border-white/10 text-zinc-400 hover:text-zinc-100')}>{f.split('/').slice(-1)[0]}</button>)}
                <button onClick={() => { copy(code); setDone(true); setTimeout(() => setDone(false), 1400); }} className="ml-auto flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15">{done ? <Check size={13} /> : <Copy size={13} />} {done ? 'Copiado' : 'Copiar'}</button>
              </div>
              <div className="mb-2 font-mono text-[11px] text-zinc-600">{active}</div>
              <pre className="sb max-h-[68vh] overflow-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[12px] leading-relaxed text-zinc-300">{code || 'Carregando…'}</pre>
              {entry.deps && entry.deps.length > 0 && <p className="mt-3 font-mono text-[11px] text-zinc-500">npm: {entry.deps.join(' · ')}</p>}
            </div>
          )}
          {tab === 'license' && lib && (
            <div className="space-y-3 text-sm text-zinc-300">
              <p><b className="text-white">{lib.name}</b> — {lib.license}</p>
              <p className="font-mono text-xs text-zinc-500">{lib.repo}<br />commit {lib.commit}</p>
              <p className="text-xs text-zinc-500">{lib.copyright}</p>
              {/apache/i.test(lib.license) && <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-400">Apache-2.0: os arquivos exibidos são cópias do repositório acima; o Atlas apenas os empacota para visualização offline (ajustes de build ficam em <span className="font-mono">patches/</span>). Mantenha este aviso e o texto da licença ao redistribuir.</p>}
              {lib.status !== 'OK' && <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-amber-100">Licença restrita ({lib.status}): uso pessoal, não redistribuir.</p>}
              <pre className="sb max-h-[56vh] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] text-zinc-400">{lib.licenseText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
