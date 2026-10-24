// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useState, type ReactNode } from 'react';
import CipherRevealText, {
  type CipherClickMode,
  type CipherTrigger,
  type RevealDirection,
} from '../../componentes/decrypted-text/CipherRevealText';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-white/60">
      <span>{label}</span>
      {children}
    </label>
  );
}

const selectCls =
  'rounded-md border border-white/15 bg-white/5 px-2 py-1 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40';

export default function CipherRevealTextDemo() {
  const [trigger, setTrigger] = useState<CipherTrigger>('view');
  const [clickMode, setClickMode] = useState<CipherClickMode>('once');
  const [direction, setDirection] = useState<RevealDirection>('start');
  const [tickMs, setTickMs] = useState(60);
  const [iterations, setIterations] = useState(10);
  const [sequential, setSequential] = useState(true);
  const [originalOnly, setOriginalOnly] = useState(false);
  const [reloads, setReloads] = useState(0);

  // Qualquer mudança remonta o componente.
  const key = [trigger, clickMode, direction, tickMs, iterations, sequential, originalOnly, reloads].join('|');

  return (
    <div className="w-full h-full min-h-[320px] flex flex-col gap-4 bg-[#0b0a10] p-4 text-white">
      <div className="relative flex h-[400px] items-center justify-center overflow-hidden rounded-xl border border-white/10 py-5">
        <button
          type="button"
          aria-label="Recarregar"
          title="Recarregar"
          onClick={() => setReloads((n) => n + 1)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </button>
        <div className="flex w-[80%] px-[0.5em]">
          <CipherRevealText
            key={key}
            text="Hacking into the mainframe..."
            tickMs={tickMs}
            iterations={iterations}
            sequential={sequential}
            direction={direction}
            originalCharsOnly={originalOnly}
            trigger={trigger}
            clickMode={clickMode}
            className="text-[2.25rem] font-semibold leading-tight text-white"
            revealedClassName="text-white"
            scrambledClassName="text-violet-400/70"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Disparo">
          <select className={selectCls} value={trigger} onChange={(e) => setTrigger(e.target.value as CipherTrigger)}>
            <option value="hover">Hover</option>
            <option value="view">Ao entrar na tela</option>
            <option value="view-hover">Na tela + hover</option>
            <option value="click">Clique</option>
          </select>
        </Field>
        <Field label="Clique">
          <select
            className={selectCls}
            value={clickMode}
            disabled={trigger !== 'click'}
            onChange={(e) => setClickMode(e.target.value as CipherClickMode)}
          >
            <option value="once">Uma vez</option>
            <option value="toggle">Alternar</option>
          </select>
        </Field>
        <Field label="Direção">
          <select className={selectCls} value={direction} onChange={(e) => setDirection(e.target.value as RevealDirection)}>
            <option value="start">Início</option>
            <option value="end">Fim</option>
            <option value="center">Centro</option>
          </select>
        </Field>
        <Field label={`Intervalo: ${tickMs} ms`}>
          <input type="range" min={10} max={200} step={10} value={tickMs} onChange={(e) => setTickMs(Number(e.target.value))} />
        </Field>
        <Field label={`Iterações: ${iterations}`}>
          <input type="range" min={1} max={50} step={1} value={iterations} onChange={(e) => setIterations(Number(e.target.value))} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={sequential} onChange={(e) => setSequential(e.target.checked)} />
          Sequencial
        </label>
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input type="checkbox" checked={originalOnly} onChange={(e) => setOriginalOnly(e.target.checked)} />
          Só caracteres originais
        </label>
      </div>
    </div>
  );
}
