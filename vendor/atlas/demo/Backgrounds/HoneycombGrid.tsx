// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import HoneycombGrid from '../../componentes/hexagon/HoneycombGrid';

export default function HoneycombGridDemo() {
  return (
    <div className="relative w-full h-full min-h-[360px]">
      {/* Fundo de colmeia ocupando a prévia; o tema vem do palco (classe dark/light). */}
      <HoneycombGrid style={{ position: 'absolute', inset: 0, borderRadius: 14 }} />
    </div>
  );
}
