// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Plus } from "lucide-react";
import FlipButton, { FlipButtonBack, FlipButtonFront } from "../../componentes/flip/FlipButton";
import type { ButtonSize, ButtonVariant } from "../../componentes/button/AnimatedButton";

// Tema do palco: classe dark/light do ancestral mais próximo, senão prefers-color-scheme.
function useStageDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => {
      const a = el.closest(".dark, .light");
      setDark(a ? a.classList.contains("dark") : mq.matches);
    };
    read();
    const anchor = el.closest(".dark, .light");
    const mo = new MutationObserver(read);
    if (anchor) mo.observe(anchor, { attributes: true, attributeFilter: ["class"] });
    mq.addEventListener("change", read);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", read);
    };
  }, [ref]);
  return dark;
}

const VARIANTS: ButtonVariant[] = ["default", "accent", "destructive", "outline", "secondary", "ghost", "link"];
const FRONT_SIZES: ButtonSize[] = ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"];
const BACK_SIZES: ButtonSize[] = ["default", "sm", "lg", "icon"];

export default function FlipButtonDemo() {
  const root = useRef<HTMLDivElement>(null);
  const dark = useStageDark(root);
  const [frontVariant, setFrontVariant] = useState<ButtonVariant>("accent");
  const [frontSize, setFrontSize] = useState<ButtonSize>("default");
  const [backVariant, setBackVariant] = useState<ButtonVariant>("default");
  const [backSize, setBackSize] = useState<ButtonSize>("default");

  const selectStyle: CSSProperties = {
    fontSize: 12,
    padding: "4px 6px",
    borderRadius: 6,
    border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}`,
    background: dark ? "#171717" : "#ffffff",
    color: dark ? "#fafafa" : "#0a0a0a",
  };
  const label: CSSProperties = { fontSize: 11, opacity: 0.7, width: 34 };

  const sel = <T extends string>(name: string, value: T, set: (v: T) => void, opts: T[]) => (
    <select aria-label={name} value={value} onChange={(e) => set(e.target.value as T)} style={selectStyle}>
      {opts.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  const content = (size: ButtonSize, text: string) => (size.startsWith("icon") ? <Plus /> : text);

  return (
    <div
      ref={root}
      className="relative w-full h-full min-h-[360px] flex items-center justify-center"
      style={{ color: dark ? "#fafafa" : "#0a0a0a" }}
    >
      <div style={{ position: "absolute", top: 12, left: 12, display: "grid", gap: 6 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={label}>Front</span>
          {sel("Variante da frente", frontVariant, setFrontVariant, VARIANTS)}
          {sel("Tamanho da frente", frontSize, setFrontSize, FRONT_SIZES)}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={label}>Back</span>
          {sel("Variante do verso", backVariant, setBackVariant, VARIANTS)}
          {sel("Tamanho do verso", backSize, setBackSize, BACK_SIZES)}
        </div>
      </div>
      <FlipButton>
        <FlipButtonFront variant={frontVariant} size={frontSize}>
          {content(frontSize, "Front Button")}
        </FlipButtonFront>
        <FlipButtonBack variant={backVariant} size={backSize}>
          {content(backSize, "Back Button")}
        </FlipButtonBack>
      </FlipButton>
    </div>
  );
}
