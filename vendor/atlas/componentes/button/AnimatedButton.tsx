// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { animate, useReducedMotion } from "motion/react";

export type ButtonVariant =
  | "default"
  | "accent"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";

export interface SpringConfig {
  stiffness: number;
  damping: number;
}

// Folha de estilos compartilhada pelos botões Atlas (também usada por copy e flip).
// Fica numa camada "components" para que utilitários Tailwind de quem usa possam sobrescrever.
const LIGHT =
  "--atb-bg:#ffffff;--atb-fg:#0a0a0a;--atb-p:#0a0a0a;--atb-pf:#fafafa;--atb-a:#f5f5f5;--atb-af:#171717;--atb-d:#e7000b;--atb-border:#e5e5e5;--atb-input:#e5e5e5;--atb-ring:#a1a1a1;" +
  "--atb-d-ring:color-mix(in oklab,var(--atb-d) 20%,transparent);--atb-d-bg:var(--atb-d);--atb-outline-bg:var(--atb-bg);--atb-outline-border:var(--atb-border);--atb-outline-hover:var(--atb-a);--atb-ghost-hover:var(--atb-a);";
const DARK =
  "--atb-bg:#0a0a0a;--atb-fg:#fafafa;--atb-p:#fafafa;--atb-pf:#0a0a0a;--atb-a:#262626;--atb-af:#fafafa;--atb-d:#ff6467;--atb-border:rgba(255,255,255,0.10);--atb-input:rgba(255,255,255,0.15);--atb-ring:#737373;" +
  "--atb-d-ring:color-mix(in oklab,var(--atb-d) 40%,transparent);--atb-d-bg:color-mix(in oklab,var(--atb-d) 60%,transparent);--atb-outline-bg:rgba(255,255,255,0.045);--atb-outline-border:var(--atb-input);--atb-outline-hover:rgba(255,255,255,0.075);--atb-ghost-hover:color-mix(in oklab,var(--atb-a) 50%,transparent);";

export const buttonStyleSheet = `@layer components{
:where(.atb,.atb-scope){${LIGHT}}
@media (prefers-color-scheme:dark){:where(.atb,.atb-scope){${DARK}}}
.light :is(.atb,.atb-scope){${LIGHT}}
.dark :is(.atb,.atb-scope){${DARK}}
:where(.atb){box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;flex-shrink:0;border-radius:8px;font-family:inherit;font-size:14px;line-height:20px;font-weight:500;outline:none;border:0 solid transparent;margin:0;cursor:pointer;user-select:none;text-decoration:none;background:transparent;color:inherit;
box-shadow:var(--atb-focus,0 0 #0000),var(--atb-shadow,0 0 #0000);
transition-property:color,background-color,border-color,outline-color,box-shadow,fill,stroke,text-decoration-color;transition-duration:150ms;transition-timing-function:cubic-bezier(.4,0,.2,1)}
:where(.atb) svg{pointer-events:none;flex-shrink:0}
:where(.atb) svg:not([class*="size-"]){width:16px;height:16px}
:where(.atb):focus-visible{border-color:var(--atb-ring);--atb-focus:0 0 0 3px color-mix(in oklab,var(--atb-ring) 50%,transparent)}
:where(.atb)[aria-invalid="true"]{border-color:var(--atb-d);--atb-focus:0 0 0 3px var(--atb-d-ring)}
:where(.atb):disabled,:where(.atb)[aria-disabled="true"]{opacity:.5;pointer-events:none}
:where(.atb[data-variant="default"]){background:var(--atb-p);color:var(--atb-pf);--atb-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)}
:where(.atb[data-variant="default"]):hover{background:color-mix(in oklab,var(--atb-p) 90%,transparent)}
:where(.atb[data-variant="accent"]){background:var(--atb-a);color:var(--atb-af);--atb-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)}
:where(.atb[data-variant="accent"]):hover{background:color-mix(in oklab,var(--atb-a) 90%,transparent)}
:where(.atb[data-variant="destructive"]){background:var(--atb-d-bg);color:#fff;--atb-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)}
:where(.atb[data-variant="destructive"]):hover{background:color-mix(in oklab,var(--atb-d) 90%,transparent)}
:where(.atb[data-variant="destructive"]):focus-visible{border-color:var(--atb-d);--atb-focus:0 0 0 3px var(--atb-d-ring)}
:where(.atb[data-variant="outline"]){background:var(--atb-outline-bg);color:var(--atb-fg);border-width:1px;border-color:var(--atb-outline-border);--atb-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)}
:where(.atb[data-variant="outline"]):hover{background:var(--atb-outline-hover);color:var(--atb-af)}
:where(.atb[data-variant="secondary"]){background:var(--atb-a);color:var(--atb-af);--atb-shadow:0 1px 2px 0 rgb(0 0 0 / 0.05)}
:where(.atb[data-variant="secondary"]):hover{background:color-mix(in oklab,var(--atb-a) 80%,transparent)}
:where(.atb[data-variant="ghost"]){background:transparent;color:inherit}
:where(.atb[data-variant="ghost"]):hover{background:var(--atb-ghost-hover);color:var(--atb-af)}
:where(.atb[data-variant="link"]){background:transparent;color:var(--atb-p);text-underline-offset:4px}
:where(.atb[data-variant="link"]):hover{text-decoration-line:underline}
:where(.atb[data-size="default"]){height:36px;padding:8px 16px}
:where(.atb[data-size="default"]):has(>svg){padding-left:12px;padding-right:12px}
:where(.atb[data-size="sm"]){height:32px;gap:6px;padding:0 12px}
:where(.atb[data-size="sm"]):has(>svg){padding-left:10px;padding-right:10px}
:where(.atb[data-size="lg"]){height:40px;padding:0 24px}
:where(.atb[data-size="lg"]):has(>svg){padding-left:16px;padding-right:16px}
:where(.atb[data-size="icon"]){width:36px;height:36px;padding:0}
:where(.atb[data-size="icon-xs"]){width:28px;height:28px;padding:0}
:where(.atb[data-size="icon-xs"]) svg:not([class*="size-"]){width:14px;height:14px}
:where(.atb[data-size="icon-sm"]){width:32px;height:32px;padding:0}
:where(.atb[data-size="icon-lg"]){width:40px;height:40px;padding:0}
}`;

