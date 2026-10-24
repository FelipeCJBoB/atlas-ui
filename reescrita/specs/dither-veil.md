# Especificação: Véu pontilhado (dither-veil)

## Propósito
Mostra uma imagem "escondida" sob um véu de pontilhado (dithering) de duas cores, no estilo de impressão 1-bit. Onde o ponteiro passa, abre-se uma janela circular que revela a imagem original em cores; o rastro deixado pelo ponteiro se fecha de novo aos poucos, voltando a virar pontilhado. Um clique dispara uma onda circular de revelação que atravessa a área inteira. É um efeito de fundo/hero decorativo e interativo.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% de largura e 100% de altura do pai, overflow oculto. Permite rolagem vertical por toque (gesto vertical continua rolando a página), mas captura o resto dos gestos de ponteiro.
- **Superfície de desenho**: ocupa todo o contêiner em bloco, opaca (sem transparência), sem antisserrilhado, resolução limitada a no máximo 2× o *device pixel ratio*.
- **Estado de repouso (véu)**: a imagem é convertida em uma grade de células quadradas (padrão **2 px CSS** de lado, multiplicado pelo DPR e arredondado). Cada célula assume uma de N tonalidades entre a **cor de tinta** (tom mais escuro, padrão **`#120f17`**, quase preto arroxeado) e a **cor de papel** (tom mais claro, padrão **`#f4f1ea`**, creme). Com 2 níveis (padrão), cada célula é só tinta ou só papel.
- **Enquadramento da imagem**: modo "conter" (padrão) — a imagem inteira aparece centralizada e o que sobra fica preenchido; ou modo "cobrir" — a imagem é recortada para preencher tudo. No modo conter, as margens fora da imagem mostram a cor de tinta, exceto quando a borda da imagem é "lisa" (ver Comportamento), caso em que as margens assumem a cor de fundo detectada da imagem, de modo que a imagem parece se fundir com o fundo.
- **Janela revelada**: dentro da área revelada aparece a foto original em cores reais (sem pontilhado), com a mesma geometria de enquadramento.
- **Borda da revelação**: a transição entre véu e foto não é um degradê suave; ela se dissolve célula a célula usando uma matriz de ordenação de Bayer 8×8 (cada célula tem um limiar próprio), produzindo uma borda "pixelada" granulada. Opcionalmente, uma faixa de células nessa borda é pintada com uma **cor de aro** (padrão **`#a78bfa`**, lilás), com espessura configurável (padrão **0**, desligado; máximo efetivo 0,95).
- **Imagem padrão**: a referência carrega uma foto remota. **Não usar arquivo externo**: na reimplementação, gerar proceduralmente uma imagem de exemplo rica em tons (por exemplo, um retrato abstrato ou paisagem feita com gradientes radiais e lineares sobre fundo liso, desenhada num canvas fora da tela), já que a rede em runtime não está disponível.

## Comportamento

### Pontilhado (padrões disponíveis)
1. **Bayer ordenado**: limiar por célula a partir de uma matriz de Bayer 8×8 (valores 0–63 normalizados com meio passo). Visual de "trama cruzada" regular.
2. **Ruído azul**: limiar lido de uma textura 64×64 de ruído azul gerada uma única vez na inicialização pelo método de *void-and-cluster* (núcleo gaussiano de raio 6 com variância ≈ 2,25, semente inicial de 10% dos pixels com gerador pseudoaleatório determinístico). Visual de pontilhado estocástico uniforme.
3. **Linhas de gravura**: limiar em forma de onda triangular ao longo das diagonais (período de 6 células), levemente perturbado pela matriz de Bayer. Visual de hachura diagonal de gravura.
4. **Atkinson** e 5. **Floyd–Steinberg** (padrão = Floyd–Steinberg): difusão de erro clássica, calculada na CPU. A imagem é amostrada em uma grade de colunas × linhas igual ao número de células, com suavização de alta qualidade; cada linha é varrida em serpentina (alternando a direção); o erro de quantização é distribuído para os vizinhos com os pesos clássicos de cada algoritmo (Atkinson: seis vizinhos com 1/8 cada, descartando propositalmente os 2/8 restantes; Floyd–Steinberg: 7/16, 3/16, 5/16, 1/16). O resultado vira uma textura e só é recalculado quando mudam padrão, níveis, paleta, contraste, brilho, enquadramento ou o tamanho da grade. Se a imagem não puder ser lida pela CPU (bloqueio de origem), cai silenciosamente para Bayer.

