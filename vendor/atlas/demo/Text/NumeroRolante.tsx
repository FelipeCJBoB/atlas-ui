// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState } from 'react';
import NumeroRolante from '../../componentes/sliding-number/NumeroRolante';

const campo =
  'rounded-md border border-neutral-300 bg-white/70 px-2 py-1 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100';

// Detecta o tema pela classe dark/light do ancestral mais próximo; sem ela, usa prefers-color-scheme.
function useTemaEscuro() {
  const ref = useRef<HTMLDivElement>(null);
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    const avaliar = () => {
      const anc = el.parentElement?.closest('.dark, .light');
      setEscuro(anc ? anc.classList.contains('dark') : !!mq?.matches);
    };
    avaliar();
    // Acompanha troca de tema: classes em qualquer ancestral e a preferência do sistema.
    const mo = new MutationObserver(avaliar);
    for (let n = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq?.addEventListener('change', avaliar);
    return () => {
      mo.disconnect();
      mq?.removeEventListener('change', avaliar);
    };
  }, []);

  return [ref, escuro] as const;
}

export default function NumeroRolanteDemo() {
  const [raiz, escuro] = useTemaEscuro();
  const [valor, setValor] = useState(2025);
  const [contarDeZero, setContarDeZero] = useState(true);
  const [zeros, setZeros] = useState(true);
  const [sepDecimal, setSepDecimal] = useState(',');
  const [sepMilhar, setSepMilhar] = useState('.');
  const [casas, setCasas] = useState(0);
  const [atraso, setAtraso] = useState(0);

  return (
    <div
      ref={raiz}
      className="w-full h-full min-h-[320px] flex flex-col items-center justify-center gap-8 p-6"
      style={{ color: escuro ? '#fafafa' : '#18181b' }}
    >
      <div
        className="flex flex-1 items-center justify-center"
        style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: '6rem' }}
      >
        {/* Mudar atraso ou "contar a partir de" recria o componente e reinicia a animação. */}
        <NumeroRolante
          key={`${contarDeZero}-${atraso}`}
          style={{ fontSize: '4rem', fontWeight: 600, lineHeight: 1, color: escuro ? '#fafafa' : '#18181b' }}
          valor={Number.isFinite(valor) ? valor : 0}
          valorInicial={contarDeZero ? 0 : undefined}
          preencherZeros={zeros}
          separadorDecimal={sepDecimal}
          separadorMilhar={sepMilhar || undefined}
          casasDecimais={casas}
          atraso={atraso}
        />
      </div>

      <div className="grid w-full max-w-xl grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          Valor
          <input
            type="number"
            className={campo}
            value={Number.isFinite(valor) ? valor : ''}
            onChange={(e) => setValor(e.target.valueAsNumber)}
          />
        </label>
        <label className="flex flex-col gap-1">
          Separador decimal
          <input className={campo} value={sepDecimal} onChange={(e) => setSepDecimal(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Separador de milhar
          <input className={campo} value={sepMilhar} onChange={(e) => setSepMilhar(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Casas decimais
          <input
            type="number"
            min={0}
            max={6}
            className={campo}
            value={casas}
            onChange={(e) => setCasas(Math.max(0, Math.min(6, Math.floor(e.target.valueAsNumber || 0))))}
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={contarDeZero} onChange={(e) => setContarDeZero(e.target.checked)} />
          Contar a partir de 0
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={zeros} onChange={(e) => setZeros(e.target.checked)} />
          Preencher com zeros
        </label>
        <label className="col-span-2 flex flex-col gap-1 sm:col-span-3">
          Atraso: {atraso} ms
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={atraso}
            onChange={(e) => setAtraso(Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
