// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import GravityStars from '../../componentes/gravity-stars/GravityStars';

export default function GravityStarsDemo() {
  return (
    <div className="relative w-full h-full min-h-[320px]">
      {/* Fundo absoluto com recuo zero; a cor das estrelas vem da cor de texto do tema. */}
      <GravityStars className="absolute inset-0 rounded-[12px] flex items-center justify-center" />
    </div>
  );
}
