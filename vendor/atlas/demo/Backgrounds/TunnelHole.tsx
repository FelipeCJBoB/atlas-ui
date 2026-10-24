// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import TunnelHole from '../../componentes/hole/TunnelHole';

export default function TunnelHoleDemo() {
  return (
    <div className="relative w-full h-full min-h-[360px]">
      {/* Túnel em perspectiva; vinheta, feixe e varreduras seguem o tema do palco. */}
      <TunnelHole style={{ position: 'absolute', inset: 0, borderRadius: 14 }} />
    </div>
  );
}
