# Especificação: Raios laterais (side-rays)

## Propósito
Fundo decorativo animado: dois leques de raios de luz que parecem entrar por um dos cantos da área (por padrão o canto superior direito), cruzando a tela na diagonal. Os raios cintilam e deslizam lentamente, com brilho mais forte junto ao canto de origem e decaindo com a distância. Serve como pano de fundo para heróis e seções escuras.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto, sem fundo próprio e sem capturar eventos de ponteiro. A referência lhe dá camada de empilhamento 3 (ver Observações).
- **Superfície**: uma única superfície de desenho cobrindo 100% × 100% do contêiner, **transparente** onde não há luz (o fundo da página aparece por trás).
- **Fonte de luz virtual**: fica **fora da área visível**, deslocada além do canto escolhido: no caso padrão (superior direito), a 110% da largura na horizontal e meia altura acima do topo. Os outros cantos são obtidos espelhando a imagem horizontal e/ou verticalmente.
- **Dois leques de raios**, ambos irradiando da fonte virtual:
  - **Leque 1**: cor padrão **`#EAB308`** (âmbar/dourado). Raios finos e numerosos (frequência angular alta).
  - **Leque 2**: cor padrão **`#96c8ff`** (azul claro). Raios um pouco mais largos.
  - Cada leque tem uma direção de referência própria; as duas direções ficam simétricas em torno da diagonal de 45° (apontando para o canto oposto), separadas por um ângulo que cresce com o parâmetro de abertura (meia-abertura = abertura × 0,275 rad; com o padrão 2, cerca de ±31,5° em torno dos 45°).
- **Mistura**: o resultado é a soma ponderada dos dois leques, cada um multiplicado por 0,9: o leque 1 pesa (1 − mistura) e o leque 2 pesa a mistura. Padrão de mistura **0,75**, portanto predominantemente azul com veios dourados.
- **Brilho**: multiplicado por (intensidade × 0,4) dividido pela distância normalizada até a fonte (distância em pixels ÷ altura) elevada ao expoente de decaimento (padrão **1,6**). Perto do canto o brilho estoura para tons quase brancos; no lado oposto fica tênue.
- **Saturação**: depois do brilho, a cor é interpolada entre a sua luminância (pesos 0,299 / 0,587 / 0,114) e ela mesma pelo fator de saturação (padrão **1,5**, que extrapola e deixa as cores mais vivas; 0 = cinza).
- **Transparência**: a opacidade de cada pixel é o maior dos três canais de cor multiplicado pela opacidade global (padrão **1**). Assim, regiões escuras ficam transparentes e as claras, opacas.

## Comportamento
- **Animação contínua**: o tempo (em segundos) entra como fase das ondas que formam os raios. O leque 1 anima na velocidade configurada (padrão **2,5**); o leque 2 anima a **20%** dessa velocidade. O efeito visual é de raios que pulsam e "escorregam" lateralmente, como luz atravessando poeira.
- **Formação dos raios**: para cada pixel, mede-se o cosseno do ângulo entre a direção fonte→pixel e a direção de referência do leque. A força do leque é a soma de duas ondas senoidais desse cosseno com frequências altas e diferentes entre si (na faixa de ~18 a ~36), deslocadas pelo tempo, limitada a [0, 1]. Como o cosseno é constante ao longo de cada linha que sai da fonte, o resultado são listras radiais.
  - Base aproximada da força: entre 0,25 e 1 (componente constante 0,45 + 0,3 com oscilações de amplitude 0,15 e 0,2).
- **Atenuação radial adicional**: a força ainda é multiplicada por um fator que cai linearmente de 1 (na fonte) até 0,5 quando a distância à fonte chega a metade da largura, e fica em 0,5 a partir daí.
- **Inclinação**: as coordenadas do pixel podem ser giradas em torno da fonte por um ângulo em graus (padrão **0**; positivo gira no sentido horário). Isso gira o leque sem mover a fonte. A atenuação por distância de brilho não é afetada pela inclinação.
- **Canto de origem**: um de quatro valores (superior direito — padrão —, superior esquerdo, inferior direito, inferior esquerdo), implementado por espelhamento das coordenadas.
- **Visibilidade**: a referência só cria o contexto gráfico quando pelo menos 10% do contêiner está visível na viewport e o destrói completamente quando deixa de estar (recriando ao voltar). Há um atraso de ~10 ms antes da criação.
- **Redimensionamento**: a resolução acompanha o tamanho do contêiner × densidade de pixels (limitada a **2**). A referência só reage ao redimensionamento da janela.
- **Sem interação**: não responde a ponteiro, teclado ou rolagem.

