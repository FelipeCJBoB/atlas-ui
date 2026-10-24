# Especificação: Revelação em retícula (halftone-reveal)

## Propósito
Mostra uma imagem impressa em **retícula** (meio-tom de jornal/gibi: pontos de tinta cujo tamanho varia com o tom) e, sob o ponteiro, uma **lupa circular** que revela a foto original nítida e em cores, com leve distorção de lente e aberração cromática na borda. Uso decorativo/interativo em heros e galerias.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, overflow oculto, cantos arredondados com raio padrão **16 px**, cursor em **cruz** (mira). Desativa gestos de toque padrão (o toque é capturado).
- **Superfície**: opaca, em bloco, 100% × 100%, antisserrilhada, até 2× DPR. Fundo de limpeza preto.
- **Enquadramento da imagem**: modo "cobrir" (preenche tudo, centralizada, cortando o excesso).
- **Retícula** (fora da lupa):
  - grade de células quadradas com **71** células por altura do contêiner (densidade; a largura acompanha a proporção), girada em **45°** (ângulo de tela);
  - cada célula amostra a cor da imagem no seu centro e desenha uma forma de tinta centrada, cujo "raio" = √(quantidade de tinta) × 0,72 × tamanho do ponto (padrão **1**) — a raiz quadrada faz a área do ponto ser proporcional à tinta;
  - bordas do ponto antisserrilhadas com largura ≈ 0,6 × variação de 1 pixel de tela;
  - **formas de ponto**: círculo (padrão), quadrado, losango, ou linha (faixas paralelas, gravura);
  - antes da retícula, a cor passa por **contraste** (centrado em 0,5, padrão **1,15**) e inversão opcional (padrão desligada);
  - tom = luminância (pesos 0,299 / 0,587 / 0,114); tinta = 1 − tom.
- **Modos de cor**:
  1. **Mono** (padrão): pontos na **cor de tinta** (padrão **`#141414`**, quase preto) sobre a **cor de papel** (padrão **`#fff7e6`**, creme).
  2. **Duotom**: duas telas sobrepostas — uma segunda tinta derivada (canais da tinta rotacionados e misturados 70% com um vermelho ≈ (0,90; 0,24; 0,30); com a tinta padrão resulta ≈ `#A6313B`) em ângulo +38°, tamanho 0,92, tinta com curva de potência 1,4 e opacidade 85%; por cima, a tinta principal no ângulo base.
  3. **Cor (CMYK)**: quatro telas como numa impressão em quadricromia — ciano a +15°, magenta a +75°, amarelo a 0° (todas com tamanho 0,82), preto a +45° (tamanho 0,78). Ciano/magenta/amarelo vêm do complemento dos canais vermelho/verde/azul; remove-se 50% do componente cinza comum (substituição de cinza) e o preto é o máximo entre esse cinza e 0,9 × (1 − luminância)². As tintas são aplicadas multiplicativamente sobre o papel: ciano ≈ (0,10; 0,72; 0,90), magenta ≈ (0,92; 0,10; 0,52), amarelo ≈ (0,98; 0,86; 0,10), preto ≈ 8% de cinza.
- **Lupa** (dentro do raio de revelação): a foto original em cores reais (com o mesmo contraste/inversão aplicados), com:
  - **distorção de lente**: perto da borda da lupa, a imagem é puxada em direção ao centro proporcionalmente a t⁴ (t = distância normalizada pelo raio), deslocamento máximo de 22% do raio — efeito de lente de aumento abaulada;
  - **aberração cromática**: os canais vermelho e azul são amostrados com deslocamentos opostos de até 0,0045 (em unidades da altura) × t⁴, criando franjas coloridas na borda;
  - **borda**: transição suave cuja largura = raio × (1 − nitidez) × 0,45 (nitidez padrão **0,8** → borda bem definida), com mínimo de ~1,4 px.

