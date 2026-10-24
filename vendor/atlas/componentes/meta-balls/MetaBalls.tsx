// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef } from 'react';

export interface MetaBallsProps {
  /** Cor das bolhas (hex). */
  color?: string;
  /** Velocidade global das órbitas. */
  speed?: number;
  /** A bolha do cursor segue o ponteiro. */
  enableMouseInteraction?: boolean;
  /** Fração de aproximação por quadro (referência 60 Hz) da bolha do cursor. */
  hoverSmoothness?: number;
  /** Altura da área em unidades de mundo (zoom inverso). */
  animationSize?: number;
  /** Quantidade de bolhas (1 a 50). */
  ballCount?: number;
  /** Fator de aglomeração das órbitas. */
  clumpFactor?: number;
  /** Raio da bolha do cursor. */
  cursorBallSize?: number;
  /** Cor da bolha do cursor (hex). */
  cursorBallColor?: string;
  /** Fundo transparente (cor pré-multiplicada pela cobertura). */
  enableTransparency?: boolean;
  className?: string;
}

const MAX_BALLS = 50;
const THRESHOLD = 1.3;

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uWorld;
uniform vec3 uBalls[${MAX_BALLS}];
uniform int uCount;
uniform vec3 uCursor;
uniform vec3 uColor;
uniform vec3 uCursorColor;
uniform float uTransparent;
out vec4 outColor;

void main() {
  // Coordenada de mundo: origem no centro, altura = uWorld unidades.
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) * (uWorld / uRes.y);
  float fb = 0.0;
  for (int i = 0; i < ${MAX_BALLS}; i++) {
    if (i >= uCount) break;
    vec2 d = p - uBalls[i].xy;
    fb += uBalls[i].z * uBalls[i].z / max(dot(d, d), 1e-5);
  }
  vec2 dc = p - uCursor.xy;
  float fc = uCursor.z * uCursor.z / max(dot(dc, dc), 1e-5);
  float f = fb + fc;
  // Teto do campo: evita derivadas enormes perto dos centros (pontos de serrilhado).
  float fs = min(f, 4.0);
  // Limiar com borda de ~1 px a partir da derivada de tela do campo.
  float w = max(fwidth(fs), 1e-5);
  float a = clamp((fs - ${THRESHOLD.toFixed(2)}) / w + 0.5, 0.0, 1.0);
  vec3 col = mix(uColor, uCursorColor, clamp(fc / max(f, 1e-5), 0.0, 1.0));
  if (uTransparent > 0.5) outColor = vec4(col * a, a);
  else outColor = vec4(col * a, 1.0);
}`;

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

// Hash determinístico: mesmo padrão a cada montagem.
function hash(i: number, k: number): number {
  const s = Math.sin(i * 127.1 + k * 311.7 + 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

interface Ball {
  angle: number;
  rate: number;
  orbit: number;
  sel: number;
  radius: number;
}

function makeBalls(count: number): Ball[] {
  const out: Ball[] = [];
  for (let i = 0; i < count; i++) {
    const r = hash(i, 2); // mesmo valor para velocidade e raio da órbita
    out.push({
      angle: hash(i, 1) * Math.PI * 2,
      rate: Math.PI * (0.1 + 0.3 * r),
      orbit: 5 + 5 * r,
      sel: hash(i, 3) < 0.5 ? 0 : 1,
      radius: 0.5 + 1.5 * hash(i, 4),
    });
  }
  return out;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(sh));
  return sh;
}

export function MetaBalls({
  color = '#ffffff',
  speed = 0.3,
  enableMouseInteraction = true,
  hoverSmoothness = 0.05,
  animationSize = 30,
  ballCount = 15,
  clumpFactor = 1,
  cursorBallSize = 3,
  cursorBallColor = '#ffffff',
  enableTransparency = false,
  className = '',
}: MetaBallsProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  // Qualquer mudança de parâmetro recria todo o contexto de desenho.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    host.appendChild(canvas);
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    });
    if (!gl) {
      host.removeChild(canvas);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Triângulo de tela cheia.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u('uRes');
    const uWorld = u('uWorld');
    const uBalls = u('uBalls');
    const uCount = u('uCount');
    const uCursor = u('uCursor');
    gl.uniform3fv(u('uColor'), hexToRgb(color));
    gl.uniform3fv(u('uCursorColor'), hexToRgb(cursorBallColor));
    gl.uniform1f(u('uTransparent'), enableTransparency ? 1 : 0);
    gl.clearColor(0, 0, 0, enableTransparency ? 0 : 1);

    const count = Math.max(1, Math.min(MAX_BALLS, Math.round(ballCount)));
    const balls = makeBalls(count);
    const ballData = new Float32Array(MAX_BALLS * 3);

    // Densidade de pixels fixa em 1.
    let W = 1;
    let H = 1;
    const resize = () => {
      W = Math.max(1, Math.round(host.clientWidth || 300));
      H = Math.max(1, Math.round(host.clientHeight || 300));
      canvas.width = W;
      canvas.height = H;
      gl.viewport(0, 0, W, H);
      gl.uniform2f(uRes, W, H);
    };
    resize();
    window.addEventListener('resize', resize);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(host);

    // Ponteiro em px da superfície, origem no canto inferior esquerdo.
    let inside = false;
    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      px = e.clientX - r.left;
      py = r.height - (e.clientY - r.top);
      inside = true;
    };
    const onLeave = () => {
      inside = false;
    };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerenter', onMove);
    host.addEventListener('pointerleave', onLeave);

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    // A bolha do cursor parte da origem da superfície (canto inferior esquerdo).
    let cx = 0;
    let cy = 0;
    let t = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      if (!reduced) t += dt;

      const k = (animationSize / H);
      for (let i = 0; i < count; i++) {
        const b = balls[i];
        const phase = t * speed * b.rate;
        ballData[i * 3] = Math.cos(b.angle + phase) * b.orbit * clumpFactor;
        ballData[i * 3 + 1] = Math.sin(b.angle + phase + phase * b.sel) * b.orbit * clumpFactor;
        ballData[i * 3 + 2] = b.radius;
      }

      let tx: number;
      let ty: number;
      if (enableMouseInteraction && inside) {
        tx = px;
        ty = py;
      } else {
        const a = t * speed;
        tx = W * 0.5 + Math.cos(a) * W * 0.15;
        ty = H * 0.5 + Math.sin(a) * H * 0.15;
      }
      if (reduced) {
        cx = tx;
        cy = ty;
      } else {
        // Aproximação exponencial normalizada pelo Δt (referência de 60 quadros/s).
        const s = Math.min(1, Math.max(0, hoverSmoothness));
        const f = 1 - Math.pow(1 - s, dt * 60);
        cx += (tx - cx) * f;
        cy += (ty - cy) * f;
      }

      gl.uniform1f(uWorld, animationSize);
      gl.uniform1i(uCount, count);
      gl.uniform3fv(uBalls, ballData);
      gl.uniform3f(uCursor, (cx - W * 0.5) * k, (cy - H * 0.5) * k, cursorBallSize);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
          })
        : null;
    io?.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ro?.disconnect();
      io?.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerenter', onMove);
      host.removeEventListener('pointerleave', onLeave);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [
    color,
    speed,
    enableMouseInteraction,
    hoverSmoothness,
    animationSize,
    ballCount,
    clumpFactor,
    cursorBallSize,
    cursorBallColor,
    enableTransparency,
  ]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    />
  );
}

export default MetaBalls;
