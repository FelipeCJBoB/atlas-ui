# Especificação: Botão com onda (ripple)

## Propósito

Um botão que, a cada clique, emite uma "onda" circular a partir do ponto exato do clique: um círculo semitransparente que cresce e esmaece, recortado pelos cantos do botão (efeito "ripple" do Material Design). Também cresce levemente no hover e encolhe ao ser pressionado.

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
| Texto sobre destrutiva | `#fafafa` | `#fafafa` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |

### Botão

- Caixa em linha flexível, conteúdo centralizado, **8 px** entre ícone e texto, sem quebra, cantos de **8 px**, texto **14 px** peso **500**, ícones de 16 px.
- **Posicionamento relativo** e **conteúdo excedente oculto** (para recortar a onda nos cantos).
- Foco por teclado: borda na cor do anel + anel externo de 3 px (cor do anel, 50%). Desabilitado: 50% de opacidade. Inválido: borda/anel destrutivos.
- Sombra extra-sutil quando indicada: `0 1px 2px 0 rgb(0 0 0 / 0.05)`.

| Variante | Fundo | Texto | Borda | Hover | Cor da onda |
|---|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | primária 90% | texto sobre primária |
| Destaque | destaque | texto sobre destaque | — | destaque 90% | texto sobre destaque |
| Destrutiva | destrutiva (escuro 60%) | branco | — | destrutiva 90% | texto sobre destrutiva (`#fafafa`) |
| Contorno | fundo da página (escuro `rgba(255,255,255,0.045)`) | texto | 1 px borda (escuro: campo) | fundo destaque (escuro `rgba(255,255,255,0.075)`) | texto |
| Secundária | secundária | texto sobre secundária | — | secundária 80% | texto sobre secundária |
| Fantasma | transparente | herdado | — | fundo destaque (escuro 50%) | texto |
| Link | transparente | primária | — | sublinhado (4 px de afastamento) | texto sobre primária |

| Tamanho | Dimensões | Padding horizontal (se filho direto for ícone) |
|---|---|---|
| Padrão | altura 36 px | 16 px (12 px), vertical 8 px |
| Pequeno | altura 32 px, espaço 6 px | 12 px (10 px) |
| Grande | altura 40 px | 24 px (16 px) |
| Ícone | 36 × 36 px | — |
| Ícone pequeno | 32 × 32 px | — |
| Ícone grande | 40 × 40 px | — |

### Onda

- Círculo sólido de **20 × 20 px** na cor da onda da variante, centrado no ponto do clique (coordenadas relativas ao canto superior esquerdo do botão).
- Fica por cima do conteúdo, não captura ponteiro, recortado pelo botão.

## Comportamento

- **Hover**: escala 1 → **1,05**; **pressionar**: **0,95**; mola de rigidez **550**, amortecimento **30**, massa 1.
- **Clique**:
  1. Mede o retângulo do botão e calcula o ponto do clique relativo a ele.
  2. Adiciona uma onda nesse ponto.
  3. Chama o manipulador de clique de quem usa.
- **Animação da onda**: escala 0 → **10** (diâmetro final aparente de 200 px) e opacidade **0,5 → 0**, em **0,6 s** com desaceleração (ease-out).
- A onda é removida **600 ms** depois de criada.
- Cliques rápidos geram várias ondas simultâneas, independentes.

## Técnica de renderização em alto nível

- Botão nativo relativo com corte de excedente; uma lista de ondas no estado (id, x, y). Cada onda é um elemento absoluto circular animado (escala + opacidade) e retirado da lista por temporizador.
- A cor da onda vem de uma variável CSS definida pela variante do botão, permitindo sobrescrever a cor por parâmetro.
- O componente expõe duas partes: o botão e a camada de ondas, que quem usa coloca dentro do botão (depois do conteúdo).

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Variante (sete opções) | enumeração | padrão |
| Tamanho (seis opções) | enumeração | padrão |
| Escala no hover | número | 1,05 |
| Escala ao pressionar | número | 0,95 |
| Cor da onda | string de cor CSS | a cor definida pela variante |
| Escala final da onda | número | 10 |
| Transição da onda (duração, curva) | objeto | 0,6 s, ease-out |
| Renderizar como filho | booleano | falso |
| Conteúdo, manipulador de clique, classe e atributos | — | repassados |

## Demo

- Um botão centralizado com o texto **"Click me"** (nos tamanhos de ícone, um ícone de sinal de mais) e a camada de ondas dentro dele.
- Controles: variante (as sete; padrão selecionada) e tamanho (os seis; padrão selecionado).

## Acessibilidade e responsividade

- Botão nativo; ondas ocultas para tecnologias assistivas.
- Movimento reduzido: recomendação — não exibir a onda (ou só um breve esmaecimento) e desativar a escala.
- Tamanho intrínseco ao conteúdo.

## Observações de fidelidade

- **Recomendação — clique por teclado**: ativado com Enter/Espaço, o evento chega sem coordenadas de ponteiro e a onda nasce fora do botão (no canto, com deslocamento negativo). Nesse caso, centralizar a onda no botão.
- **Recomendação — identificadores**: a referência identifica cada onda pelo horário em milissegundos; dois cliques no mesmo milissegundo colidem. Usar um contador incremental.
- **Recomendação — limpeza**: cancelar os temporizadores no desmonte.
- **Recomendação — variante link**: a onda em "texto sobre primária" sobre fundo transparente fica invisível no tema claro; usar a cor do texto.
