# Especificação: Grupo de avatares (avatar-group)

## Propósito
Uma fileira horizontal de avatares circulares sobrepostos, como as listas de "participantes" em apps de colaboração. Ao passar o cursor (ou tocar) sobre um avatar, ele salta para cima com uma mola elástica e um balão com o nome da pessoa aparece acima dele. Esse balão é **único e compartilhado**: ao deslizar o cursor de um avatar para o vizinho, ele não fecha e reabre, mas viaja suavemente até a nova posição e se ajusta ao novo texto.

## Aparência
- **Fileira**:
  - flex em linha, itens centralizados na vertical;
  - altura de **48 px**;
  - cada avatar, a partir do segundo, avança **−12 px** sobre o anterior (margem esquerda negativa), formando a sobreposição.
- **Empilhamento**: por padrão o **primeiro avatar fica por cima** e os seguintes vão ficando por baixo (camada = total − índice). Uma opção inverte isso para que o último fique por cima (camada = índice).
- **Avatar** (fornecido pelo usuário, mas a demo usa este visual):
  - círculo de **48 × 48 px**, conteúdo recortado em círculo;
  - borda de **3 px na cor do fundo da página** (branco `#ffffff` no tema claro, `#0a0a0a` no escuro), que cria o "recorte" entre avatares sobrepostos;
  - quando não há imagem, mostra as iniciais centralizadas sobre um fundo neutro (`#f5f5f5` claro / `#262626` escuro), texto na cor principal do tema.
- **Balão (tooltip)**:
  - fundo na cor "primária" do tema: quase preto `#0a0a0a` no claro e quase branco `#fafafa` no escuro; texto na cor oposta (`#fafafa` / `#0a0a0a`);
  - raio de **8 px**; padding de **6 px × 12 px**; fonte de **12 px**; quebra de linha equilibrada; largura ajustada ao conteúdo;
  - camada alta (z-index 50), renderizado num portal no fim do `body` para não ser cortado por overflow;
  - **seta**: triângulo de cerca de 12 px de largura, ponta com raio de ~2 px, na mesma cor do balão, apontando para o avatar e encostada no balão (deslocada 1 px para dentro para não deixar fresta). A seta acompanha horizontalmente o centro do avatar, mesmo que o balão seja empurrado para dentro da tela.

## Comportamento
### Salto do avatar
- Ao entrar com o ponteiro (ou pressionar, em toque), o avatar sobe **30% da própria altura** (≈ 14,4 px para 48 px). Ao sair, volta a 0.
- Animação por **mola**: rigidez **300**, amortecimento **17**, massa 1. É uma mola viva, com overshoot visível ao subir e ao descer.
- A área sensível ao hover é o invólucro em repouso (não acompanha o salto), o que evita tremulação.

### Balão compartilhado
- Posição padrão: **acima** do avatar, centralizado, a **25 px** de distância da borda superior do avatar em repouso (sobra ≈ 10 px acima do avatar já levantado).
- **Atrasos**: abrir com **0 ms** e fechar com **0 ms** (no grupo). A lógica geral (que também vale com atrasos diferentes de zero):
  - se já existe um balão aberto, passar para outro avatar troca o conteúdo **imediatamente**;
  - se o último fechamento aconteceu há menos que o atraso de fechamento, a abertura também é imediata;
  - caso contrário, espera o atraso de abertura;
  - o fechamento é agendado com o atraso de fechamento e é cancelado se o ponteiro entrar em outro avatar antes disso.
- **Entrada**: o balão nasce com opacidade 0, escala 0 e deslocado **15 px em direção ao avatar** (abaixo, quando está acima), e vai para opacidade 1, escala 1 e deslocamento 0.
- **Saída**: faz o caminho inverso e só sai do DOM ao terminar.
- **Troca entre avatares**: o balão (e a seta) desliza de uma posição para a outra e muda de largura/altura de forma contínua, e o texto interno se reajusta sem distorção (animação de layout que preserva a proporção do texto).
- Todas as animações do balão usam **mola** com rigidez **300** e amortecimento **35** (quase sem overshoot).
- **Fechamento imediato**: tecla **Escape**, qualquer rolagem (inclusive de contêineres internos) ou redimensionamento da janela.
- **Clique/toque** em um avatar cujo balão está aberto fecha o balão na hora e impede que o foco resultante do clique o reabra.
- **Foco por teclado** no avatar abre o balão; perder o foco agenda o fechamento.
- **Colisão com bordas**: se não houver espaço acima, o balão vai para o lado oposto (abaixo) e a seta gira junto. Ele também é deslizado no eixo transversal para ficar a pelo menos **8 px** das bordas da janela. Ao abrir num lado diferente, o deslocamento inicial de 15 px acompanha o lado (abaixo: −15 px vertical; esquerda: +15 px horizontal; direita: −15 px horizontal).
- Lados e alinhamentos possíveis: cima, baixo, esquerda, direita; início, centro, fim; mais um deslocamento extra ao longo do eixo de alinhamento.

