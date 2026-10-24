// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export interface CrosshairCursorProps {
  /** Cor das linhas (qualquer cor CSS). */
  color?: string;
  /**
   * Limita a mira a um elemento. A mira deve ser renderizada dentro desse contêiner
   * (que precisa ter posicionamento relativo). Sem contêiner, cobre a viewport.
   */
  containerRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const EASE_OUT_CUBIC = 'cubic-bezier(0.215, 0.61, 0.355, 1)';
const EASE_OUT_QUAD = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

export function CrosshairCursor({ color = 'white', containerRef, className }: CrosshairCursorProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const fx = `crosshair-x-${uid}`;
  const fy = `crosshair-y-${uid}`;
  const hRef = useRef<HTMLDivElement>(null);
  const vRef = useRef<HTMLDivElement>(null);
  const turbX = useRef<SVGFETurbulenceElement>(null);
  const turbY = useRef<SVGFETurbulenceElement>(null);
  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const hasContainer = !!containerRef;

  useEffect(() => {
    setMounted(true);
    // Sem ponteiro fino não há movimento contínuo: não monta o efeito.
    if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !enabled) return;
    const h = hRef.current;
    const v = vRef.current;
    if (!h || !v) return;
    const container = containerRef?.current ?? null;
    const moveTarget: HTMLElement | Window = container ?? window;
    const linkScope: HTMLElement | Document = container ?? document;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const mouse = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let started = false;
    let loop = 0;
    let noise = 0;

    const fade = (to: number, dur: number, ease: string) => {
      for (const el of [h, v]) {
        el.style.transition = reduced ? 'none' : `opacity ${dur}s ${ease}`;
        el.style.opacity = String(to);
      }
    };

    const render = () => {
      v.style.transform = `translate3d(${pos.x}px, 0, 0)`;
      h.style.transform = `translate3d(0, ${pos.y}px, 0)`;
    };

    const tick = () => {
      pos.x += (mouse.x - pos.x) * 0.15;
      pos.y += (mouse.y - pos.y) * 0.15;
      render();
      // Pausa quando convergir; o próximo movimento reinicia.
      if (Math.abs(mouse.x - pos.x) < 0.05 && Math.abs(mouse.y - pos.y) < 0.05) {
        pos.x = mouse.x;
        pos.y = mouse.y;
        render();
        loop = 0;
      } else {
        loop = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: Event) => {
      const ev = e as PointerEvent;
      if (container) {
        const r = container.getBoundingClientRect();
        mouse.x = ev.clientX - r.left;
        mouse.y = ev.clientY - r.top;
      } else {
        mouse.x = ev.clientX;
        mouse.y = ev.clientY;
      }
      if (!started) {
        started = true;
        pos.x = mouse.x;
        pos.y = mouse.y;
        render();
        fade(1, 0.9, EASE_OUT_CUBIC);
      }
      if (reduced) {
        pos.x = mouse.x;
        pos.y = mouse.y;
        render();
        return;
      }
      if (!loop) loop = requestAnimationFrame(tick);
    };

    // Modo contêiner: fade nas bordas pelos eventos de entrada/saída.
    const onEnter = () => {
      if (started) fade(1, 0.5, EASE_OUT_QUAD);
    };
    const onLeave = () => fade(0, 0.5, EASE_OUT_QUAD);

    const clearNoise = () => {
      cancelAnimationFrame(noise);
      noise = 0;
      h.style.filter = '';
      v.style.filter = '';
    };

    // Reinicia o ruído a cada entrada em link: frequência 1 → 0 em 0,5 s.
    const startNoise = () => {
      clearNoise();
      if (reduced) return;
      h.style.filter = `url(#${fx})`;
      v.style.filter = `url(#${fy})`;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / 500);
        const f = String(1 - easeOutQuad(p));
        turbX.current?.setAttribute('baseFrequency', f);
        turbY.current?.setAttribute('baseFrequency', f);
        if (p < 1) noise = requestAnimationFrame(step);
        else clearNoise();
      };
      noise = requestAnimationFrame(step);
    };

    // Delegação: vale para links adicionados depois da montagem.
    const linkOf = (n: EventTarget | null): Element | null => {
      if (!(n instanceof Element)) return null;
      const a = n.closest('a');
      if (!a) return null;
      if (container && !container.contains(a)) return null;
      return a;
    };
    const onOver = (e: Event) => {
      const ev = e as PointerEvent;
      const a = linkOf(ev.target);
      if (a && !(ev.relatedTarget instanceof Node && a.contains(ev.relatedTarget))) startNoise();
    };
    const onOut = (e: Event) => {
      const ev = e as PointerEvent;
      const a = linkOf(ev.target);
      if (a && !(ev.relatedTarget instanceof Node && a.contains(ev.relatedTarget))) clearNoise();
    };

    moveTarget.addEventListener('pointermove', onMove);
    linkScope.addEventListener('pointerover', onOver);
    linkScope.addEventListener('pointerout', onOut);
    if (container) {
      container.addEventListener('pointerenter', onEnter);
      container.addEventListener('pointerleave', onLeave);
    }
    return () => {
      moveTarget.removeEventListener('pointermove', onMove);
      linkScope.removeEventListener('pointerover', onOver);
      linkScope.removeEventListener('pointerout', onOut);
      if (container) {
        container.removeEventListener('pointerenter', onEnter);
        container.removeEventListener('pointerleave', onLeave);
      }
      cancelAnimationFrame(loop);
      clearNoise();
      fade(0, 0, 'linear');
    };
  }, [mounted, enabled, containerRef, fx, fy]);

  if (!mounted || !enabled) return null;

  const layer = (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: hasContainer ? 'absolute' : 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10000,
      }}
    >
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} focusable="false">
        <defs>
          {/* Regiões em unidades da caixa: folga de ±30 px em torno da linha de 1 px. */}
          <filter id={fx} x="-0.02" y="-30" width="1.04" height="61" colorInterpolationFilters="sRGB">
            <feTurbulence ref={turbX} type="fractalNoise" baseFrequency="0.000001" numOctaves={1} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={40} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id={fy} x="-30" y="-0.02" width="61" height="1.04" colorInterpolationFilters="sRGB">
            <feTurbulence ref={turbY} type="fractalNoise" baseFrequency="0.000001" numOctaves={1} result="warp" />
            <feDisplacementMap in="SourceGraphic" in2="warp" scale={40} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div
        ref={hRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 1, background: color, opacity: 0, willChange: 'transform' }}
      />
      <div
        ref={vRef}
        style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: color, opacity: 0, willChange: 'transform' }}
      />
    </div>
  );

  // Sem contêiner: portal no body para que "fixed" seja relativo à viewport mesmo sob ancestrais transformados.
  return hasContainer ? layer : createPortal(layer, document.body);
}

export default CrosshairCursor;