/** Injeta (uma única vez, via hoisting do React 19) a folha de estilos dos botões. */
export function ButtonStyleSheet() {
  return (
    <style href="atlas-button-styles" precedence="atlas-components">
      {buttonStyleSheet}
    </style>
  );
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object") (ref as { current: T | null }).current = value;
}

export function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (value: T | null) => refs.forEach((r) => setRef(r, value));
}

type AnyProps = Record<string, unknown>;

/** Padrão "como filho": mescla classes, estilos, manipuladores e ref no único filho. */
export function Slot({ children, ...slotProps }: AnyProps & { children?: ReactNode }) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  const childProps = (child as ReactElement<AnyProps>).props;
  const merged: AnyProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const s = slotProps[key];
    const c = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof s === "function" && typeof c === "function") {
      merged[key] = (...args: unknown[]) => {
        (c as (...a: unknown[]) => void)(...args);
        (s as (...a: unknown[]) => void)(...args);
      };
    } else if (key === "className") {
      merged.className = cx(s as string, c as string);
    } else if (key === "style") {
      merged.style = { ...(s as CSSProperties), ...(c as CSSProperties) };
    }
  }
  merged.ref = composeRefs(slotProps.ref as Ref<unknown>, childProps.ref as Ref<unknown>);
  return cloneElement(child as ReactElement<AnyProps>, merged);
}

interface PressScaleOptions {
  hoverScale: number;
  tapScale: number;
  spring?: SpringConfig;
  disabled?: boolean;
}

/**
 * Escala por mola no hover e ao pressionar (parte sempre do valor atual).
 * Devolve uma ref e manipuladores de ponteiro para espalhar no elemento.
 */
export function usePressScale<T extends HTMLElement>({
  hoverScale,
  tapScale,
  spring = { stiffness: 550, damping: 30 },
  disabled,
}: PressScaleOptions) {
  const ref = useRef<T | null>(null);
  const state = useRef({ hover: false, press: false });
  const reduce = useReducedMotion();
  const springRef = useRef(spring);
  springRef.current = spring;

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const s = state.current;
    const target = reduce || disabled ? 1 : s.press ? tapScale : s.hover ? hoverScale : 1;
    animate(el, { scale: target }, { type: "spring", ...springRef.current, mass: 1 });
  }, [reduce, disabled, tapScale, hoverScale]);

  // Solta a pressão mesmo se o ponteiro for liberado fora do elemento.
  useEffect(() => {
    const release = () => {
      if (!state.current.press) return;
      state.current.press = false;
      update();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [update]);

  useEffect(() => {
    if (reduce || disabled) update();
  }, [reduce, disabled, update]);

  const handlers = {
    onPointerEnter: (e: ReactPointerEvent) => {
      if (e.pointerType === "touch") return;
      state.current.hover = true;
      update();
    },
    onPointerLeave: () => {
      state.current.hover = false;
      update();
    },
    onPointerDown: (e: ReactPointerEvent) => {
      if (e.button !== 0) return;
      state.current.press = true;
      update();
    },
  };

  return { ref, handlers };
}

function chain<E>(a?: (e: E) => void, b?: (e: E) => void) {
  return (e: E) => {
    a?.(e);
    b?.(e);
  };
}

export interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  hoverScale?: number;
  tapScale?: number;
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function AnimatedButton({
  variant = "default",
  size = "default",
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  type,
  ...rest
}: AnimatedButtonProps) {
  const press = usePressScale<HTMLButtonElement>({
    hoverScale,
    tapScale,
    disabled: rest.disabled,
  });

  const shared = {
    ...rest,
    ref: composeRefs(ref, press.ref as Ref<HTMLButtonElement>),
    className: cx("atb", className),
    "data-variant": variant,
    "data-size": size,
    onPointerEnter: chain(onPointerEnter, press.handlers.onPointerEnter),
    onPointerLeave: chain(onPointerLeave, press.handlers.onPointerLeave),
    onPointerDown: chain(onPointerDown, press.handlers.onPointerDown),
  };

  return (
    <>
      <ButtonStyleSheet />
      {asChild ? <Slot {...shared} /> : <button type={type ?? "button"} {...shared} />}
    </>
  );
}

export default AnimatedButton;