## Comportamento
- **Coordenadas**: espaço normalizado em que a altura do contêiner mede 1 e a largura mede a proporção; o raio da lupa (padrão **0,4**) é medido nessa unidade (40% da altura).
- **Seguimento**: a lupa segue o ponteiro com suavização exponencial cuja constante de tempo é o parâmetro de seguimento (padrão **0,37 s**). Passo de quadro limitado a 1–50 ms.
- **Atividade**: ao entrar/mover, o alvo de atividade vai a 1; ao sair, a 0; a atividade real persegue o alvo com constante de **180 ms**. O raio efetivo = raio × (0,4 + 0,6 × atividade), e a opacidade da lupa = atividade — assim a lupa cresce e aparece ao entrar, encolhe e some ao sair.
- **Gatilhos**: "pairar" (padrão, como acima); "sempre" (lupa sempre ativa com raio cheio, começando no centro e seguindo o ponteiro); "desligado" (nunca revela).
- **Revelação ociosa** (padrão **0**): mistura mínima da foto sobre a retícula em toda a área (0 = retícula pura; 1 = foto inteira).
- **Movimento reduzido**: a lupa por ponteiro não ativa (fica só a retícula, ou a revelação ociosa).
- **Atualização**: todos os parâmetros visuais valem imediatamente; trocar a imagem recria tudo. Antes de a imagem carregar, a área aparece como retícula densa de tinta sobre papel (imagem vazia = escura).
- **Redimensionamento**: observado continuamente.
- Laço de animação contínuo.

## Técnica de renderização em alto nível
WebGL2 com triângulo de tela cheia e um shader de fragmento: rotação de coordenadas para cada tela, célula via parte inteira/fracionária, amostragem da textura no centro da célula (desfazendo a rotação), função de distância da forma (euclidiana, Chebyshev, Manhattan ou distância a uma linha), cobertura por *smoothstep* com largura derivada de derivadas de tela; mistura com a foto por máscara circular, com distorção radial e separação de canais.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Imagem | URL / data URI | foto de exemplo (gerar procedural) |
| Cor da tinta | hex de 6 dígitos | `#141414` |
| Cor do papel | hex de 6 dígitos | `#fff7e6` |
| Modo | mono / duotom / cor CMYK | mono |
| Tamanho relativo do ponto | número | 1 |
| Densidade (células por altura) | número | 71 |
| Ângulo da tela | graus | 45 |
| Forma do ponto | círculo / quadrado / losango / linha | círculo |
| Contraste | número | 1,15 |
| Inverter tons | booleano | falso |
| Raio da lupa (fração da altura) | número | 0,4 |
| Nitidez da borda da lupa | 0–1 | 0,8 |
| Constante de seguimento | segundos | 0,37 |
| Revelação ociosa | 0–1 | 0 |
| Gatilho | pairar / sempre / desligado | pairar |
| Raio dos cantos do contêiner | medida CSS | `16px` |
| Classe e estilo extras | — | vazio |

## Demo
- Área de prévia com **500 px de altura**, sem padding, overflow oculto; botão de recarregar no canto.
- O componente ocupa a área com todos os padrões. A referência usa uma foto aleatória de banco (1200 × 800) — **não usar**: gerar proceduralmente uma imagem rica em tons e cores, por exemplo uma cena com céu em degradê, sol, colinas em camadas coloridas e alguns objetos em primeiro plano, ou um retrato abstrato com formas suaves, desenhada num canvas fora da tela (proporção 3:2).
- Controles: cor de tinta; cor de papel; modo; forma do ponto; densidade 30–180 (1); tamanho 0,4–1,6 (0,01); ângulo 0–90° (1); contraste 0,6–2 (0,01); inverter; raio 0,05–0,6 (0,01); borda 0–1 (0,01); seguimento 0,02–0,4 s (0,01); revelação ociosa 0–1 (0,01); gatilho.
- Para a captura com cursor parado no centro, a lupa deve aparecer centralizada (o evento de entrada já ativa).

## Acessibilidade e responsividade
- Se a imagem for informativa, o contêiner deve ter papel de imagem e texto alternativo (recomendação; a referência não fornece).
- Respeita `prefers-reduced-motion` desativando a lupa por ponteiro.
- Em toque, arrastar o dedo move a lupa (a página não rola sobre o componente).
- Acompanha qualquer tamanho; a densidade é relativa à altura, então o tamanho dos pontos em px escala com o contêiner.

## Observações de fidelidade
- Recomendação: pausar o laço quando ocioso (atividade em 0 e lupa parada) e quando fora da viewport.
- Recomendação: mostrar a cor de papel (não uma retícula escura) enquanto a imagem não carrega.
- Recomendação: aceitar cores hex de 3 dígitos (a referência cai para preto).
- A foto remota da referência foi substituída por imagem procedural (sem rede).
