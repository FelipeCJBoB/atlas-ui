// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type CSSProperties } from 'react';
import { Renderer, Program, Mesh, Triangle, RenderTarget } from 'ogl';

export interface GhostTrailProps {
  /** Posições guardadas no histórico do rastro (amostradas a 60 Hz, independente da taxa de quadros). */
  trailLength?: number;
  /** Fator de desaceleração por passo depois que o ponteiro sai. */
  inertia?: number;
  grainIntensity?: number;
  bloomStrength?: number;
  bloomRadius?: number;
  bloomThreshold?: number;
  brightness?: number;
  color?: string;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  /** Vinheta nas bordas (0 = desligada, 1 = zera na borda). */
  edgeIntensity?: number;
  maxDevicePixelRatio?: number;
  /** Orçamento de pixels; padrão ~1,3 M (desktop) / ~0,9 M (toque). */
  targetPixels?: number;
  fadeDelayMs?: number;
  fadeDurationMs?: number;
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
}

const MAX_PUFFS = 64;
const STEP = 1 / 60;
const LEVELS = 5;

const VERT = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

// Fumaça: fBm de 5 oitavas com duas camadas de deformação de domínio.
// O ruído é avaliado em coordenadas do mundo, então Σ pow(n,2.5)·w·queda = pow(n,2.5)·Σ w·queda:
// o fBm é calculado uma vez por pixel em vez de uma vez por baforada.
const SCENE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform float uScale;
uniform float uRadius;
uniform float uOpacity;
uniform float uBrightness;
uniform vec3 uColor;
uniform vec3 uTrail[${MAX_PUFFS}];
uniform int uCount;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
const mat2 ROT = mat2(0.87758, 0.47943, -0.47943, 0.87758);
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = ROT * p * 2.0; a *= 0.5; }
  return v;
}
void main(){
  float r = uRadius * uOpacity;
  if (r <= 0.0001) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= uRes.x / uRes.y;
  float mask = 0.0;
  for (int i = 0; i < ${MAX_PUFFS}; i++){
    if (i >= uCount) break;
    vec3 tr = uTrail[i];
    float f = 1.0 - smoothstep(0.0, r, length(p - tr.xy));
    mask += tr.z * f * f;
  }
  if (mask <= 0.0005) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 q = p * 1.7 * uScale;
  float t = uTime;
  vec2 w1 = vec2(fbm(q + vec2(0.0, t * 0.1)), fbm(q + vec2(5.2, 1.3) - t * 0.1));
  vec2 w2 = vec2(fbm(q + 3.0 * w1 + vec2(1.7, 9.2) + t * 0.15), fbm(q + 3.0 * w1 + vec2(8.3, 2.8) - t * 0.15));
  float n = clamp(fbm(q + 3.0 * w2), 0.0, 1.0);
  float d = pow(n, 2.5) * mask * uBrightness;
  gl_FragColor = vec4(uColor * d, 1.0);
}`;

const BRIGHT_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tMap;
uniform float uThreshold;
void main(){
  vec3 c = texture2D(tMap, vUv).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(c * smoothstep(uThreshold, uThreshold + 0.01, l), 1.0);
}`;

const BLUR_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tMap;
uniform vec2 uDir;
uniform float uKernel;
void main(){
  float sigma = uKernel;
  vec3 sum = texture2D(tMap, vUv).rgb;
  float wsum = 1.0;
  for (int i = 1; i < 12; i++){
    float fi = float(i);
    if (fi >= uKernel) break;
    float w = exp(-0.5 * fi * fi / (sigma * sigma));
    sum += w * (texture2D(tMap, vUv + uDir * fi).rgb + texture2D(tMap, vUv - uDir * fi).rgb);
    wsum += 2.0 * w;
  }
  gl_FragColor = vec4(sum / wsum, 1.0);
}`;

const FINAL_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform sampler2D tB0; uniform sampler2D tB1; uniform sampler2D tB2; uniform sampler2D tB3; uniform sampler2D tB4;
uniform float uStrength;
uniform float uBloomRadius;
uniform float uGrain;
uniform float uTime;
uniform float uEdge;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float lf(float f){ return mix(f, 1.2 - f, uBloomRadius); }
void main(){
  vec3 c = texture2D(tScene, vUv).rgb;
  if (uStrength > 0.0) {
    vec3 b = lf(1.0) * texture2D(tB0, vUv).rgb + lf(0.8) * texture2D(tB1, vUv).rgb + lf(0.6) * texture2D(tB2, vUv).rgb
           + lf(0.4) * texture2D(tB3, vUv).rgb + lf(0.2) * texture2D(tB4, vUv).rgb;
    c += uStrength * b;
  }
  // Grão de filme multiplicativo, novo a cada quadro.
  float g = hash(floor(gl_FragCoord.xy) + fract(uTime * 7.31) * 517.0);
  c *= 1.0 + (g * 2.0 - 1.0) * uGrain;
  if (uEdge > 0.0) {
    float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    c *= mix(1.0, smoothstep(0.0, 0.2, e), clamp(uEdge, 0.0, 1.0));
  }
  c = max(c, 0.0);
  // Alfa reto: opacidade = canal mais brilhante; fumaça escura vira transparência.
  float a = clamp(max(max(c.r, c.g), c.b), 0.0, 1.0);
  vec3 rgb = a > 0.0001 ? clamp(c / max(a, 0.0001), 0.0, 1.0) : vec3(0.0);
  gl_FragColor = vec4(rgb, a);
}`;

