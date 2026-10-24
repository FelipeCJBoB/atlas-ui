// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { ClipboardPaste, Copy, Pin, Scissors, Star, Trash2 } from 'lucide-react';
import RadialMenu, { type RadialMenuItem } from '../../componentes/radial-menu/RadialMenu';

const items: RadialMenuItem[] = [
  { id: 'copy', label: 'Copy', icon: Copy },
  { id: 'cut', label: 'Cut', icon: Scissors },
  { id: 'paste', label: 'Paste', icon: ClipboardPaste },
  { id: 'favorite', label: 'Favorite', icon: Star },
  { id: 'pin', label: 'Pin', icon: Pin },
  { id: 'delete', label: 'Delete', icon: Trash2 },
];

export default function RadialMenuDemo() {
  return (
    <div className="w-full h-full min-h-[320px] flex items-center justify-center">
      <RadialMenu items={items} onSelect={(item) => console.log(item)}>
        <div
          className="flex h-[320px] w-[320px] items-center justify-center rounded-[8px] border-2 border-dashed text-center text-sm"
          style={{ borderColor: 'color-mix(in srgb, currentColor 25%, transparent)' }}
        >
          Right click to open the radial menu
        </div>
      </RadialMenu>
    </div>
  );
}
