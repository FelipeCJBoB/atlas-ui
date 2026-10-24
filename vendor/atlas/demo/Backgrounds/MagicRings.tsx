// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useLayoutEffect, useRef, useState } from 'react';
import MagicRings, { type MagicRingsProps } from '../../componentes/magic-rings/MagicRings';

type Tema = 'dark' | 'light';

function useTema(ref: React.RefObject<HTMLElement | null>): Tema {
  const [tema, setTema] = useState<Tema>('dark');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const calc = () => {
      const anc = el.closest('.dark, .light');
      setTema(anc ? (anc.classList.contains('dark') ? 'dark' : 'light') : mq?.matches ? 'dark' : 'light');
    };
    calc();
    const mo = new MutationObserver(calc);
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    mq?.addEventListener('change', calc);
    return () => {
      mo.disconnect();
      mq?.removeEventListener('change', calc);
    };
  }, [ref]);
  return tema;
}

type Num = {
  [K in keyof MagicRingsProps]-?: MagicRingsProps[K] extends number | undefined ? K : never;
}[keyof MagicRingsProps];

const FAIXAS: { k: Num; r: string; min: number; max: number; step: number; v: number }[] = [
  { k: 'ringCount', r: 'anéis', min: 1, max: 10, step: 1, v: 6 },
  { k: 'speed', r: 'velocidade', min: 0, max: 3, step: 0.1, v: 1 },
  { k: 'attenuation', r: 'atenuação', min: 1, max: 30, step: 0.5, v: 10 },
  { k: 'lineThickness', r: 'espessura', min: 1, max: 10, step: 0.5, v: 2 },
  { k: 'baseRadius', r: 'raio base', min: 0.1, max: 0.5, step: 0.01, v: 0.35 },
  { k: 'radiusStep', r: 'passo', min: 0.05, max: 0.3, step: 0.01, v: 0.1 },
  { k: 'expansion', r: 'expansão', min: 0, max: 0.2, step: 0.01, v: 0.1 },
  { k: 'opacity', r: 'opacidade', min: 0, max: 1, step: 0.05, v: 1 },
  { k: 'blur', r: 'desfoque', min: 0, max: 10, step: 0.5, v: 0 },
  { k: 'noise', r: 'ruído', min: 0, max: 0.5, step: 0.01, v: 0.1 },
  { k: 'rotation', r: 'rotação', min: 0, max: 360, step: 1, v: 0 },
  { k: 'clipBase', r: 'recorte', min: 1, max: 3, step: 0.1, v: 1.5 },
  { k: 'fadeIn', r: 'entrada', min: 0.1, max: 1.5, step: 0.05, v: 0.7 },
  { k: 'fadeOutStart', r: 'saída', min: 0.5, max: 3, step: 0.05, v: 0.5 },
  { k: 'pointerInfluence', r: 'influência', min: 0, max: 1, step: 0.05, v: 0.2 },
  { k: 'hoverScale', r: 'escala hover', min: 1, max: 2, step: 0.05, v: 1.2 },
  { k: 'parallax', r: 'paralaxe', min: 0, max: 0.1, step: 0.005, v: 0.05 },
];

const valoresIniciais = () => Object.fromEntries(FAIXAS.map((f) => [f.k, f.v])) as Record<Num, number>;

function Brilhos({ cor }: { cor: string }) {
  // três estrelas de quatro pontas, traço de 1 px
  const estrela = (cx: number, cy: number, r: number) =>
    `M${cx} ${cy - r} Q${cx} ${cy} ${cx + r} ${cy} Q${cx} ${cy} ${cx} ${cy + r} Q${cx} ${cy} ${cx - r} ${cy} Q${cx} ${cy} ${cx} ${cy - r}Z`;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke={cor} strokeWidth="1" strokeLinejoin="round" style={{ opacity: 0.8 }} aria-hidden="true">
      <path d={estrela(20, 26, 14)} />
      <path d={estrela(37, 11, 7)} />
      <path d={estrela(37, 37, 5)} />
    </svg>
  );
}

