# Especificação: Cartão de perfil que vira (flip-card)

## Propósito

Um cartão de perfil em formato retrato que gira 180° no eixo vertical, como uma carta de baralho. A frente mostra avatar, nome e usuário; o verso mostra bio, estatísticas (seguindo, seguidores, publicações), ícones de redes sociais e um botão "Follow". No desktop gira ao passar o ponteiro; em telas de toque, gira a cada toque.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Fundo suave ("muted") | `#f5f5f5` | `#262626` |
| Texto atenuado | `#737373` | `#a1a1a1` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |

### Contêiner

- Retângulo de **160 × 240 px**; em viewports de **768 px ou mais**, **240 × 320 px**.
- Centralizado na horizontal, margem superior de 8 px, posicionamento relativo, cursor de ponteiro.
- Deve ter **perspectiva de 1000 px** para o giro parecer 3D (ver Observações).

### Faces (frente e verso)

- Cada face cobre o contêiner inteiro (absoluta, 0 nas quatro bordas), com a **face traseira invisível** quando virada (verso do plano oculto) e preservação 3D dos filhos.
- Cantos de **8 px**, borda de **2 px** na cor do texto com **20%** de opacidade (claro ≈ `rgba(10,10,10,0.2)`, escuro ≈ `rgba(250,250,250,0.2)`).
- Padding de 16 px nas laterais e 24 px em cima/embaixo.

#### Frente

- Fundo: gradiente linear na diagonal para baixo-direita: fundo suave → fundo da página → fundo suave (claro `#f5f5f5 → #ffffff → #f5f5f5`; escuro `#262626 → #0a0a0a → #262626`).
- Coluna centralizada nos dois eixos, texto centralizado:
  1. **Avatar**: círculo de **80 px** (96 px a partir de 768 px), imagem cobrindo o círculo, borda de 2 px na cor de borda, 16 px de margem abaixo.
  2. **Nome**: 18 px, negrito (700), cor do texto.
  3. **Usuário**: "@" + usuário, 14 px, cor atenuada.

#### Verso

- Fundo: gradiente linear na diagonal para cima-direita, mesmas três cores.
- Coluna com itens centralizados horizontalmente, distribuídos com espaço entre eles (topo, meio, base), espaço mínimo de 16 px:
  1. **Bio**: 12 px (14 px a partir de 768 px), cor atenuada, centralizada.
  2. **Estatísticas**: linha de largura total, padding lateral de 24 px, itens distribuídos com espaço entre eles; cada item é um bloco alinhado à esquerda com o número (16 px, negrito) e, abaixo, o rótulo (12 px, atenuado): "Following", "Followers" e, se houver, "Posts". Números exibidos crus (ex.: "2900", sem separador).
  3. **Redes sociais**: linha centralizada com 16 px entre ícones; ícones de traço de **20 px** na cor do texto (LinkedIn, GitHub, Twitter/X), cada um um link que abre em nova aba; no hover, escala 1,05 com transição de transformação curta (~150 ms). Só aparecem as redes informadas.
  4. **Botão "Follow"**: altura 40 px, padding 16 px × 8 px, cantos de **10 px**, texto 14 px peso 500, fundo primária, texto sobre primária, hover com fundo primária a 90%, cursor de ponteiro. Sem ação.

### Assets

- **Não usar a foto do original.** O avatar da demo deve ser gerado: um círculo com gradiente próprio (por exemplo, diagonal de `#6366f1` a `#ec4899`) com as iniciais "AU" em branco, peso 600, centralizadas — ou um SVG inline equivalente / `data:` URI.
- Ícones de redes: usar os do conjunto de ícones disponível se existirem; caso contrário, desenhar SVGs próprios simplificados (quadrado arredondado com "in"; silhueta do gato-polvo num círculo; pássaro ou "X"), em traço de 2 px.

## Comportamento

- **Estado**: virado ou não (começa não virado, mostrando a frente).
- **Desktop** (sem suporte a toque): ponteiro entra → vira; ponteiro sai → desvira. Clique não faz nada.
- **Toque** (dispositivo com eventos de toque): cada toque/clique alterna o estado; entrada/saída de ponteiro são ignoradas.
- **Animação**:
  - frente: giro no eixo vertical de 0° → **180°** ao virar;
  - verso: começa em **180°** e vai a **0°** ao virar;
  - na volta, o inverso;
  - duração **0,5 s**, curva de desaceleração (ease-out, equivalente a `cubic-bezier(0, 0, 0.58, 1)`);
  - interrupção no meio parte do ângulo atual.
- Por causa da face traseira oculta, a frente desaparece ao passar de 90° e o verso aparece ao passar abaixo de 90°.

## Técnica de renderização em alto nível

- DOM e CSS 3D: duas faces irmãs absolutamente sobrepostas, cada uma com rotação Y animada de forma independente (não um único cartão girando), visibilidade de face traseira oculta e perspectiva no contêiner.
- Animação por tween (biblioteca de animação ou transição CSS de transform com a mesma duração e curva).

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Nome | string | obrigatório |
| Usuário (sem "@") | string | obrigatório |
| Imagem do avatar (URL ou nó) | string | obrigatório |
| Bio | string | obrigatório |
| Estatísticas: seguindo, seguidores, publicações (opcional) | números | obrigatórios, exceto publicações |
| Links de redes: LinkedIn, GitHub, Twitter (cada um opcional) | strings | ausentes |

## Demo

- O cartão centralizado na área de prévia (fundo do tema).
- Dados:
  - nome **"Animate UI"**, usuário **"animate_ui"**;
  - avatar gerado (ver Assets);
  - bio: **"A fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, and Motion."**;
  - estatísticas: seguindo **200**, seguidores **2900**, publicações **120**;
  - links para as páginas iniciais do LinkedIn, GitHub e Twitter.
- Sem controles. Com o cursor parado no centro, o cartão deve virar (hover).

## Acessibilidade e responsividade

- Recomendação: tornar o cartão focável (ou usar um botão de alternância) e virar também com foco por teclado / Enter / Espaço; expor o estado (pressionado/expandido).
- Recomendação: esconder das tecnologias assistivas a face que está de costas, e dar nomes acessíveis aos links de redes ("LinkedIn", "GitHub", "Twitter").
- Imagem do avatar com texto alternativo = nome.
- Movimento reduzido: recomendação — trocar as faces com esmaecimento, sem giro.
- Responsivo: dois tamanhos (abaixo/acima de 768 px). No tamanho pequeno, a bio pode ficar apertada; considerar limitar linhas.

## Observações de fidelidade

- **Recomendação — perspectiva**: a referência tenta aplicar perspectiva de 1000 px, mas o utilitário usado não gera CSS na versão atual do framework de estilos, então o giro aparece "achatado" (sem profundidade). Aplicar perspectiva de 1000 px de verdade no contêiner.
- **Recomendação — publicações = 0**: na referência, 0 publicações faz aparecer um "0" solto no lugar do bloco. Ocultar o bloco quando o valor não existir, e mostrar "0" corretamente quando for zero de fato.
- **Recomendação — detecção de toque**: a referência decide "toque" pela existência de eventos de toque na janela (notebooks com tela de toque perdem o hover). Preferir a consulta de mídia de ponteiro grosso / sem hover.
- **Recomendação — botão "Follow"**: sem ação; aceitar um manipulador opcional.
