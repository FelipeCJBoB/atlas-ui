// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import RadialIntro, { type RadialIntroItem } from '../../componentes/radial-intro/RadialIntro';

const PESSOAS: RadialIntroItem[] = [
  'Ana',
  'Bruno',
  'Caio',
  'Duda',
  'Elisa',
  'Felipe',
  'Gabi',
  'Heitor',
  'Iris',
].map((name, i) => ({ id: i + 1, name }));

export default function RadialIntroDemo() {
  return (
    <div className="relative flex h-full min-h-[380px] w-full items-center justify-center p-4">
      <RadialIntro items={PESSOAS} stageSize={320} avatarSize={60} />
    </div>
  );
}