### Tom antes do pontilhado
- Paleta **duotom** (padrão): converte a cor em luminância (pesos Rec. 709: 0,2126 / 0,7152 / 0,0722).
- Paleta **RGB**: pontilha cada canal separadamente (visual retrô colorido); nesse caso o resultado de cada canal é misturado entre tinta e papel por canal.
- Ajuste de tom: valor centrado em 0,5, multiplicado pelo **contraste** (padrão **1,15**), somado ao **brilho** (padrão **0**), saturado em 0–1 e elevado à potência **1,6** (escurece médios).
- Quantização em N **níveis** (padrão 2, mínimo 2): o valor é escalado para N−1 passos e arredondado para cima ou para baixo conforme o limiar da célula.
- Nos padrões ordenados, a imagem é amostrada no centro de cada célula com nível de mipmap proporcional ao tamanho da célula, para evitar serrilhado.

### Detecção de fundo liso
Ao carregar a imagem, mede-se a cor média e o desvio padrão dos pixels da borda de uma miniatura 32×32. Se o desvio médio for menor que **0,06**, a imagem é considerada de "fundo liso": as margens e também os pixels da foto revelada muito próximos dessa cor de borda (transição suave entre distância de cor 0,05 e 0,22) passam a usar o fundo tonalizado, criando a ilusão de recorte.

### Pincel de revelação (rastro)
- Mantém uma **máscara de rastro** em meia resolução (50% da largura e altura em px CSS), em ping-pong entre dois alvos de renderização; usa ponto flutuante de meia precisão se disponível, senão 8 bits.
- O pincel segue o ponteiro com suavização exponencial (constante de tempo **35 ms**). Ao entrar no contêiner, o pincel salta direto para o ponteiro (sem arrastar desde a posição antiga).
- A cada quadro, desenha-se na máscara o **segmento** entre a posição anterior e a atual do pincel (distância a um segmento de reta, para não deixar falhas em movimentos rápidos): intensidade 1 dentro do raio, caindo linearmente numa faixa de largura = max(raio × suavidade, 1) × 1,6 até 0 na borda.
- **Raio**: padrão **200 px**, modulado pela "presença": raio efetivo = raio × (0,45 + 0,55 × presença). A presença tende a 1 quando o ponteiro está dentro (ou no modo vagar) e a 0 fora, com suavização exponencial de constante **160 ms**. Assim a janela cresce ao entrar e encolhe ao sair.
- **Suavidade** (padrão **0,6**, de 0 = corte duro a 1): largura da faixa dissolvida da borda.
- **Persistência do rastro** (padrão **1 s**): a cada quadro a máscara perde dt / persistência de intensidade; 0 desliga o rastro (só a janela atual). Sem ponto flutuante, perda mínima de 1,5/255 por quadro.
- A máscara é lida multiplicada por **1,6** e saturada, de modo que o miolo fica totalmente revelado mesmo enquanto esmaece.
- **Modo invertido** (padrão desligado): começa tudo em cores e o ponteiro aplica o pontilhado onde passa.

### Onda de clique
- Ativada por padrão. Ao pressionar (botão primário do mouse, ou qualquer toque/caneta), cria uma onda centrada no ponto. No máximo **4** ondas simultâneas (a mais antiga é descartada).
- Duração **1,2 s**. O raio do anel cresce de 0 até a distância ao canto mais distante + largura do anel, com easing senoidal de saída (seno de k·π/2). A intensidade cai como 1 − k³.
- Largura do anel = max(60 px, raio × 0,9); a borda externa é mais nítida (35% da largura) e a interna é mais longa, dando aspecto de frente de onda.
- A onda revela (ou, no modo invertido, pontilha) por onde passa, com a mesma dissolução por Bayer.

### Modo vagar (opcional, padrão desligado)
Com o ponteiro fora, o pincel se desloca sozinho por uma trajetória tipo Lissajous (soma de duas senoides em cada eixo, cobrindo cerca de ±41% da largura e ±35% da altura em torno do centro). A transição do ponteiro para a trajetória leva 1,2 s com interpolação *smoothstep*. Desativado se o usuário preferir movimento reduzido.

### Introdução
Quando a imagem carrega, o véu "aparece" do centro para as bordas em **1,1 s** (easing quadrático de saída): cada célula surge quando o progresso ultrapassa 72% da sua distância normalizada ao centro (corrigida pelo aspecto) somados a 28% de um limiar Bayer, criando um crescimento radial granulado. Antes disso, tudo fica na cor de tinta.

