# Especificação: Pilar de luz (light-pillar)

## Propósito
Fundo animado para seções de destaque (hero). Mostra uma coluna vertical de luz etérea, feita de filamentos luminosos retorcidos que sobem e giram lentamente em torno do próprio eixo, com um degradê de duas cores e um leve grão de filme. É puramente decorativo.

## Aparência
- **Contêiner**: bloco com posicionamento absoluto, colado no canto superior esquerdo do pai posicionado e cobrindo 100% × 100% dele. Aplica um modo de mesclagem CSS (`mix-blend-mode`) configurável, por padrão **`screen`**, para que o preto do efeito "desapareça" sobre fundos escuros.
- **Superfície**: um canvas WebGL que preenche o contêiner. Cada pixel é escrito com opacidade total: onde não há luz, o resultado é **preto puro**. Por isso o modo `screen` é essencial para a integração visual.
- **A coluna**:
  - fica centralizada na horizontal e ocupa toda a altura;
  - com os valores padrão, a largura visível é de cerca de 60% da altura do contêiner (um terço da meia-altura para cada lado do centro), com bordas que se dissolvem em brilho suave;
  - por dentro, é um emaranhado de "tubos" finos e ondulados de luz que se cruzam e se torcem, como fibras de fumaça incandescente, com núcleos mais brilhantes onde os filamentos se acumulam;
  - pode ser inclinada no plano da tela por um ângulo configurável (padrão 0°; a demo usa **25°**, girando a imagem no sentido anti-horário).
- **Cores**: degradê vertical entre um violeta **`#5227FF`** e um rosa **`#FF9FFC`**. Na imagem resultante, o **violeta domina a metade de baixo** e o **rosa domina a metade de cima**, com transição contínua pelo meio (ver Observações de fidelidade sobre os nomes).
- **Tonalização**: a luz acumulada passa por uma compressão suave do tipo tangente hiperbólica, então os núcleos saturam em tons claros sem estourar de forma dura.
- **Grão**: ruído fino por pixel que **escurece** levemente a imagem (subtrai até cerca de 1/15 do brilho × intensidade do grão, padrão 0,5). O padrão de grão é fixo por pixel, não animado.
- **Fallback sem WebGL**: um bloco absoluto 100% × 100% com fundo `rgba(0,0,0,0.1)` e o texto centralizado "WebGL not supported" em `#888`, 14 px.

## Comportamento
- **Relógio interno**: a cada quadro efetivamente desenhado, o tempo avança **0,016 × velocidade de rotação** (padrão 0,3). O avanço é por quadro, não por tempo real. A taxa de desenho é limitada a **60 qps** (ou **30 qps** na qualidade baixa).
- **Rotação automática**: o volume gira em torno do eixo vertical com ângulo = tempo × 0,3 (radianos). Com o padrão, isso dá uma volta completa a cada ~22 minutos de relógio interno, o que, na prática, é um giro bem lento e contínuo.
- **Subida dos filamentos**: o padrão interno se desloca ao longo do eixo vertical com o mesmo relógio, dando a sensação de fluxo contínuo. A compressão vertical do padrão é controlada por um fator de altura (padrão **0,4**: valores menores esticam os filamentos verticalmente).
- **Turbulência**: os filamentos são distorcidos por várias camadas de ondas cossenoidais (4 na qualidade alta), cada uma com o dobro da frequência e metade da amplitude da anterior, e com uma pequena rotação fixa de **0,4 rad** entre camadas. As camadas superiores também se movem com o tempo.
- **Interação opcional com o ponteiro** (desligada por padrão): quando ligada, a posição horizontal do ponteiro sobre o contêiner (−1 na borda esquerda, +1 na direita) define diretamente o ângulo de rotação (posição × 2π), substituindo a rotação automática. Sem suavização. Eventos de movimento são amostrados no máximo a cada ~16 ms. Enquanto o ponteiro nunca se moveu, vale a rotação automática.
- **Qualidade** (alta / média / baixa):
  - alta: 80 passos de amostragem por raio, 4 camadas de turbulência, densidade de pixels = DPR do aparelho (máx. 2), passo 1,0×;
  - média: 40 passos, 2 camadas, densidade 0,65, passo 1,2×;
  - baixa: 24 passos, 1 camada, densidade 0,5, passo 1,5×, 30 qps.
  - Rebaixamento automático: em celulares, sempre baixa. Em aparelhos com 4 núcleos lógicos ou menos, "alta" vira "média".
- **Atualização ao vivo**: cores, intensidade, brilho, largura, altura, grão, inclinação e o modo claro mudam sem recriar o contexto. Trocar a qualidade recria tudo.
- **Redimensionamento**: acompanha o tamanho do contêiner com debounce de **150 ms**.
- **Modo claro** (opcional, desligado por padrão): converte o resultado para uso sobre fundo branco. A luz vira "tinta": onde há energia, a cor normalizada (realçada por um expoente de ~1,25) é misturada sobre o branco com cobertura de até 94%, crescendo suavemente conforme a energia; onde não há luz, fica branco.