## Técnica de renderização em alto nível
WebGL com um triângulo que cobre a tela e um shader de fragmento por pixel. Campo puramente analítico: coordenadas polares em torno de uma fonte fora da tela, ondas senoidais sobre o cosseno angular para gerar listras radiais, atenuação por lei de potência inversa da distância, ajuste de saturação por luminância e alfa derivado do canal mais brilhante. Uma biblioteca WebGL mínima (ou WebGL puro) é suficiente; não há texturas nem assets. Laço de animação por quadro atualizando apenas o tempo.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Velocidade da animação | número | 2,5 |
| Cor do leque 1 (raios finos) | string hex de 6 dígitos | `#EAB308` |
| Cor do leque 2 (raios largos) | string hex de 6 dígitos | `#96c8ff` |
| Intensidade (brilho global) | número | 2 |
| Abertura angular entre os dois leques | número | 2 |
| Canto de origem | `top-right` / `top-left` / `bottom-right` / `bottom-left` | `top-right` |
| Inclinação do leque | número (graus) | 0 |
| Saturação | número (0 = cinza, >1 intensifica) | 1,5 |
| Equilíbrio entre os leques (0 = só leque 1, 1 = só leque 2) | número 0–1 | 0,75 |
| Expoente de decaimento do brilho com a distância | número | 1,6 |
| Opacidade global | número 0–1 | 1 |
| Classe extra do contêiner | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site (o efeito é transparente).
- O componente ocupa toda a área com os valores padrão (luz entrando pelo canto superior direito).
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro no topo com logotipo genérico (SVG próprio) e links; no centro uma pílula **"New Background"**, o título **"Light cascading from the corner"** e dois botões (sólido e vidro). Nada disso captura ponteiro.
- Controles: cor 1 e cor 2 (seletores); canto de origem (lista); velocidade 0,1–5 (0,1); intensidade 0,1–3 (0,1); abertura 0,1–3 (0,1); inclinação −60 a 60 (1); saturação 0–2 (0,05); mistura 0–1 (0,01); decaimento 0,5–4 (0,1); opacidade 0–1 (0,05). Cada mudança remonta o componente.
- Como o efeito anima sozinho, não é necessária animação automática adicional.

## Acessibilidade e responsividade
- Decorativo: a superfície deve ficar oculta de leitores de tela e fora da ordem de foco; não captura ponteiro.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (renderizar um quadro estático) ou reduzir muito a velocidade.
- Responsivo: preenche qualquer proporção; a posição da fonte é relativa à largura/altura, e a atenuação usa a altura como escala.
- Recomendação: pausar o laço quando a aba estiver oculta.

## Observações de fidelidade
- Recomendação: a referência destrói e recria todo o contexto WebGL a cada mudança de qualquer parâmetro, e também quando sai e volta da viewport. Prefira criar uma vez e apenas atualizar os valores do shader; para visibilidade, apenas pausar/retomar o laço.
- Recomendação: usar observação de tamanho do contêiner (e não só da janela), para funcionar quando o pai muda de tamanho sem a janela mudar.
- A referência usa o relógio absoluto da página como tempo; usar o tempo desde a montagem é equivalente visualmente e mais previsível.
- A camada de empilhamento 3 do contêiner pode colocar o fundo **à frente** de conteúdo irmão sem camada definida. Recomendação: não forçar camada; deixar o consumidor decidir.
- Cores aceitas só em hex de 6 dígitos; formato inválido vira branco. Recomendação: aceitar também hex de 3 dígitos e rgb().
- A saída não é pré-multiplicada e os canais podem passar de 1 perto da fonte (são saturados pelo hardware); manter esse "estouro" para tons claros perto do canto, pois faz parte do visual.
