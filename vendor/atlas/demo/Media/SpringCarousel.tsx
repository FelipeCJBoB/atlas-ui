// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import SpringCarousel from '../../componentes/motion-carousel/SpringCarousel';

const SLIDES = [0, 1, 2, 3, 4, 5];

export default function SpringCarouselDemo() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center px-4 py-6">
      <SpringCarousel slides={SLIDES} loop />
    </div>
  );
}
