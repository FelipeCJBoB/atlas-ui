# Especificação: Botão de estrelas do GitHub (github-stars)

## Propósito

Um botão no estilo "badge de repositório": mostra o logotipo do GitHub, um contador de estrelas que conta de zero até o total com dígitos rolando como num odômetro, e uma estrela que vai se enchendo de amarelo de baixo para cima conforme a contagem avança. Quando a contagem termina, a estrela solta uma pequena explosão de partículas amarelas.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Destaque ("accent") | `#f5f5f5` | `#262626` |
| Texto sobre destaque | `#171717` | `#fafafa` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |
| Amarelo da estrela e das partículas | `#f0b100` | `#f0b100` |

### Botão

- Caixa em linha flexível, conteúdo centralizado, **8 px** entre os elementos, sem quebra, cantos de **8 px**, texto **14 px** peso **500**.
- Foco por teclado: borda na cor do anel + anel externo de 3 px (cor do anel, 50%). Desabilitado: 50% de opacidade.
- Sombra extra-sutil quando indicada: `0 1px 2px 0 rgb(0 0 0 / 0.05)`.

| Variante | Fundo | Texto | Borda | Hover |
|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | primária com 90% (sombra sutil) |
| Destaque | destaque | texto sobre destaque | — | destaque com 90% (sombra sutil) |
| Contorno | fundo da página (escuro: `rgba(255,255,255,0.045)`) | texto | 1 px borda (escuro: campo) | fundo destaque (escuro: `rgba(255,255,255,0.075)`) |
| Fantasma | transparente | herdado | — | fundo destaque (escuro 50%) |

| Tamanho | Altura | Padding horizontal |
|---|---|---|
| Padrão | 36 px | 16 px (vertical 8 px) |
| Pequeno | 32 px (espaço 6 px) | 12 px |
| Grande | 40 px | 24 px |

### Conteúdo, da esquerda para a direita

1. **Logotipo do GitHub**: 16 × 16 px, preenchido na cor do texto. É a silhueta do "gato-polvo" dentro de um círculo. **Não copiar o arquivo do original**: desenhar um SVG próprio simplificado (círculo com a silhueta) ou usar o ícone equivalente do conjunto de ícones disponível.
2. **Contador**: número em algarismos tabulares, na cor do texto, preenchido com zeros à esquerda até o número de dígitos do total (ex.: "0000" no início para um total de 4 dígitos). Cada dígito é uma coluna de 1 "ch" de largura e altura de linha 1, que só mostra um algarismo por vez.
3. **Estrela**: 18 × 18 px, estrela de cinco pontas em traço com preenchimento, composta por duas camadas sobrepostas:
   - **base** (estrela inteira) num cinza conforme a variante:
     - padrão: `#404040` no claro / `#d4d4d4` no escuro;
     - destaque, contorno e fantasma: `#d4d4d4` no claro / `#404040` no escuro;
   - **cobertura amarela** (`#f0b100`, preenchimento e traço) por cima, recortada de baixo para cima (ver Comportamento).

## Comportamento

### Disponibilidade do total

- O total de estrelas vem de um valor numérico fornecido por quem usa.
- A referência também consegue buscar o total na API pública do GitHub (usuário + repositório), opcionalmente com atraso e só quando o botão fica visível; enquanto busca, **não renderiza nada**. **Na reimplementação não há rede**: o total é sempre um número fornecido. A busca remota pode existir como recurso opcional desligado, mas a demo não a usa.

### Contagem

- Ao aparecer, o valor exibido parte de **0** e segue até o total por uma **mola lenta**: rigidez **90**, amortecimento **50**, massa 1 (sem oscilação, com desaceleração longa — alguns segundos para totais grandes).
- A cada passo, o valor é arredondado para inteiro e exibido.
- Cada coluna de dígito rola até o seu algarismo com uma **mola** de rigidez **200**, amortecimento **20**, massa **0,4** (rápida, com leve balanço). Os algarismos de uma coluna ficam empilhados verticalmente em círculo (0 a 9) e a coluna sempre rola pelo caminho mais curto (de 9 para 0, um passo para a frente). O resultado é um "odômetro": a coluna das unidades gira várias voltas; as mais altas avançam devagar.

### Enchimento da estrela

