# Especificação: Fundo de tinta giratória (balatro)

## Propósito
Fundo animado de tela cheia que imita tinta líquida sendo mexida em redemoinho: três cores (vermelho, azul e um verde-petróleo quase preto) se torcem em espirais e veios ondulados, com uma leve pixelização que dá um ar "retrô de videogame". Puramente decorativo; reage de leve à posição horizontal do mouse.

## Aparência
- **Contêiner**: bloco com 100% da largura e 100% da altura do pai, sem borda, padding ou fundo próprios. A superfície de desenho é inserida dentro dele e ocupa o mesmo tamanho.
- **Superfície**: opaca. Antes do primeiro quadro é limpa em preto.
- **Paleta padrão**:
  - cor 1 (dominante, "tinta principal"): **`#DE443B`** (vermelho-coral);
  - cor 2 (veios secundários): **`#006BB4`** (azul médio);
  - cor 3 (preenchimento entre os veios): **`#162325`** (verde-petróleo muito escuro).
- **Aspecto geral**: grandes faixas curvas e enroladas que lembram mármore/tinta mexida. O vermelho forma as bandas largas mais brilhantes, o azul forma veios que contornam o vermelho, e o tom escuro preenche o resto. Nas cristas das bandas vermelha e azul há realces claros (como reflexo de luz na tinta).
- **Pixelização**: a imagem é quantizada em blocos quadrados cujo lado é a diagonal da superfície dividida pelo fator de pixelização (padrão **745**). Numa área de ~1000 × 500 px isso dá blocos de ~1,5 px — pixelização sutil; valores menores deixam os blocos grandes e evidentes.
- **Centro do redemoinho**: o centro geométrico da superfície (deslocável por um parâmetro de deslocamento 2D).

## Comportamento
- **Animação contínua**: o tempo (em segundos desde o início da página) alimenta o campo. A "velocidade de giro" padrão é **7**: ela multiplica o tempo que avança a fase das ondulações internas, de modo que os veios fluem e se reorganizam continuamente, sem nunca repetir de forma óbvia.
- **Torção (swirl)**: o ângulo de cada ponto em torno do centro recebe um acréscimo que depende do raio — pontos mais distantes giram mais/menos conforme a "quantidade de giro" (padrão **0,25**). Isso cria o aspecto de espiral. Há também um "fator de suavização do giro" (padrão **1,0**) que escala essa torção.
- **Rotação contínua opcional** (desligada por padrão): quando ligada, o ângulo de torção avança com o tempo a uma taxa = rotação base × fator de suavização × 0,2 rad/s (com os padrões, **−0,4 rad/s**, ou seja, gira devagar no sentido horário). Quando desligada, a rotação base (padrão **−2,0**) é só um deslocamento fixo de ângulo.
- **Mouse** (ligado por padrão): só a posição **horizontal** do ponteiro dentro do contêiner importa. Ela é normalizada em [0, 1] e convertida em influência em [−1, 1] (0 no centro). A influência:
  - soma até ±0,1 rad ao ângulo de torção;
  - soma até ±2 unidades à fase de tempo das ondulações.
  - O efeito é um leve "arrasto" da tinta conforme o mouse vai para a esquerda ou para a direita. Não há suavização: o valor muda instantaneamente a cada movimento. Ao sair do contêiner, o último valor é mantido. Antes de qualquer movimento, a influência é 0 (mouse considerado no centro).
- **Redimensionamento**: a resolução acompanha o tamanho do contêiner quando a janela é redimensionada.
- **Troca de parâmetros**: na referência, qualquer mudança recria toda a superfície e reinicia o efeito (o tempo, porém, é absoluto da página, então a animação não "volta ao início").

