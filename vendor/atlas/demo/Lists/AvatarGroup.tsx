// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import AvatarGroup, { type AvatarGroupItem } from '../../componentes/avatar-group/AvatarGroup';

// Nomes fictícios; avatares são gradientes CSS (nenhuma imagem).
const PESSOAS: [string, string, string, string][] = [
  ['Ana Lima', 'AL', '#8b5cf6', '#ec4899'],
  ['Bruno Reis', 'BR', '#3b82f6', '#06b6d4'],
  ['Carla Souza', 'CS', '#f97316', '#facc15'],
  ['Diego Matos', 'DM', '#22c55e', '#10b981'],
  ['Elisa Prado', 'EP', '#ef4444', '#f97316'],
  ['Fábio Nunes', 'FN', '#6366f1', '#3b82f6'],
];

const AVATARES: AvatarGroupItem[] = PESSOAS.map(([name, initials, de, para]) => ({
  name,
  initials,
  background: `linear-gradient(135deg, ${de}, ${para})`,
  textStyle: { color: '#ffffff', fontSize: 16, fontWeight: 600 },
}));

export default function AvatarGroupDemo() {
  return (
    <div className="relative w-full h-full min-h-[360px] flex items-center justify-center">
      <AvatarGroup avatars={AVATARES} />
    </div>
  );
}
