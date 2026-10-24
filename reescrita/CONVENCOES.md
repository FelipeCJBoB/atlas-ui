# Convenções dos componentes de autoria Atlas

> **Encerrada em 2026-10-24** com 55 componentes próprios em `vendor/atlas/`. React Bits e Animate UI voltaram ao repositório com a licença original (MIT + Commons Clause); `lote.json` e `specs/` ficam como histórico.

Componentes reescritos em **sala limpa**: o implementador recebe só a especificação (`reescrita/specs/<slug>.md`) e escreve o código do zero.

## Regras de sala limpa (obrigatórias)
- Leia **apenas** a especificação do componente, este arquivo e o código já escrito em `vendor/atlas/`.
- **Proibido** abrir qualquer outra pasta de `vendor/` (código de terceiros), o `.vendor-completo/`, `out/`, `src/gen/`, os HTML do Atlas ou buscar o componente original na internet.
- Nomes de componente, props, variáveis, classes e arquivos são escolhas suas.

## Stack
- React 19 + TypeScript (`.tsx`), Tailwind CSS v4 (classes utilitárias) e/ou `style` inline. CSS próprio em `.css` só se necessário (é compilado e escopado pelo build).
- Pacotes disponíveis (não instale outros): `motion` (use `motion/react`), `gsap`, `ogl`, `three`, `lucide-react`, `clsx`, `tailwind-merge`. Prefira CSS/React puro ou `motion` quando bastar.
- Sem rede: nada de CDN, fontes externas, imagens remotas ou APIs. Imagens de demo: gradientes CSS, SVG inline ou `data:`.
- Sem assets de terceiros: modelos 3D, texturas, fotos e fontes do original NÃO podem ser usados. Gere geometria/textura proceduralmente (three/ogl), use SVG próprio ou gradientes.
- WebGL: `ogl` ou `three`, com shaders escritos por você a partir da descrição do efeito.

## Estrutura
```
vendor/atlas/componentes/<slug>/<NomeComponente>.tsx   ← componente (export default + export nomeado)
vendor/atlas/demo/<Categoria>/<NomeComponente>.tsx      ← demo: export default sem props, reproduz o cenário da especificação
```
- `<Categoria>` (em inglês, define a classificação no catálogo): `Backgrounds`, `Buttons`, `Cards`, `Text`, `Navigation`, `Inputs`, `Interactions`, `Menus`, `Media` (galerias, carrosséis), `Lists`, `Misc`.
- O demo importa o componente por caminho relativo (`../../componentes/<slug>/<NomeComponente>`).
- O demo ocupa o contêiner: use `className="w-full h-full min-h-[320px] flex items-center justify-center"` (ou o que a especificação pedir), com fundo próprio se a especificação definir.

## Demo (lições do piloto)
- Contêiner da demo: `relative w-full h-full min-h-[360px]`, componente **centralizado** (flex). Controles (seletores, sliders) em `position: absolute` num canto, sem deslocar o componente; poucos controles, só os que mostram variações relevantes.
- Fundo da área: transparente (o palco já é escuro/claro). Cores de texto/ícones com **contraste explícito**: detecte o tema pela classe `dark`/`light` do ancestral mais próximo (`closest('.dark, .light')`), com fallback para `prefers-color-scheme`.
- Nada pode depender de medição para ficar visível (se medir altura/largura, tenha valor de fallback).
- Após compilar, a demo será capturada num Chromium headless: o componente precisa aparecer imediatamente (sem exigir clique) e, se tiver efeito de hover, reagir ao cursor parado no centro da área.

## Qualidade
- Tipos das props em TypeScript, com valores padrão iguais aos da especificação.
- Limpe tudo no desmonte (listeners, `requestAnimationFrame`, timers, observers).
- Respeite `prefers-reduced-motion` quando a animação for contínua.
- Comentários curtos em português só onde a lógica não for óbvia.
- Cabeçalho do arquivo: `// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).`