## Técnica de renderização em alto nível
Somente DOM + CSS com animações por mola (a biblioteca `motion` resolve bem: variantes de hover/tap para o salto e animação de layout compartilhada para o balão). O balão é um único elemento flutuante por grupo, mantido por um contexto: cada avatar só registra o próprio conteúdo e o próprio retângulo de referência. O posicionamento flutuante (lado, inversão por falta de espaço, deslocamento para caber, posição da seta) deve ser implementado com uma rotina própria de cálculo a partir de `getBoundingClientRect()` do avatar e do balão, recalculada quando o alvo muda. A seta pode ser um pequeno SVG de triângulo com ponta arredondada, girado conforme o lado (0°, 90°, 180°, −90°).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de avatares (cada um com imagem opcional, iniciais e texto do balão) | array/nós | — |
| Primeiro avatar por cima (em vez do último) | booleano | verdadeiro |
| Altura do salto no hover | string % ou número px | −30% |
| Mola do salto (rigidez/amortecimento) | objeto | 300 / 17 |
| Mola do balão (rigidez/amortecimento) | objeto | 300 / 35 |
| Atraso para abrir o balão | ms | 0 |
| Atraso para fechar o balão | ms | 0 |
| Lado do balão | cima/baixo/esquerda/direita | cima |
| Distância do balão ao avatar | px | 25 |
| Alinhamento do balão | início/centro/fim | centro |
| Deslocamento no eixo de alinhamento | px | 0 |
| Sobreposição entre avatares | px | 12 |
| Tamanho do avatar | px | 48 |

## Demo
- Componente centralizado na área de prévia (fundo do palco, sem fundo próprio).
- **6 avatares** de 48 px com borda de 3 px na cor do fundo. **Não usar fotos**: cada avatar é um círculo com **gradiente próprio** (por exemplo, pares de cores distintas em diagonal, como violeta→rosa, azul→ciano, laranja→amarelo, verde→esmeralda, vermelho→laranja e índigo→azul) e as iniciais em branco, peso 600, 16 px. Gere os gradientes em CSS; nenhuma imagem externa.
- Nomes fictícios no balão, com as iniciais correspondentes. Por exemplo: "Ana Lima" (AL), "Bruno Reis" (BR), "Carla Souza" (CS), "Diego Matos" (DM), "Elisa Prado" (EP) e "Fábio Nunes" (FN).
- Sem controles.

## Acessibilidade e responsividade
- Cada avatar deve ser focável (tabindex 0) e ter nome acessível igual ao nome da pessoa. O balão deve ter papel de *tooltip* e estar ligado ao avatar focado por `aria-describedby`.
- Indicador de foco visível (anel de 2 px na cor do texto, com deslocamento) é recomendado.
- Com `prefers-reduced-motion`, trocar as molas por transições curtas sem overshoot (ou instantâneas) e desativar o deslize do balão entre avatares.
- Em toque, o "pressionar" ativa o salto e o balão. Um toque fora fecha.
- A fileira não quebra linha. Em larguras estreitas, é possível reduzir o tamanho e a sobreposição.

## Observações de fidelidade
- Recomendação: a referência fecha o balão em qualquer rolagem de qualquer elemento da página. Mantenha esse comportamento, mas limite-o a rolagens que realmente movam o avatar, se for simples.
- Recomendação: a referência guarda o elemento de referência numa variável mutável compartilhada, então trocas muito rápidas podem posicionar o balão no avatar anterior por um quadro. Garanta que o cálculo use sempre o alvo atual.
- As fotos da demo original são de pessoas reais e vinham da internet. Substitua-as por gradientes e nomes fictícios, como descrito acima.
