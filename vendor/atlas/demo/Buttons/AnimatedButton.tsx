// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from "react";
import { Plus } from "lucide-react";
import AnimatedButton, { type ButtonSize, type ButtonVariant } from "../../componentes/button/AnimatedButton";

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
const SIZES: ButtonSize[] = ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"];

export default function AnimatedButtonDemo() {
  const root = useRef<HTMLDivElement>(null);
  const dark = useStageDark(root);
  const [variant, setVariant] = useState<ButtonVariant>("default");
  const [size, setSize] = useState<ButtonSize>("default");
  const isIcon = size.startsWith("icon");

  const selectStyle = {
    fontSize: 12,
    padding: "4px 6px",
    borderRadius: 6,
    border: `1px solid ${dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}`,
    background: dark ? "#171717" : "#ffffff",
    color: dark ? "#fafafa" : "#0a0a0a",
  };

  return (
    <div
      ref={root}
      className="relative w-full h-full min-h-[360px] flex items-center justify-center"
      style={{ color: dark ? "#fafafa" : "#0a0a0a" }}
    >
      <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 8 }}>
        <select aria-label="Variante" value={variant} onChange={(e) => setVariant(e.target.value as ButtonVariant)} style={selectStyle}>
          {VARIANTS.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select aria-label="Tamanho" value={size} onChange={(e) => setSize(e.target.value as ButtonSize)} style={selectStyle}>
          {SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <AnimatedButton variant={variant} size={size} aria-label={isIcon ? "Adicionar" : undefined}>
        {isIcon ? <Plus strokeWidth={1.75} /> : "Click me"}
      </AnimatedButton>
    </div>
  );
}
