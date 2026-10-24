// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type AntigravityShape = "capsule" | "sphere" | "box" | "tetrahedron";

export interface AntigravityProps {
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  particleSize?: number;
  lerpSpeed?: number;
  color?: string;
  autoAnimate?: boolean;
  particleVariance?: number;
  rotationSpeed?: number;
  depthFactor?: number;
  pulseSpeed?: number;
  particleShape?: AntigravityShape;
  fieldStrength?: number;
  className?: string;
}

const CAM_Z = 50;
const FOV = 35;

function makeGeometry(shape: AntigravityShape): THREE.BufferGeometry {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(0.2, 16, 16);
    case "box":
      return new THREE.BoxGeometry(0.3, 0.3, 0.3);
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(0.3);
    default:
      return new THREE.CapsuleGeometry(0.1, 0.4, 4, 8);
  }
}

/** Fator por quadro (calibrado a 60 Hz) convertido para o Δt real. */
const perFrame = (f: number, dt: number) => 1 - Math.pow(1 - f, dt * 60);

export function Antigravity({
  count = 300,
  magnetRadius = 10,
  ringRadius = 10,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 2,
  lerpSpeed = 0.1,
  color = "#FF9FFC",
  autoAnimate = false,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = "capsule",
  fieldStrength = 10,
  className = "",
}: AntigravityProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reduce = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const auto = autoAnimate && !reduce;
    const waveAmp = reduce ? 0 : waveAmplitude;
    const variance = reduce ? 0 : particleVariance;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return; // sem WebGL: efeito decorativo simplesmente não aparece
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");
    canvas.tabIndex = -1;
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 1000);
    camera.position.set(0, 0, CAM_Z);
    camera.lookAt(0, 0, 0);

    const geometry = makeGeometry(particleShape);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // Estado por partícula em arrays planos.
    const rest = new Float32Array(count * 3);
    const cur = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const offs = new Float32Array(count);

    let vw = 1;
    let vh = 1;
    const visibleH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));

    const scatter = () => {
      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * vw;
        const y = (Math.random() - 0.5) * vh;
        const z = (Math.random() - 0.5) * 20;
        rest[i * 3] = cur[i * 3] = x;
        rest[i * 3 + 1] = cur[i * 3 + 1] = y;
        rest[i * 3 + 2] = cur[i * 3 + 2] = z;
        phase[i] = Math.random() * 100;
        speed[i] = 0.005 + Math.random() * 0.0025;
        offs[i] = Math.random() * 2 - 1;
      }
    };

    let lastW = 0;
    let lastH = 0;
    const resize = () => {
      const w = host.clientWidth || 600;
      const h = host.clientHeight || 400;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      vh = visibleH;
      vw = visibleH * camera.aspect;
      scatter(); // redistribui ao mudar de tamanho
    };
    resize();

    // Ponteiro em coordenadas normalizadas (−1..1); ímã no centro até o primeiro movimento.
    const pointer = { x: 0, y: 0 };
    let lastMove = performance.now();
    const onPointer = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      lastMove = performance.now();
    };
    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerdown", onPointer);

    const magnet = { x: 0, y: 0 };
    const dummy = new THREE.Object3D();
    let elapsed = 0;
    let prev = performance.now();
    let raf = 0;
    let visible = true;
    let running = false;

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000));
      prev = now;
      elapsed += dt;

      let tx = pointer.x * (vw / 2);
      let ty = pointer.y * (vh / 2);
      if (auto && now - lastMove > 2000) {
        tx = Math.sin(elapsed * 0.5) * (vw / 4);
        ty = Math.cos(elapsed * 1.0) * (vh / 4);
      }
      const k5 = perFrame(0.05, dt);
      magnet.x += (tx - magnet.x) * k5;
      magnet.y += (ty - magnet.y) * k5;

      const rot = elapsed * rotationSpeed;
      const kLerp = perFrame(lerpSpeed, dt);
      const frames = dt * 60;
      const devK = 5 / (fieldStrength + 0.1);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        phase[i] += speed[i] * frames;
        const t = phase[i];
        const rx = rest[i3];
        const ry = rest[i3 + 1];
        const rz = rest[i3 + 2];
        const cz = cur[i3 + 2];

        // Paralaxe: ímã projetado na profundidade atual da partícula.
        const pf = 1 - cz / CAM_Z;
        const px = magnet.x * pf;
        const py = magnet.y * pf;

        let gx = rx;
        let gy = ry;
        let gz = rz * depthFactor;
        const dx = rx - px;
        const dy = ry - py;
        if (Math.hypot(dx, dy) < magnetRadius) {
          const ang = Math.atan2(dy, dx) + rot;
          const wave = Math.sin(t * waveSpeed + ang) * 0.5 * waveAmp;
          const r = ringRadius + wave + offs[i] * devK;
          gx = px + r * Math.cos(ang);
          gy = py + r * Math.sin(ang);
          gz = rz * depthFactor + Math.sin(t) * waveAmp * depthFactor;
        }

        const x = (cur[i3] += (gx - cur[i3]) * kLerp);
        const y = (cur[i3 + 1] += (gy - cur[i3 + 1]) * kLerp);
        const z = (cur[i3 + 2] += (gz - cz) * kLerp);

        const ddx = x - px;
        const ddy = y - py;
        const d = Math.hypot(ddx, ddy);
        const vis = Math.min(1, Math.max(0, 1 - Math.abs(d - ringRadius) / 10));
        const sc = vis * (0.8 + Math.sin(t * pulseSpeed) * 0.2 * variance) * particleSize;

        dummy.position.set(x, y, z);
        // Eixo longo (Y local) alinhado com a direção radial até o ímã.
        dummy.rotation.set(0, 0, Math.atan2(py - y, px - x) + Math.PI / 2);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const sync = () => (visible && !document.hidden ? start() : stop());

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) frame(performance.now());
    });
    ro.observe(host);
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting);
      sync();
    });
    io.observe(host);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerdown", onPointer);
      scene.remove(mesh);
      mesh.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, [
    count,
    magnetRadius,
    ringRadius,
    waveSpeed,
    waveAmplitude,
    particleSize,
    lerpSpeed,
    color,
    autoAnimate,
    particleVariance,
    rotationSpeed,
    depthFactor,
    pulseSpeed,
    particleShape,
    fieldStrength,
  ]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", touchAction: "pan-y" }}
    />
  );
}

export default Antigravity;