export default function MagicRingsDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const tema = useTema(ref);
  const escuro = tema === 'dark';
  const [exemplo, setExemplo] = useState<'basic' | 'card'>('basic');
  const [geracao, setGeracao] = useState(0);
  const [vals, setVals] = useState(valoresIniciais);
  const [cores, setCores] = useState<[string, string] | null>(null); // null = cores do tema
  const [seguir, setSeguir] = useState(false);
  const [explosao, setExplosao] = useState(false);
  const [painel, setPainel] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Tema claro com cores padrão: cinzas, opacidade 0,62 e modo cobertura.
  const claroPadrao = !escuro && cores === null;
  const c1 = cores?.[0] ?? (escuro ? '#A855F7' : '#52525b');
  const c2 = cores?.[1] ?? (escuro ? '#6366F1' : '#a1a1aa');
  const opac = claroPadrao && vals.opacity === 1 ? 0.62 : vals.opacity;
  const texto = escuro ? '#f4f4f5' : '#18181b';
  const suave = escuro ? '#a1a1aa' : '#52525b';

  const aneis = (
    <MagicRings
      key={geracao}
      {...vals}
      opacity={opac}
      colorStart={c1}
      colorEnd={c2}
      followPointer={seguir}
      clickBurst={explosao}
      alphaMode={claroPadrao ? 'coverage' : 'luminance'}
    />
  );

  const botao = {
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 6,
    border: `1px solid ${escuro ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'}`,
    background: escuro ? 'rgba(24,20,32,0.85)' : 'rgba(255,255,255,0.9)',
    color: texto,
    cursor: 'pointer',
  } as const;

  return (
    <div ref={ref} className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 500, color: texto }}>
      {exemplo === 'basic' ? (
        <div className="absolute inset-0">{aneis}</div>
      ) : (
        <div
          style={{
            width: 340,
            maxWidth: 'calc(100% - 32px)',
            borderRadius: 20,
            overflow: 'hidden',
            background: escuro ? '#1a1622' : '#f7f7f8',
            border: `1px solid ${escuro ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          }}
        >
          <div style={{ position: 'relative', height: 200 }}>
            {aneis}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <Brilhos cor={escuro ? '#A855F7' : '#52525b'} />
            </div>
          </div>
          <div style={{ padding: '16px 18px 18px' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Magic Rings</div>
            <div style={{ fontSize: 13, color: suave, marginTop: 2 }}>Interactive WebGL effect</div>
            <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: suave }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5z" />
                  <path d="M5 20.5A2.5 2.5 0 0 0 7.5 23H19v-5" />
                </svg>
                Free &amp; open source
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
                  <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
                </svg>
                React
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText('<MagicRings />').then(
                    () => setCopiado(true),
                    () => setCopiado(false),
                  );
                }}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 10,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: escuro ? '#f4f4f5' : '#18181b',
                  color: escuro ? '#18181b' : '#f4f4f5',
                }}
              >
                {copiado ? 'Copied!' : 'Copy to clipboard'}
              </button>
              <button
                type="button"
                aria-label="Favorite"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'transparent',
                  border: `1px solid ${escuro ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={escuro ? '#B497CF' : '#71717a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.4 4.5 7 4.5c2.1 0 3.6 1.2 5 3 1.4-1.8 2.9-3 5-3 3.6 0 5.5 3.7 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controles */}
      <div className="absolute top-2 left-2 flex gap-1" style={{ zIndex: 5 }}>
        {(['basic', 'card'] as const).map((e) => (
          <button key={e} type="button" onClick={() => setExemplo(e)} style={{ ...botao, fontWeight: exemplo === e ? 700 : 400 }}>
            {e === 'basic' ? 'Basic' : 'Card'}
          </button>
        ))}
        <button type="button" onClick={() => setPainel((p) => !p)} style={botao}>
          {painel ? 'Fechar ajustes' : 'Ajustes'}
        </button>
      </div>
      <button type="button" onClick={() => setGeracao((g) => g + 1)} style={{ ...botao, position: 'absolute', top: 8, right: 8, zIndex: 5 }} aria-label="Recarregar">
        ↻
      </button>
      {painel && (
        <div
          className="absolute left-2 grid gap-x-3 gap-y-1"
          style={{
            top: 40,
            bottom: 8,
            zIndex: 5,
            overflowY: 'auto',
            width: 230,
            padding: 8,
            borderRadius: 8,
            ...botao,
            cursor: 'default',
          }}
        >
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            cores
            <input type="color" value={c1.toLowerCase()} onChange={(e) => setCores([e.target.value, c2])} />
            <input type="color" value={c2.toLowerCase()} onChange={(e) => setCores([c1, e.target.value])} />
            {cores && (
              <button type="button" onClick={() => setCores(null)} style={{ ...botao, padding: '1px 5px' }}>
                tema
              </button>
            )}
          </div>
          {FAIXAS.map((f) => (
            <label key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 72 }}>{f.r}</span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={vals[f.k]}
                onChange={(e) => setVals((v) => ({ ...v, [f.k]: Number(e.target.value) }))}
                style={{ width: 90 }}
              />
              <span style={{ width: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{vals[f.k]}</span>
            </label>
          ))}
          <label style={{ display: 'flex', gap: 6 }}>
            <input type="checkbox" checked={seguir} onChange={(e) => setSeguir(e.target.checked)} /> seguir ponteiro
          </label>
          <label style={{ display: 'flex', gap: 6 }}>
            <input type="checkbox" checked={explosao} onChange={(e) => setExplosao(e.target.checked)} /> explosão ao clicar
          </label>
        </div>
      )}
    </div>
  );
}