### Laço de animação e desempenho
- O laço só roda enquanto há atividade: ponteiro dentro, modo vagar, presença acima de 0,002, ondas ativas, rastro ainda esmaecendo (persistência + 150 ms) ou introdução em curso. Caso contrário, para e é reacordado por eventos (ponteiro, redimensionamento, troca de parâmetros, visibilidade).
- Pausa quando o contêiner sai da viewport (observador de interseção).
- Passo de tempo limitado a 50 ms por quadro.
- Trocar a imagem recria tudo; trocar os demais parâmetros vale no quadro seguinte sem reiniciar.

## Técnica de renderização em alto nível
WebGL (preferencialmente WebGL2) com um triângulo de tela cheia e dois programas de fragmento:
1. **Passo de máscara**: acumula o rastro (campo de distância a segmento + decaimento temporal) em textura ping-pong.
2. **Passo de visualização**: para cada pixel, encontra a célula, calcula o tom pontilhado (limiar ordenado, ruído azul, gravura, ou textura de difusão pré-calculada), combina com a foto original conforme a máscara e as ondas (anel definido por distância radial), aplica a borda dissolvida por Bayer, o aro colorido e a máscara de introdução.
A difusão de erro e a textura de ruído azul são geradas em JavaScript na CPU e enviadas como texturas de amostragem por vizinho mais próximo. A foto usa mipmaps e filtragem trilinear.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Imagem a velar (URL com CORS ou imagem gerada) | string | foto de exemplo (gerar procedural) |
| Enquadramento | `conter` / `cobrir` | conter |
| Padrão de pontilhado | Bayer / ruído azul / Atkinson / Floyd–Steinberg / linhas | Floyd–Steinberg |
| Paleta | duotom / RGB | duotom |
| Tamanho da célula | número (px) | 2 |
| Tons por canal | inteiro ≥ 2 | 2 |
| Cor de tinta (tom escuro) | cor hex | `#120f17` |
| Cor de papel (tom claro) | cor hex | `#f4f1ea` |
| Contraste antes do pontilhado | número | 1,15 |
| Brilho antes do pontilhado | número | 0 |
| Raio da janela de revelação | número (px) | 200 |
| Suavidade da borda | 0–1 | 0,6 |
| Persistência do rastro | número (s) | 1 |
| Cor do aro | cor hex | `#a78bfa` |
| Espessura do aro | 0–0,95 | 0 |
| Inverter (começa em cores, ponteiro pontilha) | booleano | falso |
| Vagar sozinho quando o ponteiro está fora | booleano | falso |
| Onda ao clicar | booleano | verdadeiro |
| Classe e estilo extras do contêiner | string / objeto | vazio |

## Demo
- Área de prévia com **600 px de altura**, largura total, sem padding, overflow oculto.
- O componente preenche a área com os padrões acima e a imagem de exemplo (gerada procedural, ver Aparência).
- Cores por tema: no tema **escuro** usam-se os padrões (tinta `#120f17`, papel `#f4f1ea`, aro `#a78bfa`). No tema **claro**, quando ainda nos padrões, a demo troca para tinta **`#ffffff`**, papel **`#18181b`** e aro **`#7c3aed`**.
- Botão de recarregar no canto que remonta o componente.
- Controles: três seletores de cor (tinta, papel, aro); seletores de enquadramento, padrão e paleta; faixas de tamanho da célula 1–10 (passo 1), níveis 2–6 (1), contraste 0,5–2 (0,05), brilho −0,4–0,4 (0,02), raio 40–300 (5), suavidade 0–1 (0,05), persistência 0–4 s (0,1), aro 0–0,6 (0,02); interruptores de inverter, vagar e onda.

## Acessibilidade e responsividade
- Puramente decorativo: a superfície deve ser oculta de leitores de tela; se a imagem for significativa, fornecer texto alternativo em outro lugar (recomendação).
- Respeita `prefers-reduced-motion` desligando o modo vagar; recomenda-se também encurtar a introdução e as ondas.
- Acompanha qualquer tamanho via observador de redimensionamento (máscara e grade recalculadas).
- Toque: arrastar o dedo revela; rolagem vertical continua permitida.

## Observações de fidelidade
- Recomendação: a referência carrega a imagem de um servidor externo; aqui a imagem deve ser procedural/local (sem rede).
- Recomendação: liberar recursos de GPU (texturas, alvos) explicitamente ao desmontar; a referência só força perda de contexto.
- Recomendação: no tema claro a demo inverte tinta e papel — manter como na referência, mas documentado.
- Se a leitura de pixels falhar, o fallback para Bayer é silencioso; aceitável manter.
