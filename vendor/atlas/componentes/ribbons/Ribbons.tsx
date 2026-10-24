// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties } from 'react';

export interface RibbonsProps {
  /** Uma fita por cor (hex). */
  colors?: string[];
  baseSpring?: number;
  baseFriction?: number;
  /** Largura máxima em px CSS. */
  baseThickness?: number;
  offsetFactor?: number;
  /** Comprimento temporal (ms). */
  maxAge?: number;
  pointCount?: number;
  speedMultiplier?: number;
  enableFade?: boolean;
  enableShaderEffect?: boolean;
  effectAmplitude?: number;
  /** Cor de limpeza RGBA (0–1). */
  backgroundColor?: [number, number, number, number];
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_COLORS = ['#FC8EAC'];
const DEFAULT_BG: [number, number, number, number] = [0, 0, 0, 0];
const STEP = 1000 / 60;

const VERT = `
attribute vec2 aPos;
attribute vec2 aPrev;
attribute vec2 aNext;
attribute float aSide;
attribute float aT;
uniform vec2 uRes;
uniform float uWidth;
uniform float uTime;
uniform float uWave;
uniform float uAmp;
varying float vT;
void main() {
  vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
  vec2 cur = aPos * aspect;
  vec2 tang = aNext * aspect - aPrev * aspect;
  vec2 n = length(tang) > 1e-6 ? normalize(vec2(-tang.y, tang.x)) : vec2(0.0, 1.0);
  // Afinamento parabólico até 10% nas pontas.
  float taper = 0.1 + 0.9 * 4.0 * aT * (1.0 - aT);
  // Colapso: fita some quando os vizinhos convergem.
  float collapse = smoothstep(0.0, 0.02, length(aNext - aPrev));
  float halfW = uWidth * 0.5 * taper * collapse * 2.0 / uRes.y;
  float offset = aSide * halfW;
  if (uWave > 0.5) {
    offset += sin(aPos.x * 10.0 + uTime * 2.0) * halfW * uAmp * 0.5;
  }
  vec2 p = cur + n * offset;
  vT = aT;
  gl_Position = vec4(p / aspect, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform vec3 uColor;
uniform float uFade;
varying float vT;
void main() {
  float a = uFade > 0.5 ? 1.0 - smoothstep(0.0, 1.0, vT) : 1.0;
  gl_FragColor = vec4(uColor * a, a);
}
`;

function parseColor(c: string): [number, number, number] {
  let h = c.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  if (/^[0-9a-f]{6}$/i.test(h)) {
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  return [1, 1, 1];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
  return s;
}

export function Ribbons({
  colors = DEFAULT_COLORS,
  baseSpring = 0.03,
  baseFriction = 0.9,
  baseThickness = 30,
  offsetFactor = 0.05,
  maxAge = 500,
  pointCount = 50,
  speedMultiplier = 0.6,
  enableFade = false,
  enableShaderEffect = false,
  effectAmplitude = 2,
  backgroundColor = DEFAULT_BG,
  className,
  style,
}: RibbonsProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);

  // Comparação por conteúdo: arrays recriados a cada render não recriam a cena.
  const colorsKey = colors.join('|');
  const bgKey = backgroundColor.join(',');
  const sceneKey = [colorsKey, baseSpring, baseFriction, baseThickness, offsetFactor, maxAge, pointCount, speedMultiplier, enableFade, enableShaderEffect, effectAmplitude, bgKey].join(';');

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (reduced || !wrap || !canvas) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true });
    if (!gl) return;

    const prog = gl.createProgram()!;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const loc = {
      aPos: gl.getAttribLocation(prog, 'aPos'),
      aPrev: gl.getAttribLocation(prog, 'aPrev'),
      aNext: gl.getAttribLocation(prog, 'aNext'),
      aSide: gl.getAttribLocation(prog, 'aSide'),
      aT: gl.getAttribLocation(prog, 'aT'),
      uRes: gl.getUniformLocation(prog, 'uRes'),
      uWidth: gl.getUniformLocation(prog, 'uWidth'),
      uTime: gl.getUniformLocation(prog, 'uTime'),
      uWave: gl.getUniformLocation(prog, 'uWave'),
      uAmp: gl.getUniformLocation(prog, 'uAmp'),
      uColor: gl.getUniformLocation(prog, 'uColor'),
      uFade: gl.getUniformLocation(prog, 'uFade'),
    };
    gl.uniform1f(loc.uWave, enableShaderEffect ? 1 : 0);
    gl.uniform1f(loc.uAmp, effectAmplitude);
    gl.uniform1f(loc.uFade, enableFade ? 1 : 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const [br, bg, bb, ba] = bgKey.split(',').map(Number);
    gl.clearColor(br * ba, bg * ba, bb * ba, ba);

    const P = Math.max(2, Math.round(pointCount));
    const list = colorsKey ? colorsKey.split('|') : [];
    const mid = (list.length - 1) / 2;
    const rnd = (spread: number) => (Math.random() - 0.5) * 2 * spread;

    // Buffers estáticos compartilhados: lado (±1), posição ao longo (t) e índices.
    const side = new Float32Array(P * 2);
    const tt = new Float32Array(P * 2);
    const idx = new Uint16Array((P - 1) * 6);
    for (let i = 0; i < P; i++) {
      side[i * 2] = -1;
      side[i * 2 + 1] = 1;
      tt[i * 2] = tt[i * 2 + 1] = i / (P - 1);
    }
    for (let i = 0; i < P - 1; i++) {
      const a = i * 2;
      idx.set([a, a + 1, a + 2, a + 2, a + 1, a + 3], i * 6);
    }
    const mkBuf = (data: Float32Array | Uint16Array, target: number, usage: number) => {
      const b = gl.createBuffer()!;
      gl.bindBuffer(target, b);
      gl.bufferData(target, data, usage);
      return b;
    };
    const sideBuf = mkBuf(side, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    const tBuf = mkBuf(tt, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
    const idxBuf = mkBuf(idx, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);

    const ribbons = list.map((hex, i) => {
      const pts = Array.from({ length: P }, () => [0, 0]);
      const pos = new Float32Array(P * 4);
      const prev = new Float32Array(P * 4);
      const next = new Float32Array(P * 4);
      return {
        color: parseColor(hex),
        spring: baseSpring + rnd(0.025),
        friction: baseFriction + rnd(0.025),
        width: baseThickness + rnd(1.5),
        offset: [(i - mid) * offsetFactor + rnd(0.005), rnd(0.05)],
        head: [0, 0],
        vel: [0, 0],
        pts,
        pos,
        prev,
        next,
        posBuf: mkBuf(pos, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
        prevBuf: mkBuf(prev, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
        nextBuf: mkBuf(next, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW),
      };
    });

    const bindAttr = (buf: WebGLBuffer, l: number, n: number) => {
      if (l < 0) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(l);
      gl.vertexAttribPointer(l, n, gl.FLOAT, false, 0, 0);
    };

    let cssW = 1;
    let cssH = 1;
    const resize = () => {
      cssW = wrap.clientWidth || 300;
      cssH = wrap.clientHeight || 150;
      const dpr = window.devicePixelRatio || 2;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.uRes, cssW, cssH);
    };
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(wrap);

    // Alvo do ponteiro em coordenadas normalizadas (−1..1, Y para cima).
    const target = [0, 0];
    const setTarget = (cx: number, cy: number) => {
      const r = wrap.getBoundingClientRect();
      target[0] = ((cx - r.left) / (r.width || 1)) * 2 - 1;
      target[1] = -(((cy - r.top) / (r.height || 1)) * 2 - 1);
    };
    const onMouse = (e: MouseEvent) => setTarget(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setTarget(t.clientX, t.clientY);
    };
    wrap.addEventListener('mousemove', onMouse);
    wrap.addEventListener('touchstart', onTouch, { passive: true });
    wrap.addEventListener('touchmove', onTouch, { passive: true });

    const ageOk = Number.isFinite(maxAge) && maxAge > 0;
    let raf = 0;
    let running = false;
    let last = 0;
    let acc = 0;
    let time = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(100, Math.max(0, now - last));
      last = now;
      time += dt / 1000;

      // Cabeça com mola, integrada em passo fixo (~16,7 ms).
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 6) {
        acc -= STEP;
        steps++;
        for (const rb of ribbons) {
          for (let k = 0; k < 2; k++) {
            const goal = target[k] + rb.offset[k];
            const accel = (goal - rb.head[k]) * rb.spring;
            rb.vel[k] = (rb.vel[k] + accel) * rb.friction;
            rb.head[k] += rb.vel[k];
          }
        }
      }
      if (steps === 6) acc = 0;

      const frac = ageOk ? Math.min(1, (dt * speedMultiplier) / (maxAge / (P - 1))) : 0.9;

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(loc.uTime, time);
      bindAttr(sideBuf, loc.aSide, 1);
      bindAttr(tBuf, loc.aT, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

      for (const rb of ribbons) {
        const pts = rb.pts;
        pts[0][0] = rb.head[0];
        pts[0][1] = rb.head[1];
        for (let i = 1; i < P; i++) {
          pts[i][0] += (pts[i - 1][0] - pts[i][0]) * frac;
          pts[i][1] += (pts[i - 1][1] - pts[i][1]) * frac;
        }
        for (let i = 0; i < P; i++) {
          const a = pts[i];
          const b = pts[Math.max(0, i - 1)];
          const c = pts[Math.min(P - 1, i + 1)];
          for (let s = 0; s < 2; s++) {
            const o = (i * 2 + s) * 2;
            rb.pos[o] = a[0];
            rb.pos[o + 1] = a[1];
            rb.prev[o] = b[0];
            rb.prev[o + 1] = b[1];
            rb.next[o] = c[0];
            rb.next[o + 1] = c[1];
          }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, rb.posBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, rb.pos);
        gl.bindBuffer(gl.ARRAY_BUFFER, rb.prevBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, rb.prev);
        gl.bindBuffer(gl.ARRAY_BUFFER, rb.nextBuf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, rb.next);
        bindAttr(rb.posBuf, loc.aPos, 2);
        bindAttr(rb.prevBuf, loc.aPrev, 2);
        bindAttr(rb.nextBuf, loc.aNext, 2);
        gl.uniform3fv(loc.uColor, rb.color);
        gl.uniform1f(loc.uWidth, rb.width);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
      }
    };

    // Pausa fora da viewport ou com a aba oculta.
    let inView = true;
    const update = () => {
      const should = inView && !document.hidden;
      if (should && !running) {
        running = true;
        last = performance.now();
        acc = 0;
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            inView = entries[0]?.isIntersecting ?? true;
            update();
          })
        : null;
    io?.observe(wrap);
    document.addEventListener('visibilitychange', update);
    update();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', update);
      wrap.removeEventListener('mousemove', onMouse);
      wrap.removeEventListener('touchstart', onTouch);
      wrap.removeEventListener('touchmove', onTouch);
      for (const rb of ribbons) {
        gl.deleteBuffer(rb.posBuf);
        gl.deleteBuffer(rb.prevBuf);
        gl.deleteBuffer(rb.nextBuf);
      }
      gl.deleteBuffer(sideBuf);
      gl.deleteBuffer(tBuf);
      gl.deleteBuffer(idxBuf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // sceneKey resume todas as dependências por conteúdo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey, reduced]);

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      {!reduced && (
        <canvas
          key={sceneKey}
          ref={canvasRef}
          aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
        />
      )}
    </div>
  );
}

export default Ribbons;
