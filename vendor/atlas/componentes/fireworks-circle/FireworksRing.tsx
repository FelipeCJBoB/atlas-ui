// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
// Variação do motor de fogos com valores fixos: cada explosão vira um anel circular.
import Fireworks, { type FireworksProps } from '../fireworks/Fireworks';

export interface FireworksRingProps extends Omit<FireworksProps, 'rocketSpeed' | 'rocketSize' | 'particleSpeed' | 'particleSize'> {
  /** Velocidade do foguete (px/quadro a 60 qps). */
  rocketSpeed?: number;
  /** Espessura do foguete (px). */
  rocketSize?: number;
  /** Velocidade das partículas (px/quadro); o anel tende a 50 × v px de raio. */
  particleSpeed?: number;
  /** Raio das partículas (px). */
  particleSize?: number;
}

export function FireworksRing({
  density = 2,
  rocketSpeed = 6,
  rocketSize = 3,
  particleSpeed = 4,
  particleSize = 2,
  themeColor = { dark: '#ffffff', light: '#000000' },
  evenRing = true,
  ...resto
}: FireworksRingProps) {
  return (
    <Fireworks
      {...resto}
      density={density}
      rocketSpeed={rocketSpeed}
      rocketSize={rocketSize}
      particleSpeed={particleSpeed}
      particleSize={particleSize}
      themeColor={themeColor}
      evenRing={evenRing}
    />
  );
}

export default FireworksRing;
