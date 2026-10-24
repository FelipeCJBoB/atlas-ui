// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useRef, type CanvasHTMLAttributes } from 'react';

export interface GooeyFilterOptions {
  id: string;
  /** Desvio do desfoque gaussiano. */
  strength: number;
}

export interface PixelTrailProps {
  /** Células ao longo do maior lado. */
  gridSize?: number;
  /** Raio do pincel como fração do lado do mapa. */
  trailSize?: number;
  /** Vida de cada ponto (ms). */
  maxAge?: number;
  /** Pontos intermediários entre amostras (0 = sem interpolação). */
  interpolate?: number;
  /** Easing do envelope (0–1 → 0–1). */
  easing?: (x: number) => number;
  gooeyFilter?: GooeyFilterOptions;
  color?: string;
  canvasProps?: CanvasHTMLAttributes<HTMLCanvasElement>;
  glOptions?: WebGLContextAttributes;
  className?: string;
}

const MAP = 512;
const identity = (x: number) => x;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Converte o pixel de tela para o espaço quadrado (cobre o maior lado), quantiza no centro
// da célula e usa a intensidade do mapa como alfa.
const FRAG = `
precision mediump float;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uCells;
uniform vec3 uColor;
void main() {
  float m = max(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / m + 0.5;
  vec2 c = (floor(p * uCells) + 0.5) / uCells;
  float a = texture2D(uMap, c).r;
  gl_FragColor = vec4(uColor * a, a);
}
`;

function cssColorToRgb(color: string): [number, number, number] {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const ctx = cv.getContext('2d');
  if (!ctx) return [1, 1, 1];
  ctx.fillStyle = '#ffffff';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0] / 255, d[1] / 255, d[2] / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
  return s;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;
  force: number;
}

export function PixelTrail({
  gridSize = 40,
  trailSize = 0.1,
  maxAge = 250,
  interpolate = 5,
  easing = identity,
  gooeyFilter,
  color = '#ffffff',
  canvasProps,
  glOptions,
  className = '',
}: PixelTrailProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const easingRef = useRef(easing);
  easingRef.current = easing;

  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const filterId = gooeyFilter ? `${gooeyFilter.id}-${rawId}` : undefined;
  const glKey = JSON.stringify(glOptions ?? {});
  // Um canvas novo por cena: um contexto liberado não pode ser reaproveitado.
  const sceneKey = [gridSize, trailSize, maxAge, interpolate, color, glKey].join('|');

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      powerPreference: 'high-performance',
      alpha: true,
      premultipliedAlpha: true,
      ...(JSON.parse(glKey) as WebGLContextAttributes),
    });
    if (!gl) return;

    // Mapa de rastro: canvas 2D fora da tela.
    const map = document.createElement('canvas');
    map.width = map.height = MAP;
    const ctx = map.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, MAP, MAP);

    const prog = gl.createProgram()!;
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map);

    const uRes = gl.getUniformLocation(prog, 'uRes');
    gl.uniform1i(gl.getUniformLocation(prog, 'uMap'), 0);
    gl.uniform1f(gl.getUniformLocation(prog, 'uCells'), Math.max(1, gridSize));
    gl.uniform3fv(gl.getUniformLocation(prog, 'uColor'), cssColorToRgb(color));
    gl.clearColor(0, 0, 0, 0);

    let size = { w: 1, h: 1 };
    const resize = () => {
      const w = wrap.clientWidth || 300;
      const h = wrap.clientHeight || 150;
      const dpr = Math.min(1.25, Math.max(1, window.devicePixelRatio || 1));
      size = { w, h };
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      dirty = true;
    };
    let dirty = true;
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(wrap);

    // Pontos do rastro, no espaço do mapa (0..512, y para baixo).
    const points: TrailPoint[] = [];
    let last: { x: number; y: number } | null = null;
    const steps = interpolate > 0 ? Math.ceil(interpolate) : 0;

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      const m = Math.max(size.w, size.h);
      const u = (e.clientX - r.left - size.w / 2) / m + 0.5;
      const v = (e.clientY - r.top - size.h / 2) / m + 0.5;
      const cur = { x: u * MAP, y: v * MAP };
      // Força do gesto: proporcional à velocidade, com mínimo.
      const dist = last ? Math.hypot(cur.x - last.x, cur.y - last.y) / MAP : 0;
      const force = Math.min(1, Math.max(0.4, dist * 50));
      if (last && steps > 0) {
        for (let k = 1; k <= steps; k++) {
          const t = k / (steps + 1);
          points.push({ x: last.x + (cur.x - last.x) * t, y: last.y + (cur.y - last.y) * t, age: 0, force });
        }
      }
      points.push({ ...cur, age: 0, force });
      if (points.length > 4000) points.splice(0, points.length - 4000);
      last = cur;
    };
    const onLeave = () => {
      last = null;
    };

    // Ouve o pai: a superfície não captura ponteiro e pode ficar sobre conteúdo interativo.
    const target = wrap.parentElement ?? wrap;
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerleave', onLeave);

    const life = Math.max(1, maxAge);
    const brush = trailSize * MAP;
    let raf = 0;
    let prev = performance.now();
    let hadPoints = true;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(100, now - prev);
      prev = now;

      const ease = easingRef.current;
      for (let i = points.length - 1; i >= 0; i--) {
        points[i].age += dt;
        if (points[i].age >= life) points.splice(i, 1);
      }
      if (!points.length && !hadPoints && !dirty) return;
      hadPoints = points.length > 0;
      dirty = false;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, MAP, MAP);
      ctx.globalCompositeOperation = 'screen';
      for (const p of points) {
        const t = p.age / life;
        // Envelope: 30% subindo, 70% descendo.
        const env = t < 0.3 ? ease(t / 0.3) : ease(1 - (t - 0.3) / 0.7);
        const intensity = Math.max(0, env) * p.force;
        const rad = brush * intensity;
        if (rad < 0.5) continue;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
        g.addColorStop(0, `rgba(255,255,255,${Math.min(1, intensity)})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, map);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerleave', onLeave);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [gridSize, trailSize, maxAge, interpolate, color, glKey]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {gooeyFilter && filterId && (
        <svg width={0} height={0} style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
          <defs>
            <filter id={filterId}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={gooeyFilter.strength} result="blur" />
              <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>
      )}
      <canvas
        {...canvasProps}
        key={sceneKey}
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          filter: filterId ? `url(#${filterId})` : undefined,
          ...canvasProps?.style,
        }}
      />
    </div>
  );
}

export default PixelTrail;