function parseColor(input: string): [number, number, number] {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim());
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  try {
    const ctx = document.createElement('canvas').getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000';
      ctx.fillStyle = input;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0] / 255, d[1] / 255, d[2] / 255];
    }
  } catch {
    /* cai no padrão */
  }
  return [0.706, 0.592, 0.812];
}

export function GhostTrail({
  trailLength = 50,
  inertia = 0.5,
  grainIntensity = 0.05,
  bloomStrength = 0.1,
  bloomRadius = 1.0,
  bloomThreshold = 0.025,
  brightness = 1,
  color = '#B497CF',
  mixBlendMode = 'screen',
  edgeIntensity = 0,
  maxDevicePixelRatio = 0.5,
  targetPixels,
  fadeDelayMs,
  fadeDurationMs,
  zIndex = 10,
  className = '',
  style,
}: GhostTrailProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  // Parâmetros atualizados em tempo real (sem recriar a cena).
  const live = useRef({ color: parseColor(color), brightness, edgeIntensity, grainIntensity });
  live.current.brightness = brightness;
  live.current.edgeIntensity = edgeIntensity;
  live.current.grainIntensity = grainIntensity;
  const lastColor = useRef(color);
  if (lastColor.current !== color) {
    lastColor.current = color;
    live.current.color = parseColor(color);
  }

  useEffect(() => {
    const layer = layerRef.current;
    const parent = layer?.parentElement;
    if (!layer || !parent) return;

    // O pai precisa ser posicionado; restaura o valor original ao desmontar.
    const prevPosition = parent.style.position;
    const changedPosition = getComputedStyle(parent).position === 'static';
    if (changedPosition) parent.style.position = 'relative';

    const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const delay = fadeDelayMs ?? (isTouch ? 500 : 1000);
    const fadeDur = Math.max(1, fadeDurationMs ?? (isTouch ? 1000 : 1500));
    const budget = targetPixels ?? (isTouch ? 0.9e6 : 1.3e6);
    const histLen = reduce ? 0 : Math.max(0, Math.min(MAX_PUFFS - 1, Math.round(trailLength)));
    const inert = Math.max(0, Math.min(0.99, inertia));

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: !isTouch,
      depth: false,
      stencil: false,
      dpr: 1,
      powerPreference: isTouch ? 'low-power' : 'high-performance',
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.background = 'transparent';
    layer.appendChild(canvas);

    const geometry = new Triangle(gl);
    // Array comum (não Float32Array): o ogl só reconhece uniformes em vetor quando o valor é Array.
    const trailData: number[] = new Array(MAX_PUFFS * 3).fill(0);
    const sceneProg = new Program(gl, {
      vertex: VERT,
      fragment: SCENE_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uRes: { value: [1, 1] },
        uTime: { value: 0 },
        uScale: { value: 1 },
        uRadius: { value: 0.8 },
        uOpacity: { value: 1 },
        uBrightness: { value: 1 },
        uColor: { value: [1, 1, 1] },
        uTrail: { value: trailData },
        uCount: { value: 0 },
      },
    });
    const brightProg = new Program(gl, {
      vertex: VERT,
      fragment: BRIGHT_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: { tMap: { value: null }, uThreshold: { value: bloomThreshold } },
    });
    const blurProg = new Program(gl, {
      vertex: VERT,
      fragment: BLUR_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: { tMap: { value: null }, uDir: { value: [0, 0] }, uKernel: { value: 3 } },
    });
    const finalProg = new Program(gl, {
      vertex: VERT,
      fragment: FINAL_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: null },
        tB0: { value: null },
        tB1: { value: null },
        tB2: { value: null },
        tB3: { value: null },
        tB4: { value: null },
        uStrength: { value: bloomStrength },
        uBloomRadius: { value: bloomRadius },
        uGrain: { value: 0 },
        uTime: { value: 0 },
        uEdge: { value: 0 },
      },
    });
    const sceneMesh = new Mesh(gl, { geometry, program: sceneProg });
    const brightMesh = new Mesh(gl, { geometry, program: brightProg });
    const blurMesh = new Mesh(gl, { geometry, program: blurProg });
    const finalMesh = new Mesh(gl, { geometry, program: finalProg });

    type RT = InstanceType<typeof RenderTarget>;
    let rtScene: RT | null = null;
    let rtBright: RT | null = null;
    let rtH: RT[] = [];
    let rtV: RT[] = [];
    const freeRT = (rt: RT | null) => {
      if (!rt) return;
      const anyRt = rt as unknown as { buffer?: WebGLFramebuffer; textures?: { texture?: WebGLTexture }[] };
      if (anyRt.buffer) gl.deleteFramebuffer(anyRt.buffer);
      anyRt.textures?.forEach((t) => t.texture && gl.deleteTexture(t.texture));
    };
    const freeAll = () => {
      freeRT(rtScene);
      freeRT(rtBright);
      rtH.forEach(freeRT);
      rtV.forEach(freeRT);
      rtScene = rtBright = null;
      rtH = [];
      rtV = [];
    };
    const makeRT = (w: number, h: number) => new RenderTarget(gl, { width: Math.max(1, w), height: Math.max(1, h), depth: false });

    // Estado do fantasma (posições normalizadas 0–1, y para baixo).
    let cssW = 0;
    let cssH = 0;
    let hasSize = false;
    let pos = { x: 0.5, y: 0.5 };
    let target = { x: 0.5, y: 0.5 };
    let vel = { x: 0, y: 0 };
    const hist: { x: number; y: number }[] = [];
    for (let i = 0; i < histLen; i++) hist.push({ x: 0.5, y: 0.5 });
    let inside = false;
    let lastMove = performance.now();
    let time = 0;
    let acc = 0;
    let last = performance.now();
    let raf = 0;
    let running = false;
    let onScreen = true;

    const opacityAt = (now: number) => {
      if (inside) return 1;
      const e = now - lastMove;
      if (e < delay) return 1;
      return Math.max(0, 1 - (e - delay) / fadeDur);
    };

    const step = () => {
      if (inside) {
        vel = { x: target.x - pos.x, y: target.y - pos.y };
        pos = { x: target.x, y: target.y };
      } else {
        vel = { x: vel.x * inert, y: vel.y * inert };
        pos = { x: Math.min(1, Math.max(0, pos.x + vel.x)), y: Math.min(1, Math.max(0, pos.y + vel.y)) };
      }
      if (histLen > 0) {
        hist.unshift({ x: pos.x, y: pos.y });
        if (hist.length > histLen) hist.length = histLen;
      }
    };

    const draw = (opacity: number) => {
      if (!hasSize || !rtScene || !rtBright) return;
      const aspect = cssW / cssH;
      const toX = (nx: number) => (nx * 2 - 1) * aspect;
      const toY = (ny: number) => (1 - ny) * 2 - 1;
      let count = 0;
      trailData[0] = toX(pos.x);
      trailData[1] = toY(pos.y);
      trailData[2] = 1;
      count = 1;
      for (let i = 1; i < hist.length && count < MAX_PUFFS; i++) {
        const w = 0.8 * Math.pow(1 - i / histLen, 2);
        if (w < 0.01) continue;
        trailData[count * 3] = toX(hist[i].x);
        trailData[count * 3 + 1] = toY(hist[i].y);
        trailData[count * 3 + 2] = w;
        count++;
      }
      const L = live.current;
      // Oscilação lenta entre a base clareada e a base puxada para um azul muito claro.
      const k = 0.5 + 0.5 * Math.sin(time * 0.5);
      const [r, g, b] = L.color;
      const v1 = [r + (1 - r) * 0.15, g + (1 - g) * 0.15, b + (1 - b) * 0.15];
      const v2 = [r + (0.8 - r) * 0.25, g + (0.9 - g) * 0.25, b + (1 - b) * 0.25];
      const u = sceneProg.uniforms;
      u.uColor.value = [v1[0] + (v2[0] - v1[0]) * k, v1[1] + (v2[1] - v1[1]) * k, v1[2] + (v2[2] - v1[2]) * k];
      u.uTime.value = time;
      u.uOpacity.value = opacity;
      u.uBrightness.value = L.brightness;
      u.uCount.value = count;
      u.uTrail.value = trailData;
      renderer.render({ scene: sceneMesh, target: rtScene });

      if (bloomStrength > 0) {
        brightProg.uniforms.tMap.value = rtScene.texture;
        renderer.render({ scene: brightMesh, target: rtBright });
        let src: RT = rtBright;
        for (let i = 0; i < LEVELS; i++) {
          const h = rtH[i];
          const v = rtV[i];
          blurProg.uniforms.uKernel.value = 3 + i * 2;
          blurProg.uniforms.tMap.value = src.texture;
          blurProg.uniforms.uDir.value = [1 / h.width, 0];
          renderer.render({ scene: blurMesh, target: h });
          blurProg.uniforms.tMap.value = h.texture;
          blurProg.uniforms.uDir.value = [0, 1 / v.height];
          renderer.render({ scene: blurMesh, target: v });
          src = v;
        }
      }
      const f = finalProg.uniforms;
      f.tScene.value = rtScene.texture;
      for (let i = 0; i < LEVELS; i++) f['tB' + i].value = (rtV[i] ?? rtScene).texture;
      f.uGrain.value = L.grainIntensity;
      f.uEdge.value = L.edgeIntensity;
      f.uTime.value = time;
      renderer.render({ scene: finalMesh });
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      if (!reduce) time += dt;
      // Rastro amostrado por tempo (60 passos/s), não por quadro: mesma duração em 60 ou 120 Hz.
      acc += dt;
      while (acc >= STEP) {
        acc -= STEP;
        step();
      }
      const op = opacityAt(now);
      draw(op);
      if ((op <= 0 && !inside) || !onScreen || !hasSize) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (running || !onScreen || !hasSize) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const w = layer.clientWidth;
      const h = layer.clientHeight;
      if (!w || !h) {
        hasSize = false;
        return;
      }
      const sizeChanged = w !== cssW || h !== cssH || !rtScene;
      cssW = w;
      cssH = h;
      hasSize = true;
      if (!sizeChanged) return;
      let dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
      const px = w * h * dpr * dpr;
      if (px > budget) dpr *= Math.max(0.5, Math.sqrt(budget / px));
      renderer.dpr = dpr;
      renderer.setSize(w, h);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      const W = Math.max(1, Math.floor(w * dpr));
      const H = Math.max(1, Math.floor(h * dpr));
      freeAll();
      rtScene = makeRT(W, H);
      rtBright = makeRT(W >> 1, H >> 1);
      for (let i = 0; i < LEVELS; i++) {
        const lw = Math.max(1, W >> (i + 1));
        const lh = Math.max(1, H >> (i + 1));
        rtH.push(makeRT(lw, lh));
        rtV.push(makeRT(lw, lh));
      }
      const s = Math.min(2, Math.max(0.5, Math.min(w, h) / 600));
      sceneProg.uniforms.uRes.value = [W, H];
      sceneProg.uniforms.uScale.value = s;
      sceneProg.uniforms.uRadius.value = 0.5 + 0.3 / s;
      draw(opacityAt(performance.now()));
      wake();
    };

    const toLocal = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect();
      if (!r.width || !r.height) return;
      target = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      };
    };
    const onMove = (e: PointerEvent) => {
      toLocal(e);
      inside = true;
      lastMove = performance.now();
      wake();
    };
    const onLeave = () => {
      inside = false;
      lastMove = performance.now();
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') onLeave();
    };
    parent.addEventListener('pointermove', onMove, { passive: true });
    parent.addEventListener('pointerenter', onMove, { passive: true });
    parent.addEventListener('pointerdown', onMove, { passive: true });
    parent.addEventListener('pointerleave', onLeave);
    parent.addEventListener('pointerup', onUp);
    parent.addEventListener('pointercancel', onLeave);

    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    ro.observe(layer);
    // Pausa quando fora da viewport.
    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) wake();
    });
    io.observe(layer);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      running = false;
      ro.disconnect();
      io.disconnect();
      parent.removeEventListener('pointermove', onMove);
      parent.removeEventListener('pointerenter', onMove);
      parent.removeEventListener('pointerdown', onMove);
      parent.removeEventListener('pointerleave', onLeave);
      parent.removeEventListener('pointerup', onUp);
      parent.removeEventListener('pointercancel', onLeave);
      freeAll();
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (changedPosition) parent.style.position = prevPosition;
    };
  }, [
    trailLength, inertia, bloomStrength, bloomRadius, bloomThreshold, maxDevicePixelRatio,
    targetPixels, fadeDelayMs, fadeDurationMs,
  ]);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex,
        // A mesclagem fica na camada: com z-index ela é um contexto de empilhamento isolado,
        // então o modo no canvas interno não alcançaria o conteúdo de baixo.
        mixBlendMode,
        ...style,
      }}
    />
  );
}

export default GhostTrail;
