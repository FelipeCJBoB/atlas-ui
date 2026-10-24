# Especificação: Botão de ícone com partículas (icon)

## Propósito

Um botão quadrado só com ícone que, a cada clique, solta uma pequena explosão de partículas cinzentas a partir do meio da sua borda superior. Serve para ações do tipo "favoritar" ou "curtir", dando um retorno visual divertido.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Secundária / destaque | `#f5f5f5` | `#262626` |
| Texto sobre secundária / destaque | `#171717` | `#fafafa` |
| Destrutiva | `#e7000b` | `#ff6467` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |

### Botão

- Caixa flexível, conteúdo centralizado, cantos de **8 px**, não encolhe, sem contorno nativo, **posicionamento relativo** (referência das partículas).
- Ícone de **16 px** (14 px no tamanho extra-pequeno), traço fino, cor do texto do botão.
- Foco por teclado: borda na cor do anel + anel externo de 3 px (cor do anel, 50%). Desabilitado: 50% de opacidade.
- Sombra extra-sutil quando indicada: `0 1px 2px 0 rgb(0 0 0 / 0.05)`.

| Variante | Fundo | Ícone | Borda | Hover |
|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | primária com 90% (sombra sutil) |
| Destaque | destaque | texto sobre destaque | — | destaque com 90% (sombra sutil) |
| Destrutiva | destrutiva (escuro 60%) | branco | — | destrutiva com 90% |
| Contorno | fundo da página (escuro: `rgba(255,255,255,0.045)`) | texto | 1 px borda (escuro: campo) | fundo destaque (escuro: `rgba(255,255,255,0.075)`) |
| Secundária | secundária | texto sobre secundária | — | secundária com 80% |
| Fantasma | transparente | herdado | — | fundo destaque (escuro 50%) |
| Link | transparente | primária | — | sublinhado (sem efeito visível) |

| Tamanho | Dimensões |
|---|---|
| Padrão | 36 × 36 px |
| Extra-pequeno | 28 × 28 px (ícone 14 px) |
| Pequeno | 32 × 32 px |
| Grande | 40 × 40 px |

### Partículas

- Círculos sólidos de **4 × 4 px**, cor cinza médio **`#737373`** (igual nos dois temas).

## Comportamento

### Escala do botão

- Hover: 1 → **1,05**; pressionar: **0,95**; mola de rigidez **550**, amortecimento **30**, massa 1.

### Explosão a cada clique

- Cada clique **reinicia** o efeito do zero (as partículas da explosão anterior são descartadas, mesmo que ainda estejam no ar) e depois chama o manipulador de clique de quem usa.
- Antes do primeiro clique não há partículas.
- **6 partículas** nascem no **centro da borda superior** do botão (centralizadas nesse ponto).
- A partícula i (0 a 5) vai até o ponto a **30 px** de distância na direção de ângulo i × 72° — 0° é para a direita, e os ângulos crescem no sentido horário (y para baixo). Como o passo é 360°/(6 − 1), a primeira e a última partícula seguem a mesma direção (0° e 360°); visualmente são 5 direções, com uma partícula dobrada.
- Durante o voo: escala 0 → 1 → 0 e opacidade 0 → 1 → 0 (sobe até o meio e some no fim).
- Duração **0,8 s**, curva de desaceleração (ease-out), atraso escalonado de **0,05 s** por partícula.
- Partículas não são cortadas pelo botão e não capturam o ponteiro.

## Técnica de renderização em alto nível

- Botão nativo com classes por variante e tamanho; escala por mola.
- Partículas: elementos absolutos dentro do botão, animados com translação, escala e opacidade (keyframes de três pontos). Um contador incrementado a cada clique serve de chave para remontar o conjunto e reiniciar a animação.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Ícone (conteúdo) | nó React | nenhum |
| Variante (padrão, destaque, destrutiva, contorno, secundária, fantasma, link) | enumeração | padrão |
| Tamanho (padrão, extra-pequeno, pequeno, grande) | enumeração | padrão |
| Manipulador de clique, classe e atributos de botão | — | repassados |

(Constantes internas da explosão, que podem virar parâmetros: 6 partículas, raio 30 px, abertura 360°, 0,8 s, escalonamento 0,05 s, partícula de 4 px.)

## Demo

- Um botão centralizado com um ícone de **estrela** de cinco pontas em traço.
- Controles: variante (padrão, destaque, contorno, fantasma; padrão selecionada) e tamanho (padrão, pequeno, grande; padrão selecionado).

## Acessibilidade e responsividade

- Recomendação: nome acessível obrigatório (botão só com ícone); partículas ocultas para tecnologias assistivas.
- Teclado: Enter/Espaço disparam o clique e a explosão (botão nativo).
- Movimento reduzido: recomendação — não exibir partículas e desativar a escala.

## Observações de fidelidade

- **Recomendação — direções**: a sobreposição da primeira e da última partícula é um defeito da distribuição angular. Para uma explosão em círculo completo, distribuir as N partículas em 360°/N (60° com 6). Se a fidelidade visual estrita for exigida, manter o passo de 72°.
- As partículas ficam montadas (invisíveis) depois de terminar, até o próximo clique; isso não tem efeito visual.
