# Especificação: Cursor de fluido (splash-cursor)

## Propósito
Camada de tela cheia, por cima de toda a página e sem bloquear cliques, que simula um fluido colorido em tempo real. Ao mover o cursor, ele "pinta" tinta luminosa que é carregada pela velocidade do movimento, forma redemoinhos e se dissipa em poucos segundos. Clicar solta um respingo forte. Efeito decorativo de cursor.

## Aparência
- **Camada**: posicionada de forma **fixa** no canto superior esquerdo da janela, 100% × 100%, **z-index 50**, sem capturar ponteiro. Dentro dela, uma superfície de desenho em bloco com a largura e altura da viewport (100vw × 100vh).
- **Fundo**: transparente. Só a tinta aparece; onde não há tinta, vê-se a página por baixo.
- **Tinta**: cores saturadas de baixa intensidade que, somadas, ficam luminosas. A opacidade de cada pixel é a do canal mais forte da cor, e a composição sobre a página é feita com alfa pré-multiplicado (a tinta clareia/colore o que está atrás, no estilo de um brilho).
  - **Modo arco-íris** (padrão do componente): cada cor é um matiz aleatório com saturação e valor máximos, escalado para **15%** da intensidade.
  - **Modo cor única**: a cor configurada (padrão **`#ff0000`**), também escalada para 15%.
- **Sombreamento** (ligado por padrão): um relevo sutil. Estima-se uma normal a partir do gradiente da intensidade da tinta entre pixels vizinhos e escurece-se até **30%** nas encostas (fator de luz entre 0,7 e 1,0), dando volume às volutas.
- Resolução da tinta: o lado menor da textura de tinta tem **1440** px (o maior é proporcional à razão da tela). A simulação de velocidade roda numa grade bem menor: lado menor de **128** células.

## Comportamento

### Entrada
- Eventos escutados na **janela inteira** (mouse e toque). Coordenadas da viewport, convertidas para a resolução física (× densidade de pixels) e normalizadas 0–1 com Y invertido.
- **Mover o mouse** (sem precisar clicar): a cada quadro em que houve movimento, aplica-se um "respingo" na posição atual com força = deslocamento normalizado desde o último evento × **força do respingo** (padrão **6000**), corrigido pela razão de aspecto para que o movimento horizontal e o vertical tenham a mesma escala. A cor usada é a cor corrente do ponteiro.
- **Pressionar o mouse**: respingo de clique — cor nova com intensidade **10×** maior e velocidade aleatória pequena (até ±5 na horizontal e ±15 na vertical, em unidades de força).
- **Toque**: tocar só posiciona o ponteiro (sem respingo); arrastar funciona como mover o mouse. Apenas um ponteiro lógico, mesmo com vários dedos.
- **Troca de cor**: um temporizador acumula Δt × velocidade de troca de cor (padrão **10**); a cada vez que passa de 1, sorteia nova cor. Com o padrão, a cor muda a cada **0,1 s**, gerando rastros multicoloridos no modo arco-íris.

### Respingo
Adiciona ao campo (de velocidade e, separadamente, de tinta) uma **gaussiana** centrada no ponto: peso e^(−d²/r), com r = raio do respingo (padrão **0,2**) ÷ 100, ampliado pela razão de aspecto quando a tela é mais larga que alta (a mancha fica circular na tela).

### Passo da simulação (a cada quadro)
Δt real, limitado a **1/60 s**. Em ordem:
1. **Rotacional** do campo de velocidade.
2. **Confinamento de vorticidade**: empurra o fluido perpendicularmente ao gradiente do módulo do rotacional, com intensidade **3** (parâmetro de redemoinho). Velocidades limitadas a ±1000.
3. **Divergência** do campo, com bordas refletoras (paredes sólidas nas laterais).
4. **Pressão**: o campo de pressão anterior é multiplicado por **0,1** (reaproveitamento parcial) e depois refinado por **20 iterações de Jacobi** para resolver a equação de Poisson.
5. **Projeção**: subtrai o gradiente da pressão da velocidade (fluido incompressível).
6. **Advecção semi-Lagrangiana** da velocidade por ela mesma, com dissipação: o valor é dividido por (1 + **2** × Δt).
7. **Advecção da tinta** pela velocidade, com dissipação de **3,5** (dividida por 1 + 3,5 × Δt). Com esses números a tinta some em cerca de 1–2 s.
- Se a precisão de filtragem linear em texturas de ponto flutuante não existir, a resolução da tinta cai para 256, o sombreamento é desligado e a interpolação bilinear é feita manualmente.

