# Especificação: Distorção em grade (grid-distortion)

## Propósito
Exibe uma imagem de fundo que se "quebra" em blocos quadrados deslocados quando o ponteiro passa sobre ela: o movimento do cursor arrasta pedaços da imagem na direção do movimento, como um mosaico de pixels deslizando, e tudo volta ao lugar suavemente. Ao montar, a imagem começa embaralhada e se recompõe em cerca de um segundo. Uso: fundo de hero interativo com foto ou arte.

## Aparência
- **Contêiner**: bloco com 100% de largura e altura do pai, sem largura/altura mínimas, overflow oculto. A superfície de desenho é a única filha (qualquer conteúdo anterior é substituído) e tem fundo transparente.
- **Imagem**: preenche o contêiner inteiro, **esticada** para a proporção do contêiner (sem corte e sem barras). Filtragem linear e bordas "presas" (fora da imagem repete o pixel da borda).
- **Grade de deslocamento**: grade invisível de G × G células (padrão **15**) cobrindo o contêiner. Cada célula guarda um deslocamento 2D; todos os pixels da célula são deslocados pelo mesmo valor (amostragem por vizinho mais próximo), o que dá o aspecto de **blocos** nítidos com bordas duras entre eles. Quanto maior G, menores os blocos.
- O deslocamento aplicado à leitura da imagem é **0,02 × valor da célula** em coordenadas normalizadas (0–1), no sentido oposto ao valor.
- Sem cores próprias: a aparência é a da imagem fornecida. Antes de a imagem carregar, a área é transparente.

## Comportamento
- **Abertura embaralhada**: na montagem, cada célula recebe um deslocamento aleatório em cada eixo, uniforme entre ≈ −125 e +130 (ou seja, até ≈ ±2,5 da largura/altura da imagem). Como os deslocamentos decaem a cada quadro, a imagem aparece como um mosaico caótico que se reorganiza e assenta em ≈ 1 s (a 60 qps).
- **Relaxamento**: a cada quadro, todos os deslocamentos são multiplicados pelo fator de relaxamento (padrão **0,9**), voltando exponencialmente a zero.
- **Ponteiro**:
  - posição normalizada no contêiner (0–1, Y para cima); a velocidade é a diferença de posição entre dois eventos de movimento consecutivos;
  - a cada quadro, as células cujo centro está a menos de R = G × tamanho do pincel (padrão **0,1**; em células) do ponteiro recebem um acréscimo de deslocamento = força (padrão **0,15**) × 100 × velocidade × potência, em que potência = R ÷ distância, limitada a **10** (as células mais próximas do cursor são as mais empurradas). O eixo horizontal acompanha o movimento; no vertical o sinal é invertido para casar com a orientação da imagem.
  - Efeito visual: arrastar o cursor "puxa" os blocos sob ele na direção do movimento; parar devolve tudo ao lugar.
  - Ao sair do contêiner, posição e velocidade são zeradas.
- **Redimensionamento**: observado no contêiner; ajusta a superfície (densidade de pixels limitada a **2**) e a câmera ortográfica para que o plano cubra exatamente a área. Tamanho zero é ignorado.
- **Mudança de parâmetros** (grade, pincel, força, relaxamento, imagem): recria tudo, incluindo a abertura embaralhada.

## Técnica de renderização em alto nível
WebGL (cena 3D com câmera ortográfica) com um plano do tamanho da área, texturizado com a imagem. Uma **textura de dados G × G em ponto flutuante**, amostrada sem interpolação, guarda os deslocamentos; o shader de fragmento lê o deslocamento da célula e desloca a coordenada de leitura da imagem. Os deslocamentos são atualizados na CPU a cada quadro (decaimento + pincel do ponteiro) e reenviados à GPU. Alternativa equivalente aceitável: canvas 2D desenhando cada bloco da imagem com o deslocamento correspondente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Endereço da imagem | string (URL) | obrigatório |
| Número de células por lado | inteiro | 15 |
| Raio do pincel do ponteiro (fração da grade) | número | 0,1 |
| Força do arrasto | número | 0,15 |
| Relaxamento por quadro (0–1; maior = volta mais devagar) | número | 0,9 |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto.
- Valores da demo: grade **10**, pincel **0,25**, força 0,15, relaxamento 0,9 (blocos grandes e pincel amplo).
- **Imagem**: a referência usa uma fotografia externa. **Não usar arquivo nem URL externo**: gerar a imagem proceduralmente (por exemplo, canvas ou SVG convertido em imagem) com bastante detalhe e contraste para que os blocos deslocados sejam visíveis — sugestão: gradiente diagonal escuro de azul-noite para violeta, com algumas formas orgânicas desfocadas em rosa e laranja e uma textura fina de linhas ou pontos. Resolução sugerida ≈ 900 × 1200 px.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About" e "Sign up"; pílula "NEW · Creative Components"; título **"Don't just sit there, move your cursor!"** (peso 600, 1,6–2,4 rem, branco); botões "Get started" e "Learn more"; interruptor "Demo Content" no canto inferior direito. Sem captura de ponteiro.
- Controles: tamanho da grade 6–200 (1) e tamanho do pincel 0,1–0,5 (0,01); cada mudança remonta o componente.

## Acessibilidade e responsividade
- Se a imagem for de conteúdo, oferecer texto alternativo (por exemplo, rótulo acessível no contêiner com papel de imagem); se for decorativa, ocultá-la de leitores de tela.
- Recomendação: com `prefers-reduced-motion`, pular a abertura embaralhada (começar com deslocamentos zero) e reduzir ou desligar o arrasto.
- Toque: sem evento de movimento contínuo, não há distorção; recomendável reagir também a arraste por toque (eventos de ponteiro).

## Observações de fidelidade
- Recomendação: a referência estica a imagem para a proporção do contêiner; preferir enquadramento tipo "cobrir" (corte central mantendo a proporção da imagem). A referência até mede a proporção da imagem, mas não a usa.
- Recomendação: a velocidade do ponteiro não é zerada quando o cursor para; o último valor continua sendo somado a cada quadro, mantendo um deslocamento residual enquanto o cursor repousa. Zerar a velocidade após cada quadro (ou decaí-la) é a correção sugerida.
- Recomendação: relaxamento e incremento por quadro dependem da taxa de quadros; prefira formulação baseada em tempo (equivalente a 60 Hz).
- Recomendação: o centro de cada célula usado na distância está deslocado meia célula em relação ao centro visual; corrigir para que o pincel fique centrado no cursor.
- Recomendação: o tempo interno da referência é incrementado mas não é usado; pode ser omitido.
- Recomendação: tratar falha de carregamento da imagem (manter transparente e não quebrar).