## Técnica de renderização em alto nível
WebGL com um único triângulo/quad de tela cheia e um shader de fragmento que calcula a cor de cada pixel. A ideia matemática:
1. **Quantização**: as coordenadas do pixel são arredondadas para a grade de blocos (pixelização) e centralizadas, normalizadas pela diagonal da tela.
2. **Torção polar**: converte para coordenadas polares em torno do centro, soma ao ângulo um termo que depende do raio (espiral) e do tempo/rotação, e volta a cartesianas.
3. **Ampliação**: multiplica as coordenadas por ~30 para que caibam várias "dobras" na tela.
4. **Distorção iterativa de domínio**: 5 iterações em que as coordenadas são somadas a combinações de senos e cossenos delas mesmas (com a fase de tempo entrando nos argumentos). Cada iteração dobra o espaço de novo, produzindo os veios turbulentos típicos de "tinta mexida".
5. **Mapeamento de cor**: o comprimento do vetor final, escalado e limitado a [0, 2], vira um valor de "tinta". Três pesos são derivados dele: a cor 1 domina quando o valor está perto de 1, a cor 2 quando está perto de 0, e a cor 3 preenche o restante (o que sobra até 1). O contraste (padrão **3,5**) estreita essas faixas. Uma fração fixa da cor 1 (0,3 ÷ contraste) é sempre misturada por baixo, como base.
6. **Realce**: onde os pesos das cores 1 e 2 estão muito perto do máximo, soma-se um brilho proporcional ao parâmetro de iluminação (padrão **0,4**; a cor 1 recebe iluminação − 0,2).

Cores aceitas em hex de 6 dígitos (opaco) ou 8 dígitos (com alfa; o alfa entra na mistura, mas a superfície é opaca).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Rotação base / deslocamento angular do giro | número | −2,0 |
| Velocidade de animação dos veios | número | 7,0 |
| Deslocamento do centro do redemoinho | par [x, y] (unidades normalizadas pela diagonal) | [0, 0] |
| Cor 1 (dominante) | hex | `#DE443B` |
| Cor 2 (veios) | hex | `#006BB4` |
| Cor 3 (preenchimento) | hex | `#162325` |
| Contraste das faixas | número | 3,5 |
| Intensidade dos realces | número | 0,4 |
| Quantidade de torção dependente do raio | número (0–1) | 0,25 |
| Fator de pixelização (maior = blocos menores) | número | 745 |
| Fator de suavização/escala do giro | número | 1,0 |
| Rotação contínua no tempo | booleano | falso |
| Reação ao mouse | booleano | verdadeiro |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding e overflow oculto; o componente preenche toda a área. Não há texto sobreposto.
- Valores: as três cores padrão, pixelização 745, mouse ligado, rotação desligada (demais parâmetros nos padrões).
- Controles: três seletores de cor (na ordem cor 1, cor 3, cor 2); faixa "Pixelation" de 0 a 2000 (passo 10); chave de interação com mouse; chave de rotação contínua.

## Acessibilidade e responsividade
- Decorativo: a superfície deve ficar oculta para leitores de tela e não deve receber foco.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (renderizar um quadro estático) ou reduzir muito a velocidade.
- Recomendação: pausar o laço de animação quando o componente estiver fora da tela ou a aba oculta.
- Ocupa qualquer tamanho do pai; o padrão escala com a diagonal, então mantém o aspecto em telas largas ou estreitas.

## Observações de fidelidade
- **Recomendação**: o fator de pixelização 0 (permitido pela faixa da demo) causa divisão por zero; tratar como "sem pixelização" ou impor mínimo de 1.
- **Recomendação**: a referência só reage ao redimensionamento da janela; usar observação de tamanho do próprio contêiner.
- **Recomendação**: a referência recria o contexto WebGL a cada mudança de parâmetro (e um par de deslocamento passado como literal recria a cada render). Preferir atualizar os valores do shader sem recriar.
- **Recomendação**: a referência não ajusta a resolução à densidade de pixels; pode-se usar DPR limitado a 2 sem mudar o aspecto, já que a pixelização é proporcional à diagonal.
- **Recomendação**: hex de 3 dígitos não é aceito na referência (vira preto); aceitar também a forma curta.
