// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState } from "react";
import ShareButton, {
  type ShareButtonSize,
  type ShareIconPosition,
} from "../../componentes/share-button/ShareButton";

function useStageDark(ref: React.RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const host = ref.current?.closest(".dark, .light");
    setDark(host ? host.classList.contains("dark") : !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  }, [ref]);
  return dark;
}

export default function ShareButtonDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useStageDark(ref);
  const [size, setSize] = useState<ShareButtonSize>("default");
  const [pos, setPos] = useState<ShareIconPosition>("none");
  const [last, setLast] = useState<string>("");

  const ctl: React.CSSProperties = {
    fontSize: 12,
    padding: "4px 6px",
    borderRadius: 6,
    border: `1px solid ${dark ? "#404040" : "#d4d4d4"}`,
    background: dark ? "#171717" : "#ffffff",
    color: dark ? "#e5e5e5" : "#171717",
  };

  return (
    <div ref={ref} className="relative flex h-full min-h-[360px] w-full items-center justify-center">
      <div className="absolute right-3 top-3 flex gap-2" style={{ color: dark ? "#a3a3a3" : "#525252", fontSize: 12 }}>
        <select aria-label="Tamanho" value={size} onChange={(e) => setSize(e.target.value as ShareButtonSize)} style={ctl}>
          <option value="default">padrão</option>
          <option value="sm">pequeno</option>
          <option value="md">médio</option>
          <option value="lg">grande</option>
        </select>
        <select aria-label="Ícone" value={pos} onChange={(e) => setPos(e.target.value as ShareIconPosition)} style={ctl}>
          <option value="none">sem ícone</option>
          <option value="before">ícone antes</option>
          <option value="after">ícone depois</option>
        </select>
      </div>
      <ShareButton size={size} iconPosition={pos} onIconClick={(p) => setLast(p)}>
        Share
      </ShareButton>
      {last && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2" style={{ fontSize: 12, color: dark ? "#a3a3a3" : "#525252" }}>
          compartilhar: {last}
        </div>
      )}
    </div>
  );
}
