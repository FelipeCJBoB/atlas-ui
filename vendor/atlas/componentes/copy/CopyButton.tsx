// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type Ref } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy } from "lucide-react";
import {
  ButtonStyleSheet,
  composeRefs,
  cx,
  usePressScale,
  type ButtonVariant,
} from "../button/AnimatedButton";

export type CopyButtonSize = "default" | "xs" | "sm" | "lg";

const SIZE_MAP: Record<CopyButtonSize, string> = {
  default: "icon",
  xs: "icon-xs",
  sm: "icon-sm",
  lg: "icon-lg",
};

export interface CopyButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "content"> {
  /** Texto a copiar. */
  content: string;
  /** Estado "copiado" controlado de fora (ausente = interno). */
  copied?: boolean;
  /** Aviso de mudança do estado: (copiado, texto copiado). */
  onCopiedChange?: (copied: boolean, content?: string) => void;
  /** Tempo até voltar ao ícone de copiar, em ms. */
  delay?: number;
  variant?: ButtonVariant;
  size?: CopyButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

// Caminho alternativo quando a API assíncrona não existe (contexto inseguro, navegador antigo).
function legacyCopy(text: string) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(ta);
  ta.select();
  try {
    if (!document.execCommand("copy")) throw new Error("execCommand('copy') falhou");
  } finally {
    ta.remove();
  }
}

async function writeClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    legacyCopy(text);
  }
}

const SR_ONLY = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

export function CopyButton({
  content,
  copied,
  onCopiedChange,
  delay = 3000,
  variant = "default",
  size = "default",
  className,
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  ref,
  type,
  ...rest
}: CopyButtonProps) {
  const isControlled = copied !== undefined;
  const [internal, setInternal] = useState(false);
  const isCopied = isControlled ? !!copied : internal;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();
  const press = usePressScale<HTMLButtonElement>({ hoverScale: 1.05, tapScale: 0.95, disabled: rest.disabled });

  // Guarda a versão mais recente do callback para o temporizador.
  const notify = useRef(onCopiedChange);
  notify.current = onCopiedChange;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleClick = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (isControlled && copied) return;
      if (!content) return;
      try {
        await writeClipboard(content);
      } catch (err) {
        console.error("CopyButton: falha ao copiar", err);
        return;
      }
      if (!isControlled) setInternal(true);
      notify.current?.(true, content); // um único aviso por cópia
      if (timer.current) clearTimeout(timer.current); // reinicia a cada cópia
      timer.current = setTimeout(() => {
        timer.current = null;
        if (!isControlled) setInternal(false);
        notify.current?.(false);
      }, delay);
    },
    [onClick, isControlled, copied, content, delay],
  );

  const chain =
    <E,>(a?: (e: E) => void, b?: (e: E) => void) =>
    (e: E) => {
      a?.(e);
      b?.(e);
    };

  const motionProps = reduce
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { scale: 0, opacity: 0.4, filter: "blur(4px)" },
        animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
        exit: { scale: 0, opacity: 0.4, filter: "blur(4px)" },
        transition: { duration: 0.25, ease: "easeInOut" as const },
      };

  return (
    <>
      <ButtonStyleSheet />
      <button
        type={type ?? "button"}
        aria-label={rest["aria-label"] ?? (isCopied ? "Copiado" : "Copiar")}
        {...rest}
        ref={composeRefs(ref, press.ref)}
        className={cx("atb", className)}
        data-variant={variant}
        data-size={SIZE_MAP[size]}
        data-copied={isCopied ? "" : undefined}
        style={{ display: "flex", ...style }}
        onClick={handleClick}
        onPointerEnter={chain(onPointerEnter, press.handlers.onPointerEnter)}
        onPointerLeave={chain(onPointerLeave, press.handlers.onPointerLeave)}
        onPointerDown={chain(onPointerDown, press.handlers.onPointerDown)}
      >
        {/* Pilha de célula única: o ícone que sai não ocupa espaço extra durante a troca. */}
        <span aria-hidden="true" style={{ display: "grid", placeItems: "center", pointerEvents: "none" }}>
          <AnimatePresence initial={false}>
            <motion.span
              key={isCopied ? "check" : "copy"}
              style={{ gridArea: "1 / 1", display: "flex" }}
              {...motionProps}
            >
              {isCopied ? <Check /> : <Copy />}
            </motion.span>
          </AnimatePresence>
        </span>
      </button>
      <span role="status" aria-live="polite" style={SR_ONLY}>
        {isCopied ? "Copiado" : ""}
      </span>
    </>
  );
}

export default CopyButton;
