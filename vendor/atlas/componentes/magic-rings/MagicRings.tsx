// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type CSSProperties } from 'react';

export interface MagicRingsProps {
  colorStart?: string;
  colorEnd?: string;
  speed?: number;
  ringCount?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  expansion?: number;
  opacity?: number;
  blur?: number;
  noise?: number;
  rotation?: number;
  clipBase?: number;
  fadeIn?: number;
  fadeOutStart?: number;
  followPointer?: boolean;
  pointerInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
  alphaMode?: 'luminance' | 'coverage';
  className?: string;
  style?: CSSProperties;
}

const PERIODO = 3.45;

const VERT = `#version 300 es
void main() {
  // triângulo de tela cheia sem buffers
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uC1;
uniform vec3 uC2;
uniform int uCount;
uniform float uAtten;
uniform float uThick;
uniform float uR0;
uniform float uStep;
uniform float uExpand;
uniform float uOpacity;
uniform float uNoise;
uniform float uRot;
uniform float uClipBase;
uniform float uFadeIn;
uniform float uFadeOut;
uniform vec2 uShift;    // deslocamento global (seguir ponteiro)
uniform vec2 uMouse;    // ponteiro suavizado, -0.5..0.5
uniform float uParallax;
uniform float uScale;
uniform float uBright;
uniform int uMode;      // 0 = luminância, 1 = cobertura

const float PERIODO = ${PERIODO.toFixed(2)};
const float HALF_PI = 1.5707963;

float hash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

void main() {
  float lado = min(uRes.x, uRes.y);
  float px = 1.0 / lado;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / lado;
  p -= uShift;
  p /= uScale;
  float c = cos(uRot), s = sin(uRot);
  p = mat2(c, -s, s, c) * p;

  vec3 acc = vec3(0.0);
  float maxI = 0.0;
  float denom = max(float(uCount - 1), 1.0);

  for (int i = 0; i < 10; i++) {
    if (i >= uCount) break;
    float fi = float(i);
    vec2 q = p - fi * uParallax * uMouse;

    float t = mod(uTime - 2.95 * fi, PERIODO);
    float r = uR0 + fi * uStep + (t / PERIODO) * uExpand;
    float env = t < uFadeIn
      ? smoothstep(0.0, uFadeIn, t)
      : 1.0 - smoothstep(uFadeOut, 3.25, t);

    // ângulo normalizado: 0 no eixo horizontal, 1 no vertical (simétrico nos quadrantes)
    float a = atan(abs(q.y), abs(q.x)) / HALF_PI;
    float corte = pow(uClipBase, fi) * a;
    float d = abs(length(q) - r) + 0.02 * corte * corte * corte;

    float esp = uThick * px * mix(1.0, 0.5, a);
    float nucleo = 1.0 - smoothstep(esp * 0.5, esp * 0.5 + px, d);
    float halo = exp(-d * uAtten * 4.0);
    float inten = halo * (1.0 + nucleo) * env * uBright;

    vec3 col = mix(uC1, uC2, fi / denom);
    acc = mix(acc, col, inten);
    maxI = max(maxI, inten);
  }

  acc += (hash(vec3(gl_FragCoord.xy, uTime * 60.0)) - 0.5) * uNoise;

  vec3 cor;
  float alfa;
  if (uMode == 0) {
    float m = max(max(acc.r, acc.g), acc.b);
    cor = m > 0.0 ? clamp(acc / m, 0.0, 1.0) : vec3(0.0);
    alfa = clamp(m, 0.0, 1.0);
  } else {
    cor = clamp(acc, 0.0, 1.0);
    alfa = clamp(maxI, 0.0, 1.0);
  }
  alfa *= uOpacity;
  fragColor = vec4(cor * alfa, alfa); // alfa pré-multiplicado
}`;

function hexParaRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function MagicRings(props: MagicRingsProps) {
  const {
    colorStart = '#fc42ff',
    colorEnd = '#42fcff',
    speed = 1,
    ringCount = 6,
    attenuation = 10,
    lineThickness = 2,
    baseRadius = 0.35,
    radiusStep = 0.1,
    expansion = 0.1,
    opacity = 1,
    blur = 0,
    noise = 0.1,
    rotation = 0,
    clipBase = 1.5,
    fadeIn = 0.7,
    fadeOutStart = 0.5,
    followPointer = false,
    pointerInfluence = 0.2,
    hoverScale = 1.2,
    parallax = 0.05,
    clickBurst = false,
    alphaMode = 'luminance',
    className,
    style,
  } = props;

  const contRef = useRef<HTMLDivElement>(null);
  // Parâmetros lidos a cada quadro: mudanças valem sem recriar o contexto.
  const params = useRef({
    colorStart, colorEnd, speed, ringCount, attenuation, lineThickness, baseRadius, radiusStep,
    expansion, opacity, noise, rotation, clipBase, fadeIn, fadeOutStart, followPointer,
    pointerInfluence, hoverScale, parallax, clickBurst, alphaMode,
  });
  params.current = {
    colorStart, colorEnd, speed, ringCount, attenuation, lineThickness, baseRadius, radiusStep,
    expansion, opacity, noise, rotation, clipBase, fadeIn, fadeOutStart, followPointer,
    pointerInfluence, hoverScale, parallax, clickBurst, alphaMode,
  };

  useEffect(() => {
    const cont = contRef.current;
    if (!cont) return;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
    const gl = canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return; // sem WebGL 2: falha silenciosa
    cont.appendChild(canvas);

    const compilar = (tipo: number, src: string) => {
      const sh = gl.createShader(tipo)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('[MagicRings]', gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    const vs = compilar(gl.VERTEX_SHADER, VERT);
    const fs = compilar(gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    const vao = gl.createVertexArray();
    const liberar = () => {
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      liberar();
      return;
    }
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);

    const nomes = [
      'uRes', 'uTime', 'uC1', 'uC2', 'uCount', 'uAtten', 'uThick', 'uR0', 'uStep', 'uExpand',
      'uOpacity', 'uNoise', 'uRot', 'uClipBase', 'uFadeIn', 'uFadeOut', 'uShift', 'uMouse',
      'uParallax', 'uScale', 'uBright', 'uMode',
    ] as const;
    const U = Object.fromEntries(nomes.map((n) => [n, gl.getUniformLocation(prog, n)])) as Record<
      (typeof nomes)[number],
      WebGLUniformLocation | null
    >;

    const mqReduz = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let dpr = 1;
    let largura = 1;
    let altura = 1;
    const redimensionar = () => {
      const r = cont.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = Math.max(1, Math.round((r.width || 300) * dpr));
      altura = Math.max(1, Math.round((r.height || 300) * dpr));
      if (canvas.width !== largura || canvas.height !== altura) {
        canvas.width = largura;
        canvas.height = altura;
      }
    };
    redimensionar();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(redimensionar) : null;
    ro?.observe(cont);
    window.addEventListener('resize', redimensionar);

    // Ponteiro
    const alvo = { x: 0, y: 0, dentro: false };
    const mouse = { x: 0, y: 0 };
    let hover = 0;
    let impulso = 0;
    const aoMover = (e: PointerEvent) => {
      const r = cont.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      alvo.x = (e.clientX - r.left) / r.width - 0.5;
      alvo.y = 0.5 - (e.clientY - r.top) / r.height;
      alvo.dentro = true;
    };
    const aoSair = () => {
      alvo.x = 0;
      alvo.y = 0;
      alvo.dentro = false;
    };
    const aoClicar = () => {
      if (params.current.clickBurst && !mqReduz?.matches) impulso = 1;
    };
    cont.addEventListener('pointermove', aoMover);
    cont.addEventListener('pointerenter', aoMover);
    cont.addEventListener('pointerleave', aoSair);
    cont.addEventListener('click', aoClicar);

    // Economia: só anima visível na viewport e com a aba visível.
    let naTela = true;
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((ents) => {
            naTela = ents.some((en) => en.isIntersecting);
            atualizarLaco();
          })
        : null;
    io?.observe(cont);
    const aoVisibilidade = () => atualizarLaco();
    document.addEventListener('visibilitychange', aoVisibilidade);

    let raf = 0;
    let ultimo: number | null = null;
    let tempo = 0;

    const quadro = (ts: number) => {
      raf = requestAnimationFrame(quadro);
      const P = params.current;
      const reduz = !!mqReduz?.matches;
      const dt = ultimo === null ? 0 : Math.min(0.1, Math.max(0, (ts - ultimo) / 1000));
      ultimo = ts;
      // Movimento reduzido: tempo congelado num instante com anéis visíveis.
      tempo = reduz ? 1.4 : tempo + dt * P.speed;

      mouse.x += (alvo.x - mouse.x) * 0.08;
      mouse.y += (alvo.y - mouse.y) * 0.08;
      hover += ((alvo.dentro ? 1 : 0) - hover) * 0.08;
      if (reduz) impulso = 0;
      impulso *= 0.95;
      if (impulso < 0.001) impulso = 0;

      const escala = 1 + (P.hoverScale - 1) * hover + 0.3 * impulso;
      const brilho = 1 + 2 * impulso;
      const n = Math.max(1, Math.min(10, Math.round(P.ringCount)));

      gl.viewport(0, 0, largura, altura);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.uRes, largura, altura);
      gl.uniform1f(U.uTime, tempo);
      gl.uniform3fv(U.uC1, hexParaRgb(P.colorStart));
      gl.uniform3fv(U.uC2, hexParaRgb(P.colorEnd));
      gl.uniform1i(U.uCount, n);
      gl.uniform1f(U.uAtten, P.attenuation);
      gl.uniform1f(U.uThick, P.lineThickness * dpr);
      gl.uniform1f(U.uR0, P.baseRadius);
      gl.uniform1f(U.uStep, P.radiusStep);
      gl.uniform1f(U.uExpand, P.expansion);
      gl.uniform1f(U.uOpacity, Math.max(0, Math.min(1, P.opacity)));
      gl.uniform1f(U.uNoise, P.noise);
      gl.uniform1f(U.uRot, (P.rotation * Math.PI) / 180);
      gl.uniform1f(U.uClipBase, P.clipBase);
      gl.uniform1f(U.uFadeIn, Math.max(1e-4, P.fadeIn));
      gl.uniform1f(U.uFadeOut, P.fadeOutStart);
      const f = P.followPointer ? P.pointerInfluence : 0;
      gl.uniform2f(U.uShift, mouse.x * f, mouse.y * f);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.uniform1f(U.uParallax, P.parallax);
      gl.uniform1f(U.uScale, Math.max(1e-3, escala));
      gl.uniform1f(U.uBright, brilho);
      gl.uniform1i(U.uMode, P.alphaMode === 'coverage' ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    function atualizarLaco() {
      const ativo = naTela && document.visibilityState !== 'hidden';
      if (ativo && !raf) {
        ultimo = null; // Δt do primeiro quadro zerado ao retomar
        raf = requestAnimationFrame(quadro);
      } else if (!ativo && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }
    atualizarLaco();

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', redimensionar);
      document.removeEventListener('visibilitychange', aoVisibilidade);
      cont.removeEventListener('pointermove', aoMover);
      cont.removeEventListener('pointerenter', aoMover);
      cont.removeEventListener('pointerleave', aoSair);
      cont.removeEventListener('click', aoClicar);
      liberar();
    };
  }, []);

  return (
    <div
      ref={contRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    />
  );
}

export default MagicRings;