- Progresso p = valor exibido / total × 100.
- Durante a contagem, a cobertura amarela mostra a faixa inferior de altura (p − 10)% da estrela (ou seja, o amarelo fica 10 pontos percentuais atrás do progresso). Recorte retangular a partir do topo.
- Quando o valor exibido chega ao total, a cobertura fica em 100% (estrela inteira amarela).

### Explosão de partículas ao concluir

- No instante em que a contagem termina, nascem **6 partículas** circulares de **4 px**, amarelas (`#f0b100`), todas a partir do **centro da borda superior** da estrela.
- Cada partícula i (0 a 5) vai até um ponto a **30 px** de distância na direção de ângulo i × 72° (0° = direita, ângulos crescem no sentido horário, com y para baixo).
- Ao mesmo tempo, escala 0 → 1 → 0 e opacidade 0 → 1 → 0.
- Duração **0,8 s**, desaceleração (ease-out), com atraso escalonado de **0,05 s** por partícula (i × 0,05 s).
- As partículas não são cortadas pelo botão.

### Botão

- Hover: escala 1 → 1,05; pressionar: 0,95; mola de rigidez 550, amortecimento 30.
- É um botão (sem ação própria por padrão; quem usa pode passar um manipulador de clique).

## Técnica de renderização em alto nível

- DOM/SVG. Ícones SVG inline; a cobertura da estrela é uma segunda cópia do mesmo ícone posicionada exatamente sobre a base, com recorte CSS retangular (inset a partir do topo) calculado pelo progresso.
- Contador: composição de colunas de dígitos; um valor animado por mola (o número) alimenta o estado exibido, e cada coluna tem o próprio valor contínuo animado por mola que posiciona os dez algarismos sobrepostos por translação vertical, com corte vertical. A altura de um algarismo é medida (com valor de reserva antes da medição).
- Partículas: elementos absolutos animados (translação, escala, opacidade) montados quando a contagem conclui.
- Detecção opcional de visibilidade na tela (observador de interseção) para só começar ao aparecer.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Total de estrelas | número | obrigatório na reimplementação |
| Usuário e repositório (apenas para rótulo/ligação ou busca opcional) | strings | ausentes |
| Atraso antes de iniciar, em ms | número | 0 |
| Só iniciar quando visível na tela | booleano | falso |
| Margem da detecção de visibilidade | string de margem CSS | "0px" |
| Detectar visibilidade só uma vez | booleano | verdadeiro |
| Variante (padrão, destaque, contorno, fantasma) | enumeração | padrão |
| Tamanho (padrão, pequeno, grande) | enumeração | padrão |
| Classe extra, atributos e eventos de botão | — | repassados |

## Demo

- Um botão centralizado na área de prévia, com um total fixo de **3482** estrelas (substitui a busca remota do original, que consultava um repositório real).
- Ao montar, o contador rola de "0000" até "3482", a estrela enche de baixo para cima e, no fim, solta as partículas.
- Controles: variante (padrão, destaque, contorno, fantasma; padrão selecionada) e tamanho (padrão, pequeno, grande; padrão selecionado). Trocar um controle remonta o botão e reinicia a contagem.

## Acessibilidade e responsividade

- Logotipo e estrelas são decorativos (ocultos para tecnologias assistivas).
- Recomendação: nome acessível do botão do tipo "3.482 estrelas no GitHub", porque as colunas de dígitos leriam lixo; esconder as colunas das tecnologias assistivas.
- Recomendação: quando houver usuário/repositório, renderizar como **link** para a página do repositório (padrão "como filho"), já que o propósito é levar ao repositório.
- Movimento reduzido: recomendação — mostrar o total direto, estrela cheia, sem partículas.

## Observações de fidelidade

- **Recomendação — valor fixo + repositório**: na referência, informar valor **e** usuário **e** repositório faz o componente nunca aparecer (fica eternamente "carregando"). Com valor fixo, renderizar imediatamente.
- **Recomendação — total zero**: com total 0 (ou falha na busca), o progresso vira divisão por zero e a contagem já nasce "concluída", disparando partículas. Tratar 0 como estrela vazia e sem explosão.
- **Recomendação — rede**: proibido buscar dados remotos na demo; usar o valor fixo.
