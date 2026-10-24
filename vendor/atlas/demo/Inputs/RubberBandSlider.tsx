// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useId, useState, type ReactNode } from 'react';
import RubberBandSlider from '../../componentes/elastic-slider/RubberBandSlider';

// Ícones na variante para fundo escuro (#ddd).
function LowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ddd" aria-hidden="true">
      <path d="M11 5.2a1 1 0 0 0-1.6-.8L5.6 7.5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2.6l3.8 3.1A1 1 0 0 0 11 18.8V5.2Z" />
      <path d="M14.3 8.6a.9.9 0 0 1 1.3.1 5.1 5.1 0 0 1 0 6.6.9.9 0 1 1-1.4-1.2 3.3 3.3 0 0 0 0-4.2.9.9 0 0 1 .1-1.3Z" />
    </svg>
  );
}

function HighIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ddd" aria-hidden="true">
      <path d="M11 5.2a1 1 0 0 0-1.6-.8L5.6 7.5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2.6l3.8 3.1A1 1 0 0 0 11 18.8V5.2Z" />
      <path d="M14.3 8.6a.9.9 0 0 1 1.3.1 5.1 5.1 0 0 1 0 6.6.9.9 0 1 1-1.4-1.2 3.3 3.3 0 0 0 0-4.2.9.9 0 0 1 .1-1.3Z" />
      <path d="M17.2 5.6a.9.9 0 0 1 1.3 0 9.2 9.2 0 0 1 0 12.8.9.9 0 1 1-1.3-1.3 7.4 7.4 0 0 0 0-10.2.9.9 0 0 1 0-1.3Z" />
    </svg>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-28 shrink-0 text-xs text-neutral-400">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-neutral-300"
      />
      <span className="w-10 shrink-0 text-right font-mono text-xs text-neutral-300">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-3">
      <h2 className="m-0 text-lg font-semibold text-neutral-100">{title}</h2>
      {children}
    </section>
  );
}

export default function RubberBandSliderDemo() {
  const [defaultValue, setDefaultValue] = useState(50);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [stepped, setStepped] = useState(false);
  const [stepSize, setStepSize] = useState(10);
  const toggleId = useId();

  return (
    <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-6 bg-[#060010] p-6">
      <Section title="Default">
        <div className="relative flex min-h-[500px] w-full items-center justify-center rounded-xl border border-white/10 bg-[#0b0b12]">
          <RubberBandSlider
            defaultValue={defaultValue}
            min={min}
            max={max}
            stepped={stepped}
            stepSize={stepSize}
            startIcon={<LowIcon />}
            endIcon={<HighIcon />}
          />
        </div>
      </Section>

      <div className="flex w-full max-w-md flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <RangeControl label="Valor inicial" value={defaultValue} min={0} max={1000} step={10} onChange={setDefaultValue} />
        <RangeControl label="Início" value={min} min={0} max={500} step={10} onChange={setMin} />
        <RangeControl label="Fim" value={max} min={10} max={1000} step={10} onChange={setMax} />
        <div className="flex items-center gap-3">
          <label htmlFor={toggleId} className="w-28 shrink-0 text-xs text-neutral-400">
            Passos
          </label>
          <input
            id={toggleId}
            type="checkbox"
            checked={stepped}
            onChange={(e) => setStepped(e.target.checked)}
            className="h-4 w-4 accent-neutral-300"
          />
        </div>
        <RangeControl label="Tamanho do passo" value={stepSize} min={1} max={50} step={1} onChange={setStepSize} />
      </div>
    </div>
  );
}
