// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ElementType,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { motion, useReducedMotion, type Transition, type Variants } from "motion/react";
import {
  ButtonStyleSheet,
  Slot,
  composeRefs,
  cx,
  usePressScale,
  type ButtonSize,
  type ButtonVariant,
  type SpringConfig,
} from "../button/AnimatedButton";

export type FlipDirection = "top" | "bottom" | "left" | "right";

interface FlipContextValue {
  from: FlipDirection;
  variant: ButtonVariant;
  size: ButtonSize;
  active: boolean;
  reduce: boolean;
}

const FlipContext = createContext<FlipContextValue | null>(null);

function useFlip() {
  const ctx = useContext(FlipContext);
  if (!ctx) throw new Error("FlipButtonFront/FlipButtonBack devem ficar dentro de <FlipButton>.");
  return ctx;
}

const flipStyleSheet = `@layer components{
:where(.atf){box-sizing:border-box;display:inline-grid;place-items:center;perspective:1000px;background:none;border:0;padding:0;margin:0;border-radius:8px;outline:none;cursor:pointer;font:inherit;color:inherit;transition:box-shadow 150ms cubic-bezier(.4,0,.2,1)}
:where(.atf):focus-visible{box-shadow:0 0 0 3px color-mix(in oklab,var(--atb-ring) 50%,transparent)}
:where(.atf):disabled,:where(.atf)[aria-disabled="true"]{opacity:.5;pointer-events:none}
:where(.atf)>*{grid-area:1/1}
}`;

function chain<E>(a?: (e: E) => void, b?: (e: E) => void) {
  return (e: E) => {
    a?.(e);
    b?.(e);
  };
}

export interface FlipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** De onde o verso vem. */
  from?: FlipDirection;
  /** Escala ao pressionar. */
  tapScale?: number;
  /** Variante padrão das faces. */
  variant?: ButtonVariant;
  /** Tamanho padrão das faces. */
  size?: ButtonSize;
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function FlipButton({
  from = "top",
  tapScale = 0.95,
  variant = "default",
  size = "default",
  asChild = false,
  className,
  ref,
  type,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  ...rest
}: FlipButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduce = !!useReducedMotion();
  const press = usePressScale<HTMLButtonElement>({ hoverScale: 1, tapScale, disabled: rest.disabled });

  const ctx = useMemo<FlipContextValue>(
    () => ({ from, variant, size, active: hovered || focused, reduce }),
    [from, variant, size, hovered, focused, reduce],
  );

  const shared = {
    ...rest,
    ref: composeRefs(ref, press.ref as Ref<HTMLButtonElement>),
    className: cx("atb-scope atf", className),
    "data-state": ctx.active ? "flipped" : "rest",
    onPointerEnter: chain(onPointerEnter, (e: ReactPointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== "touch") setHovered(true);
      press.handlers.onPointerEnter(e);
    }),
    onPointerLeave: chain(onPointerLeave, () => {
      setHovered(false);
      press.handlers.onPointerLeave();
    }),
    onPointerDown: chain(onPointerDown, press.handlers.onPointerDown),
    // O giro também acontece no foco por teclado.
    onFocus: chain(onFocus, (e: FocusEvent<HTMLButtonElement>) => {
      let visible = true;
      try {
        visible = e.currentTarget.matches(":focus-visible");
      } catch {
        /* navegador sem :focus-visible */
      }
      setFocused(visible);
    }),
    onBlur: chain(onBlur, () => setFocused(false)),
  };

  return (
    <FlipContext.Provider value={ctx}>
      <ButtonStyleSheet />
      <style href="atlas-flip-styles" precedence="atlas-components">
        {flipStyleSheet}
      </style>
      {asChild ? <Slot {...shared} /> : <button type={type ?? "button"} {...shared} />}
    </FlipContext.Provider>
  );
}

export interface FlipFaceProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mola da face. */
  transition?: SpringConfig;
  asChild?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

function buildVariants(face: "front" | "back", from: FlipDirection, reduce: boolean): Variants {
  if (reduce) {
    return face === "front"
      ? { rest: { opacity: 1 }, hover: { opacity: 0 } }
      : { rest: { opacity: 0 }, hover: { opacity: 1 } };
  }
  const vertical = from === "top" || from === "bottom";
  const rot = vertical ? "rotateX" : "rotateY";
  const off = vertical ? "y" : "x";
  const s = from === "top" || from === "left" ? 1 : -1;
  const still = { opacity: 1, [rot]: 0, [off]: "0%" };
  return face === "front"
    ? { rest: still, hover: { opacity: 0, [rot]: 90 * s, [off]: `${50 * s}%` } }
    : { rest: { opacity: 0, [rot]: 90 * s, [off]: `${-50 * s}%` }, hover: still };
}

function FlipFace({
  face,
  variant,
  size,
  transition = { stiffness: 280, damping: 20 },
  asChild = false,
  className,
  style,
  children,
  ...rest
}: FlipFaceProps & { face: "front" | "back" }) {
  const ctx = useFlip();
  const child = asChild && isValidElement(children) ? (children as ReactElement<Record<string, unknown>>) : null;
  const Comp = useMemo(
    () => (child ? (motion.create(child.type as ElementType) as ElementType) : motion.span),
    [child?.type],
  );
  const variants = useMemo(() => buildVariants(face, ctx.from, ctx.reduce), [face, ctx.from, ctx.reduce]);
  const t: Transition = ctx.reduce
    ? { duration: 0.2, ease: "easeInOut" }
    : { type: "spring", stiffness: transition.stiffness, damping: transition.damping, mass: 1 };
  const visible = face === "front" ? !ctx.active : ctx.active;

  const childProps = child?.props ?? {};
  return (
    <Comp
      {...childProps}
      {...rest}
      aria-hidden={visible ? undefined : true}
      className={cx("atb", childProps.className as string | undefined, className)}
      data-variant={variant ?? ctx.variant}
      data-size={size ?? ctx.size}
      data-face={face}
      style={{ ...(childProps.style as object), ...style, gridArea: "1 / 1" }}
      variants={variants}
      initial={false}
      animate={ctx.active ? "hover" : "rest"}
      transition={t}
    >
      {child ? (childProps.children as ReactNode) : children}
    </Comp>
  );
}

export function FlipButtonFront(props: FlipFaceProps) {
  return <FlipFace face="front" {...props} />;
}

export function FlipButtonBack(props: FlipFaceProps) {
  return <FlipFace face="back" {...props} />;
}

export default FlipButton;
