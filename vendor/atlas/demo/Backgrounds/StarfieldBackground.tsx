// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from "react";
import StarfieldBackground from "../../componentes/stars/StarfieldBackground";

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

export default function StarfieldBackgroundDemo() {
  const root = useRef<HTMLDivElement>(null);
  const dark = useStageDark(root);

  return (
    <div ref={root} className="relative w-full h-full min-h-[360px]">
      <StarfieldBackground
        starColor={dark ? "#FFF" : "#000"}
        className="flex items-center justify-center"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 14,
          background: dark
            ? "radial-gradient(ellipse at bottom, #262626 0%, #000000 100%)"
            : "radial-gradient(ellipse at bottom, #f5f5f5 0%, #ffffff 100%)",
        }}
      />
    </div>
  );
}