### Ciclo de vida
- A superfície é redimensionada a cada quadro para seguir o tamanho exibido × densidade de pixels; ao mudar, os campos são recriados preservando o conteúdo (cópia escalada).
- Laço de animação contínuo enquanto montado. Ao desmontar, cancela o laço e remove os ouvintes.
- Trocar parâmetros exige remontar (a demo remonta a cada mudança).

## Técnica de renderização em alto nível
WebGL (preferir WebGL2, com fallback para WebGL1 + extensões de meia-precisão). Simulação de **fluidos estáveis** de Navier–Stokes em GPU (método de Jos Stam), inteiramente em texturas de ponto flutuante de meia precisão com *ping-pong* entre pares de alvos de renderização: campos de velocidade (2 canais), pressão, divergência e rotacional (1 canal) e tinta (RGBA). Cada etapa é um shader de tela cheia que lê os 4 vizinhos (esquerda, direita, cima, baixo) por diferenças finitas. Etapa final: exibição da tinta com conversão de cor para alfa (máximo dos canais) e sombreamento por normal derivada do gradiente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Resolução da grade de velocidade (lado menor) | inteiro | 128 |
| Resolução da tinta (lado menor) | inteiro | 1440 |
| Dissipação da tinta | número (por s) | 3,5 |
| Dissipação da velocidade | número (por s) | 2 |
| Fator de reaproveitamento da pressão | número 0–1 | 0,1 |
| Iterações do solucionador de pressão | inteiro | 20 |
| Intensidade dos redemoinhos (vorticidade) | número | 3 |
| Raio do respingo | número | 0,2 |
| Força do respingo | número | 6000 |
| Sombreamento | booleano | verdadeiro |
| Velocidade de troca de cor (trocas por segundo) | número | 10 |
| Modo arco-íris | booleano | verdadeiro |
| Cor única (quando arco-íris desligado) | cor hex | `#ff0000` |

## Demo
- A camada de fluido cobre a **página inteira** (é fixa na viewport), não só a área de prévia.
- Área de prévia: caixa flex em coluna, centralizada, **altura mínima de 300 px**, sem padding, overflow oculto, fundo escuro do site, com o texto **"Move Your Cursor"** (3rem, peso 600, centralizado, sem seleção).
- Valores da demo: modo arco-íris **desligado**, cor **`#A855F7`** (roxo); demais como os padrões.
- Controles (cada mudança remonta o efeito): dissipação da tinta 0,5–10 (0,5); dissipação da velocidade 0,5–10 (0,5); pressão 0–1 (0,05); redemoinho 0–50 (1); raio 0,01–1 (0,01); força 1000–20000 (500); velocidade de troca de cor 1–30 (1); chaves de sombreamento e arco-íris; seletor de cor quando arco-íris desligado.

## Acessibilidade e responsividade
- Decorativo: `aria-hidden` na camada; nunca captura ponteiro nem foco.
- **Recomendação**: com `prefers-reduced-motion: reduce`, não montar a simulação (ou não reagir ao movimento).
- **Recomendação**: pausar o laço quando a aba estiver oculta e quando o fluido tiver se dissipado por completo (sem entrada recente), para economizar bateria.
- Ocupa sempre a viewport e se adapta a redimensionamentos e à densidade de pixels.

## Observações de fidelidade
- **Recomendação**: a referência expõe parâmetros que não têm efeito (resolução de captura, cor de fundo e transparência). Não implementá-los, ou implementar a cor de fundo opcional de verdade quando a transparência estiver desligada.
- **Recomendação**: usar eventos de ponteiro unificados em vez de mouse + toque separados; com vários dedos a referência mistura todos no mesmo ponteiro.
- **Recomendação**: a tela de 100vw inclui a barra de rolagem em desktops e pode causar rolagem horizontal; usar 100% da camada fixa.
- **Recomendação**: liberar texturas, *framebuffers* e programas e perder o contexto WebGL ao desmontar (a referência só para o laço, o que vaza contexto a cada remontagem da demo).
- No modo cor única, o temporizador de troca de cor só "sorteia" a mesma cor; é inofensivo.
