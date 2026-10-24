// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import type { CSSProperties } from 'react';
import CodeBlock from '../../componentes/code/CodeBlock';

// Conteúdo de exemplo da demo.
const EXEMPLO = `'use client';

import * as React from 'react';

type MyComponentProps = {
  myProps: string;
} & React.ComponentProps<'div'>;

function MyComponent(props: MyComponentProps) {
  return (
    <div {...props}>
      <p>My Component</p>
    </div>
  );
}

export { MyComponent, type MyComponentProps };`;

// Logotipo de átomo próprio: núcleo + três órbitas (0°, 60°, 120°).
function AtomIcon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      {[0, 60, 120].map((a) => (
        <ellipse key={a} cx="12" cy="12" rx="10.5" ry="4" transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  );
}

export default function CodeBlockDemo() {
  return (
    <div className="relative w-full h-full min-h-[420px] flex items-center justify-center p-4">
      <CodeBlock
        code={EXEMPLO}
        lang="tsx"
        icon={AtomIcon}
        title="my-component.tsx"
        copyButton
        writing
        cursor
        duration={8000}
        delay={500}
        style={{ width: 420, height: 372, maxWidth: '100%' }}
      />
    </div>
  );
}
