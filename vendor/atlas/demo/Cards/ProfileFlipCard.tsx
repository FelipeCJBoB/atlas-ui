// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import ProfileFlipCard from '../../componentes/flip-card/ProfileFlipCard';

// Avatar gerado: círculo com gradiente próprio e iniciais "AU".
const AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/>
      </linearGradient></defs>
      <rect width="96" height="96" fill="url(#g)"/>
      <text x="48" y="49" text-anchor="middle" dominant-baseline="central" fill="#fff"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="34" font-weight="600">AU</text>
    </svg>`,
  );

export default function ProfileFlipCardDemo() {
  return (
    <div className="relative flex h-full min-h-[360px] w-full items-center justify-center">
      <ProfileFlipCard
        name="Animate UI"
        username="animate_ui"
        avatar={AVATAR}
        bio="A fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, and Motion."
        stats={{ following: 200, followers: 2900, posts: 120 }}
        links={{
          linkedin: 'https://www.linkedin.com/',
          github: 'https://github.com/',
          twitter: 'https://twitter.com/',
        }}
      />
    </div>
  );
}