## Técnica de renderização em alto nível
WebGL em um único quad de tela cheia com câmera ortográfica. O shader de fragmento faz **ray marching volumétrico**: a partir de uma câmera virtual a 10 unidades do eixo, cada pixel lança um raio com abertura de ~90° e avança por no máximo 50 unidades. Em cada passo:
1. o ponto é girado em torno do eixo vertical (rotação automática ou ponteiro);
2. calcula-se um **campo de distância** de uma treliça periódica de tubos verticais infinitos (distância ao cosseno das coordenadas horizontais), deformada pela turbulência de cossenos em oitavas;
3. esse campo é intersectado de forma suave (máximo suavizado com raio 4) com um **cilindro limitador** cujo raio é a largura do pilar;
4. o inverso da distância, com um piso pequeno, é **acumulado como brilho**, tingido pelo degradê vertical da altura do ponto;
5. o passo seguinte avança proporcionalmente à distância.

No fim, o brilho acumulado é multiplicado pelo ganho de brilho (dividido pela largura relativa a 3), comprimido por tangente hiperbólica, escurecido pelo grão (hash pseudoaleatório da posição do pixel), multiplicado pela intensidade e limitado a [0, 1]. A inclinação do pilar é uma rotação 2D das coordenadas de tela antes de montar o raio.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor que domina a parte de baixo (nomeada "topo" no original) | cor hex | `#5227FF` |
| Cor que domina a parte de cima (nomeada "base" no original) | cor hex | `#FF9FFC` |
| Intensidade geral (multiplicador final) | número | 1,0 |
| Velocidade de rotação / fluxo | número | 0,3 |
| Rotação guiada pelo ponteiro | booleano | falso |
| Ganho de brilho antes da compressão | número | 0,005 |
| Largura (raio) do pilar, em unidades do mundo | número | 3,0 |
| Fator de compressão vertical do padrão | número | 0,4 |
| Intensidade do grão | número | 0,5 |
| Modo de mesclagem CSS do contêiner | string | `screen` |
| Inclinação do pilar no plano da tela | graus (0–360) | 0 |
| Qualidade | `low` / `medium` / `high` | `high` |
| Modo claro (tinta sobre branco) | booleano | falso |
| Classe extra do contêiner | string | vazia |

## Demo
- Área de prévia relativa com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores da demo: ganho de brilho **0,002** e inclinação **25°**. O restante fica no padrão. No tema claro do site, liga o modo claro.
- **Sobreposição de vitrine** (opcional; é conteúdo comum às prévias de fundos e não faz parte do componente). É uma camada sem captura de ponteiro com:
  - barra de navegação em vidro no topo: margem de 20 px, largura de 70% (92% em telas estreitas), altura de 48 px, raio de 14 px, fundo branco a 3%, borda branca a 8% e desfoque de 18 px. À esquerda, um glifo genérico em SVG próprio. À direita, "Features" e "About" (13 px, branco a 50%) e um botão "Sign up" (fundo branco, texto `#09090b`, 12 px, peso 600, raio de 8 px);
  - no centro, uma pílula com o selo "NEW" (fundo branco, texto escuro, 11 px) seguido de **"New Background"** (12 px, branco a 50%);
  - o título **"Ethereal light pillar for your hero sections."** em branco, peso 600, tamanho fluido de 1,6 a 2,4 rem, entrelinha 1,1;
  - dois botões de 40 px de altura e raio de 10 px: "Get started" (branco sólido) e "Learn more" (vidro).
- Controles: duas cores; intensidade de 0,1 a 3 (passo 0,1); velocidade de 0 a 2 (0,1); ganho de brilho de 0,001 a 0,02 (0,001); largura de 1 a 10 (0,1); altura de 0,1 a 2 (0,1); grão de 0 a 2 (0,1); inclinação de 0 a 360 (1); interruptor do ponteiro; seletor de mesclagem (normal, screen, darken, lighten, color-dodge, luminosity); seletor de qualidade.
- O efeito anima sozinho, sem precisar de ponteiro.

## Acessibilidade e responsividade
- Decorativo: o canvas deve ter `aria-hidden` e não receber foco. A camada não deve bloquear cliques no conteúdo acima (recomenda-se `pointer-events: none` quando a interação estiver desligada).
- **Recomendação**: com `prefers-reduced-motion`, congelar o relógio, mostrando um quadro estático.
- **Recomendação**: pausar o laço quando o contêiner estiver fora da viewport ou a aba oculta (a referência não faz isso).
- Responsivo: o pilar escala com a altura do contêiner. Em contêineres muito largos, sobra mais área preta nas laterais.

## Observações de fidelidade
- **Nomes de cor invertidos**: no original, a cor chamada "topo" aparece embaixo e vice-versa. Recomendação: nomear os parâmetros pelo resultado visual (cor de baixo / cor de cima), mantendo os mesmos valores padrão nas mesmas posições visuais.
- O relógio avança por quadro, então a velocidade percebida depende da taxa de quadros. Recomendação: usar o tempo real decorrido (equivalente a 0,016 × velocidade a cada 1/60 s).
- O redimensionamento só escuta a janela. Recomendação: observar o próprio contêiner (ResizeObserver).
- A tabela de propriedades da demo diz que a inclinação padrão é 0, mas a demo usa 25. Tratar 0 como padrão do componente e 25 como valor da demo.
- O grão é estático. Manter (não animar) para fidelidade.
