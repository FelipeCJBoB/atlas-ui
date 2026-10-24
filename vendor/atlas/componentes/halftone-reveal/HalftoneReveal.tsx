// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type CSSProperties } from 'react';

export type HalftoneMode = 'mono' | 'duotone' | 'cmyk';
export type HalftoneShape = 'circle' | 'square' | 'diamond' | 'line';
export type HalftoneTrigger = 'hover' | 'always' | 'off';

export interface HalftoneRevealProps {
  /** URL ou data URI; sem valor, usa uma cena procedural própria. */
  src?: string;
  inkColor?: string;
  paperColor?: string;
  mode?: HalftoneMode;
  dotSize?: number;
  density?: number;
  angle?: number;
  shape?: HalftoneShape;
  contrast?: number;
  invert?: boolean;
  radius?: number;
  sharpness?: number;
  follow?: number;
  idleReveal?: number;
  trigger?: HalftoneTrigger;
  borderRadius?: string;
  /** Texto alternativo; quando presente, o contêiner vira role="img". */
  alt?: string;
  className?: string;
  style?: CSSProperties;
}

// Cena procedural 3:2: céu em degradê, sol, colinas em camadas e objetos em primeiro plano.
export function createSampleScene(width = 1200, height = 800): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const g = c.getContext('2d');
  if (!g) return c;
  const sky = g.createLinearGradient(0, 0, 0, height * 0.7);
  sky.addColorStop(0, '#1d3b8f');
  sky.addColorStop(0.45, '#7b5fc7');
  sky.addColorStop(0.75, '#f08a7a');
  sky.addColorStop(1, '#ffd38a');
  g.fillStyle = sky;
  g.fillRect(0, 0, width, height);
  // sol com halo
  const sx = width * 0.66;
  const sy = height * 0.42;
  const halo = g.createRadialGradient(sx, sy, 0, sx, sy, height * 0.45);
  halo.addColorStop(0, 'rgba(255,240,190,0.95)');
  halo.addColorStop(0.18, 'rgba(255,210,140,0.7)');
  halo.addColorStop(1, 'rgba(255,160,120,0)');
  g.fillStyle = halo;
  g.fillRect(0, 0, width, height);
  g.fillStyle = '#fff6d8';
  g.beginPath();
  g.arc(sx, sy, height * 0.085, 0, Math.PI * 2);
  g.fill();
  // nuvens suaves
  g.fillStyle = 'rgba(255,230,240,0.35)';
  for (const [cx, cy, r] of [
    [0.18, 0.2, 0.06],
    [0.24, 0.19, 0.08],
    [0.31, 0.21, 0.05],
    [0.78, 0.15, 0.05],
    [0.84, 0.14, 0.07],
  ]) {
    g.beginPath();
    g.ellipse(cx * width, cy * height, r * width, r * height * 0.9, 0, 0, Math.PI * 2);
    g.fill();
  }
  // colinas em camadas
  const hills: [string, string, number, number, number][] = [
    ['#b35a8c', '#7e3f7a', 0.55, 0.05, 2.1],
    ['#6a3f8f', '#3d2a6e', 0.63, 0.06, 3.3],
    ['#2f7a6b', '#1d4f4a', 0.72, 0.05, 1.6],
    ['#1f5a3a', '#0f2f22', 0.83, 0.06, 2.7],
  ];
  hills.forEach(([top, bottom, base, amp, freq], k) => {
    const grad = g.createLinearGradient(0, height * (base - amp), 0, height);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, height);
    for (let x = 0; x <= width; x += 8) {
      const t = x / width;
      const y = base + amp * Math.sin(t * Math.PI * freq + k * 1.7) + amp * 0.4 * Math.sin(t * Math.PI * freq * 3.1 + k);
      g.lineTo(x, y * height);
    }
    g.lineTo(width, height);
    g.closePath();
    g.fill();
  });
  // árvores (triângulos) e uma casinha no primeiro plano
  const tree = (x: number, y: number, s: number, col: string) => {
    g.fillStyle = '#2a1a12';
    g.fillRect(x - s * 0.06, y - s * 0.2, s * 0.12, s * 0.2);
    g.fillStyle = col;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(x, y - s * (1.05 - i * 0.22));
      g.lineTo(x - s * (0.32 + i * 0.06), y - s * (0.35 - i * 0.12) - s * 0.05);
      g.lineTo(x + s * (0.32 + i * 0.06), y - s * (0.35 - i * 0.12) - s * 0.05);
      g.closePath();
      g.fill();
    }
  };
  tree(width * 0.1, height * 0.93, height * 0.3, '#2e8b57');
  tree(width * 0.17, height * 0.95, height * 0.22, '#3fa267');
  tree(width * 0.88, height * 0.94, height * 0.34, '#24704a');
  tree(width * 0.94, height * 0.97, height * 0.2, '#58b97b');
  const hx = width * 0.42;
  const hy = height * 0.9;
  g.fillStyle = '#e9d7c0';
  g.fillRect(hx, hy - height * 0.12, width * 0.1, height * 0.12);
  g.fillStyle = '#c0392b';
  g.beginPath();
  g.moveTo(hx - width * 0.012, hy - height * 0.12);
  g.lineTo(hx + width * 0.05, hy - height * 0.2);
  g.lineTo(hx + width * 0.112, hy - height * 0.12);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffcf5a';
  g.fillRect(hx + width * 0.015, hy - height * 0.09, width * 0.022, height * 0.035);
  g.fillStyle = '#5a3a2a';
  g.fillRect(hx + width * 0.06, hy - height * 0.07, width * 0.022, height * 0.07);
  // flores coloridas
  const flowers = ['#ff5d8f', '#ffd166', '#5ec8ff', '#ff8c42', '#c77dff'];
  for (let i = 0; i < 46; i++) {
    const fx = ((i * 97.13) % 1) * width;
    const fy = height * (0.9 + ((i * 0.6180339) % 1) * 0.1);
    g.fillStyle = flowers[i % flowers.length];
    g.beginPath();
    g.arc(fx, fy, height * 0.009 + (i % 3) * 1.5, 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uImgAspect;
uniform float uHasImg;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform int uMode;
uniform int uShape;
uniform float uDot;
uniform float uDensity;
uniform float uAngle;
uniform float uContrast;
uniform float uInvert;
uniform vec2 uLens;
uniform float uRadius;
uniform float uSharp;
uniform float uActive;
uniform float uIdle;
out vec4 outColor;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }

vec3 adjust(vec3 c) {
  c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
  return mix(c, 1.0 - c, uInvert);
}

// p: espaço normalizado (altura = 1, largura = proporção), y para cima.
vec2 coverUV(vec2 p) {
  float a = uRes.x / uRes.y;
  vec2 uv = vec2(p.x / a, p.y);
  if (a > uImgAspect) uv.y = (uv.y - 0.5) * (uImgAspect / a) + 0.5;
  else uv.x = (uv.x - 0.5) * (a / uImgAspect) + 0.5;
  return uv;
}

vec3 photo(vec2 p) { return adjust(texture(uTex, coverUV(p)).rgb); }

float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Amostra a cor no centro da célula de uma tela girada; devolve a posição local na célula.
vec3 cellSample(vec2 p, float ang, out vec2 local) {
  vec2 q = rot(ang) * p * uDensity;
  vec2 cell = floor(q) + 0.5;
  local = q - cell;
  vec2 center = rot(-ang) * (cell / uDensity);
  return photo(center);
}

float coverage(vec2 f, float ink, float size) {
  float d;
  if (uShape == 1) d = max(abs(f.x), abs(f.y));
  else if (uShape == 2) d = (abs(f.x) + abs(f.y)) * 0.7071;
  else if (uShape == 3) d = abs(f.y);
  else d = length(f);
  float r = sqrt(clamp(ink, 0.0, 1.0)) * 0.72 * size;
  float aa = 0.6 * uDensity / uRes.y;
  return 1.0 - smoothstep(r - aa, r + aa, d);
}

vec3 halftone(vec2 p) {
  vec2 f;
  float base = radians(uAngle);
  if (uMode == 1) {
    vec3 ink2 = mix(uInk.gbr, vec3(0.90, 0.24, 0.30), 0.7);
    vec3 c2 = cellSample(p, base + radians(38.0), f);
    float cov2 = coverage(f, pow(1.0 - lum(c2), 1.4), uDot * 0.92);
    vec3 col = mix(uPaper, ink2, cov2 * 0.85);
    vec3 c1 = cellSample(p, base, f);
    float cov1 = coverage(f, 1.0 - lum(c1), uDot);
    return mix(col, uInk, cov1);
  }
  if (uMode == 2) {
    vec3 col = uPaper;
    vec3 s;
    float c, m, y, g;
    s = cellSample(p, base + radians(15.0), f);
    c = 1.0 - s.r; m = 1.0 - s.g; y = 1.0 - s.b; g = min(c, min(m, y));
    col *= mix(vec3(1.0), vec3(0.10, 0.72, 0.90), coverage(f, c - 0.5 * g, uDot * 0.82));
    s = cellSample(p, base + radians(75.0), f);
    c = 1.0 - s.r; m = 1.0 - s.g; y = 1.0 - s.b; g = min(c, min(m, y));
    col *= mix(vec3(1.0), vec3(0.92, 0.10, 0.52), coverage(f, m - 0.5 * g, uDot * 0.82));
    s = cellSample(p, base, f);
    c = 1.0 - s.r; m = 1.0 - s.g; y = 1.0 - s.b; g = min(c, min(m, y));
    col *= mix(vec3(1.0), vec3(0.98, 0.86, 0.10), coverage(f, y - 0.5 * g, uDot * 0.82));
    s = cellSample(p, base + radians(45.0), f);
    c = 1.0 - s.r; m = 1.0 - s.g; y = 1.0 - s.b; g = min(c, min(m, y));
    float l = 1.0 - lum(s);
    float k = max(0.5 * g, 0.9 * l * l);
    col *= mix(vec3(1.0), vec3(0.08), coverage(f, k, uDot * 0.78));
    return col;
  }
  vec3 c0 = cellSample(p, base, f);
  return mix(uPaper, uInk, coverage(f, 1.0 - lum(c0), uDot));
}

void main() {
  if (uHasImg < 0.5) { outColor = vec4(uPaper, 1.0); return; }
  vec2 p = gl_FragCoord.xy / uRes.y;
  vec3 col = halftone(p);
  if (uIdle > 0.0) col = mix(col, photo(p), uIdle);
  if (uActive > 0.001 && uRadius > 0.0) {
    vec2 dv = p - uLens;
    float d = length(dv);
    float t = clamp(d / uRadius, 0.0, 1.0);
    vec2 n = d > 1e-5 ? dv / d : vec2(0.0);
    float t4 = t * t * t * t;
    vec2 sp = p - n * (0.22 * uRadius * t4);
    vec2 ca = n * (0.0045 * t4);
    vec3 lens = vec3(photo(sp + ca).r, photo(sp).g, photo(sp - ca).b);
    float edge = max(uRadius * (1.0 - uSharp) * 0.45, 1.4 / uRes.y);
    float mask = (1.0 - smoothstep(uRadius - edge, uRadius, d)) * uActive;
    col = mix(col, lens, mask);
  }
  outColor = vec4(col, 1.0);
}`;

function hexToRgb(hex: string, fallback: [number, number, number]): [number, number, number] {
  let h = (hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const MODE_ID: Record<HalftoneMode, number> = { mono: 0, duotone: 1, cmyk: 2 };
const SHAPE_ID: Record<HalftoneShape, number> = { circle: 0, square: 1, diamond: 2, line: 3 };

export function HalftoneReveal({
  src,
  inkColor = '#141414',
  paperColor = '#fff7e6',
  mode = 'mono',
  dotSize = 1,
  density = 71,
  angle = 45,
  shape = 'circle',
  contrast = 1.15,
  invert = false,
  radius = 0.4,
  sharpness = 0.8,
  follow = 0.37,
  idleReveal = 0,
  trigger = 'hover',
  borderRadius = '16px',
  alt,
  className,
  style,
}: HalftoneRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const params = useRef({ inkColor, paperColor, mode, dotSize, density, angle, shape, contrast, invert, radius, sharpness, follow, idleReveal, trigger });
  params.current = { inkColor, paperColor, mode, dotSize, density, angle, shape, contrast, invert, radius, sharpness, follow, idleReveal, trigger };
  const kickRef = useRef<() => void>(() => {});

  // Qualquer mudança de parâmetro pede um novo quadro.
  useEffect(() => {
    kickRef.current();
  }, [inkColor, paperColor, mode, dotSize, density, angle, shape, contrast, invert, radius, sharpness, follow, idleReveal, trigger]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    const compile = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.warn(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = {
      tex: U('uTex'), res: U('uRes'), imgAspect: U('uImgAspect'), hasImg: U('uHasImg'), ink: U('uInk'), paper: U('uPaper'),
      mode: U('uMode'), shape: U('uShape'), dot: U('uDot'), density: U('uDensity'), angle: U('uAngle'), contrast: U('uContrast'),
      invert: U('uInvert'), lens: U('uLens'), radius: U('uRadius'), sharp: U('uSharp'), active: U('uActive'), idle: U('uIdle'),
    };

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u.tex, 0);
    let hasImg = false;
    let imgAspect = 1.5;
    let disposed = false;
    const upload = (source: TexImageSource, w: number, h: number) => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      imgAspect = w / Math.max(1, h);
      hasImg = true;
      kick();
    };
    if (src) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => upload(img, img.naturalWidth, img.naturalHeight);
      img.src = src;
    } else {
      const scene = createSampleScene();
      // upload adiado para depois de `kick` existir
      queueMicrotask(() => upload(scene, scene.width, scene.height));
    }

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const state = {
      w: 1,
      h: 1,
      lens: [0, 0.5] as [number, number],
      target: [0, 0.5] as [number, number],
      act: 0,
      actTarget: 0,
      inside: false,
      visible: true,
      initialized: false,
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width * dpr));
      const h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      state.w = r.width || 1;
      state.h = r.height || 1;
      if (!state.initialized) {
        // começa no centro
        state.lens = [state.w / state.h / 2, 0.5];
        state.target = [...state.lens];
        state.initialized = true;
      }
      kick();
    };

    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = 0;
      const p = params.current;
      const dt = Math.min(0.05, Math.max(0.001, last ? (now - last) / 1000 : 0.016));
      last = now;
      const always = p.trigger === 'always';
      const off = p.trigger === 'off';
      const isReduced = !!reduced?.matches;
      if (off) state.actTarget = 0;
      else if (always) state.actTarget = 1;
      else state.actTarget = state.inside && !isReduced ? 1 : 0;
      if (always && isReduced) state.target = [state.w / state.h / 2, 0.5];

      const kf = 1 - Math.exp(-dt / Math.max(0.001, p.follow));
      state.lens[0] += (state.target[0] - state.lens[0]) * kf;
      state.lens[1] += (state.target[1] - state.lens[1]) * kf;
      if (always) state.act = 1;
      else state.act += (state.actTarget - state.act) * (1 - Math.exp(-dt / 0.18));

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.imgAspect, imgAspect);
      gl.uniform1f(u.hasImg, hasImg ? 1 : 0);
      gl.uniform3fv(u.ink, hexToRgb(p.inkColor, [0.078, 0.078, 0.078]));
      gl.uniform3fv(u.paper, hexToRgb(p.paperColor, [1, 0.969, 0.902]));
      gl.uniform1i(u.mode, MODE_ID[p.mode] ?? 0);
      gl.uniform1i(u.shape, SHAPE_ID[p.shape] ?? 0);
      gl.uniform1f(u.dot, p.dotSize);
      gl.uniform1f(u.density, p.density);
      gl.uniform1f(u.angle, p.angle);
      gl.uniform1f(u.contrast, p.contrast);
      gl.uniform1f(u.invert, p.invert ? 1 : 0);
      gl.uniform2f(u.lens, state.lens[0], state.lens[1]);
      gl.uniform1f(u.radius, p.radius * (0.4 + 0.6 * state.act));
      gl.uniform1f(u.sharp, Math.min(1, Math.max(0, p.sharpness)));
      gl.uniform1f(u.active, state.act);
      gl.uniform1f(u.idle, Math.min(1, Math.max(0, p.idleReveal)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Pausa quando a lupa assentou (atividade no alvo e posição parada).
      const settled =
        Math.abs(state.act - state.actTarget) < 0.002 &&
        Math.abs(state.target[0] - state.lens[0]) < 0.0005 &&
        Math.abs(state.target[1] - state.lens[1]) < 0.0005;
      if (!settled && state.visible) raf = requestAnimationFrame(draw);
      else last = 0;
    };
    function kick() {
      if (!raf && state.visible && !disposed) raf = requestAnimationFrame(draw);
    }
    kickRef.current = kick;

    const toLocal = (e: PointerEvent): [number, number] => {
      const r = wrap.getBoundingClientRect();
      const h = r.height || 1;
      return [(e.clientX - r.left) / h, 1 - (e.clientY - r.top) / h];
    };
    const onEnter = (e: PointerEvent) => {
      state.target = toLocal(e);
      if (!state.inside && params.current.trigger !== 'always') state.lens = [...state.target];
      state.inside = true;
      kick();
    };
    const onMove = (e: PointerEvent) => {
      if (!state.inside) onEnter(e);
      state.target = toLocal(e);
      kick();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch' && e.type === 'pointerleave') return;
      state.inside = false;
      kick();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        state.inside = false;
        kick();
      }
    };
    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerdown', onEnter);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      state.visible = entry.isIntersecting;
      if (state.visible) kick();
    });
    io.observe(wrap);
    resize();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      kickRef.current = () => {};
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerdown', onEnter);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
      gl.deleteTexture(tex);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteVertexArray(vao);
    };
  }, [src]);

  return (
    <div
      ref={wrapRef}
      className={className}
      role={alt ? 'img' : undefined}
      aria-label={alt}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius,
        cursor: 'crosshair',
        touchAction: 'none',
        background: paperColor,
        ...style,
      }}
    >
      <canvas ref={canvasRef} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

export default HalftoneReveal;
