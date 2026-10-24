# Especificação: Linhas flutuantes (floating-lines)

## Propósito
Fundo animado de tela cheia formado por feixes de linhas finas e luminosas que ondulam lentamente como fios de neon sobre preto. São três "camadas" de ondas (superior, do meio e inferior), cada uma com várias linhas paralelas levemente defasadas. As linhas se curvam na direção do ponteiro quando ele passa por perto e o conjunto todo desliza levemente em paralaxe. Serve como fundo decorativo de seções hero.

## Aparência
- **Contêiner**: bloco com 100% de largura e altura do pai, posicionamento relativo e overflow oculto. A superfície de desenho ocupa 100% × 100% dele.
- **Fundo**: preto opaco (`#000000`). Por padrão o contêiner usa modo de mesclagem **screen** sobre o que estiver atrás, de modo que o preto "desaparece" e só as linhas luminosas somam luz ao conteúdo de baixo.
- **Linhas**: traços finos com núcleo brilhante e halo suave que decai com o inverso da distância (perfil tipo "neon": muito intenso no centro, cauda longa). Sobre o halo existe um véu constante muito fraco por linha, o que dá um leve brilho difuso à área inteira quando há muitas linhas.
- **Sistema de coordenadas do desenho**: origem no centro, eixo vertical de −1 (topo) a +1 (base), eixo horizontal de −aspecto a +aspecto. Todas as medidas abaixo estão nessas unidades.
- **Três camadas**, somadas (mistura aditiva):
  - **Inferior**: peso de intensidade **0,2**; posição padrão: deslocamento horizontal **2,0**, vertical **−0,7**, torção **−1**.
  - **Do meio**: peso **1,0** (é a camada dominante); posição padrão: horizontal **5,0**, vertical **0,0**, torção **0,2**.
  - **Superior**: peso **0,1**; espelhada horizontalmente; posição padrão: horizontal **10,0**, vertical **0,5**, torção **−0,4**.
- **Cor das linhas**:
  - Se for fornecida uma lista de cores (até **8**), cada linha da camada recebe uma cor interpolada linearmente ao longo da lista conforme o seu índice (primeira linha = primeira cor, última linha = última cor). A cor é multiplicada por **0,5** antes da soma.
  - Sem lista, a cor vem de um "campo de fundo" espacial que as linhas apenas revelam (o fundo em si não é pintado): uma faixa **azul `#2F4BA2`** ao redor de uma curva senoidal suave que atravessa a tela um pouco acima do centro, e uma faixa **rosa `#E947F5`** paralela 0,8 unidade abaixo dela. Cada faixa se dissolve em preto ao longo de 1 unidade de distância e o resultado é multiplicado por 0,5. Assim, uma mesma linha muda de azul para rosa conforme atravessa a tela.
- **Modo claro** (opcional): em vez de luz sobre preto, a imagem vira "tinta sobre branco". A intensidade total de cada pixel define uma cobertura (transição suave entre intensidade ≈ 0,018 e 0,5). A cor da tinta é a cromaticidade normalizada da luz, com contraste reforçado (expoente ≈ 1,35) e escurecida para ≈ 82% onde a cobertura é alta. O pixel final mistura branco e tinta com até **94%** de cobertura. Neste modo a mesclagem do contêiner volta a ser normal.

## Comportamento
- **Animação contínua** baseada no tempo decorrido em segundos, multiplicado pela velocidade (padrão **1**).
- **Forma de cada linha**: uma senoide horizontal. Para a linha i de uma camada:
  - fase própria = valor-base da camada + incremento por linha (inferior: 1,5 + 0,2·i; meio: 2,0 + 0,15·i; superior: 1,0 + 0,2·i);
  - deslocamento vertical da curva = seno(x + fase + 0,1·t) × amplitude;
  - amplitude que "respira" no tempo = seno(fase + 0,2·t) × 0,3. As linhas, portanto, deslizam lateralmente devagar e alternam entre quase retas e onduladas, cada uma em ritmo ligeiramente diferente.
- **Espaçamento entre linhas**: cada linha i é deslocada horizontalmente por i × espaçamento, o que, numa senoide, produz um leque de curvas defasadas. O valor do espaçamento informado pelo usuário é multiplicado por **0,01** internamente (um valor 5 vira 0,05 unidade).
- **Torção (rotação dependente do raio)**: antes de avaliar a onda, as coordenadas de cada camada são giradas por um ângulo proporcional ao **logaritmo da distância ao centro** (ângulo = torção × ln(1 + raio)). Isso curva as linhas num leve redemoinho: quase retas perto do centro, mais inclinadas nas bordas.
- **Curvatura pelo ponteiro** (quando interativo):
  - Em torno do ponteiro há uma influência gaussiana: exp(−d² × raio de curvatura), onde d é a distância no espaço de desenho. Raio de curvatura padrão **5** (valores maiores = área menor).
  - A curva de cada linha é deslocada verticalmente por (y do ponteiro − y do pixel) × influência × força × fator de presença. Força padrão **−0,5** (negativo empurra as linhas para longe do ponteiro; positivo as atrai).
  - O **fator de presença** vai a 1 quando o ponteiro se move sobre a superfície e a 0 quando sai; a posição do ponteiro e o fator são suavizados por interpolação exponencial por quadro com fator **0,05** (padrão). Posição inicial do ponteiro: bem fora da tela.
- **Paralaxe** (padrão ligada): a posição do ponteiro relativa ao centro, normalizada por largura e altura (−0,5 a 0,5), multiplicada pela força de paralaxe (padrão **0,2**), desloca toda a imagem. O deslocamento também é suavizado com o mesmo fator 0,05. O eixo vertical é invertido para que o movimento acompanhe o cursor. Ao sair do componente, o deslocamento de paralaxe **permanece** no último valor (não volta ao centro).
- **Quantidade de linhas por camada**: um número único vale para todas as camadas; uma lista é lida na ordem das camadas habilitadas. Valor ausente na lista → 6 linhas e espaçamento 0,1 (antes da escala).
- **Camadas habilitadas**: qualquer subconjunto de {superior, meio, inferior}. Camada desabilitada não desenha nada.
- **Redimensionamento**: observado continuamente; a resolução interna acompanha o contêiner × densidade de pixels (limitada a **2**).
- **Mudança de qualquer parâmetro**: recria toda a cena.

## Técnica de renderização em alto nível
WebGL com um único retângulo de tela cheia e um shader de fragmento que, para cada pixel, soma a contribuição de todas as linhas de todas as camadas (laço por linha). A "linha" é um campo de distância vertical até uma curva senoidal, convertido em brilho por decaimento inverso (1/d), o que dá o aspecto de neon sem geometria. A rotação logarítmica, a gaussiana do ponteiro e o mapeamento para modo claro são operações por pixel. Um laço de quadro atualiza tempo, ponteiro suavizado e paralaxe. Antialiasing ligado; superfície sem transparência (preta), contando com a mesclagem CSS para sobrepor.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Lista de cores do gradiente das linhas (máx. 8, hex) | lista de strings | nenhuma (usa o campo azul/rosa) |
| Camadas habilitadas | subconjunto de superior/meio/inferior | as três |
| Linhas por camada | número ou lista | 6 |
| Espaçamento entre linhas (×0,01) | número ou lista | 5 |
| Posição da camada superior (x, y, torção) | objeto | 10 / 0,5 / −0,4 |
| Posição da camada do meio (x, y, torção) | objeto | 5 / 0 / 0,2 |
| Posição da camada inferior (x, y, torção) | objeto | 2 / −0,7 / −1 |
| Velocidade da animação | número | 1 |
| Reage ao ponteiro | booleano | sim |
| Concentração da área de curvatura (maior = área menor) | número | 5 |
| Força da curvatura (negativo repele, positivo atrai) | número | −0,5 |
| Suavização do ponteiro por quadro | número 0–1 | 0,05 |
| Paralaxe ligada | booleano | sim |
| Força da paralaxe | número | 0,2 |
| Modo de mesclagem CSS do contêiner | string | screen |
| Modo claro (tinta sobre branco) | booleano | não |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Valores da demo: três camadas, **8 linhas** por camada, espaçamento **8**, velocidade 1, interativo, raio de curvatura **8**, força de curvatura **−2**, gradiente de três cores **`#e945f5`** (magenta) → **`#6f6f6f`** → **`#6a6a6a`** (cinzas médios). Resultado: feixes magenta-acinzentados ondulando sobre preto.
- **Sobreposição de demonstração** (opcional; é conteúdo de vitrine comum às prévias de fundos, não faz parte do componente): sem captura de ponteiro, com
  - barra de navegação em vidro no topo (margem superior 20 px, largura 70% — 92% em telas estreitas —, altura 48 px, raio 14 px, fundo branco 3%, borda branca 8%, desfoque 18 px), com um logotipo genérico à esquerda e, à direita, "Features", "About" (13 px, branco 50%) e um botão "Sign up" (fundo branco, texto quase preto `#09090b`, 12 px, peso 600, raio 8 px);
  - no centro, uma pílula com selo "NEW" (fundo branco, texto escuro, 11 px, maiúsculas) seguido de "Creative Components" (12 px, branco 50%);
  - título **"Waves are cool! Even cooler with lines!"** em branco, peso 600, tamanho fluido entre 1,6 rem e 2,4 rem, entrelinha 1,1, espaçamento −0,03 em, largura máxima ~20 caracteres, sombra escura suave;
  - dois botões: "Get started" (sólido branco) e "Learn more" (vidro), 40 px de altura, raio 10 px;
  - um interruptor discreto no canto inferior direito ("Demo Content") que oculta essa sobreposição.
  - O logotipo deve ser um glifo genérico desenhado em SVG próprio; não usar marca de terceiros.
- Controles: interruptores para cada camada; quantidade de linhas 1–20 (passo 1); espaçamento 1–100 (passo 0,5); velocidade 0,1–5 (0,1); interativo; raio de curvatura 1–30 (0,5); força −15 a 15 (0,5); três seletores de cor do gradiente.

## Acessibilidade e responsividade
- Puramente decorativo: a superfície deve ser oculta de leitores de tela e não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo (imagem estática) e desligar a paralaxe.
- Toque: sem movimento contínuo de ponteiro, a curvatura e a paralaxe só ocorrem durante o arraste; o fundo continua animando normalmente.
- Responsivo: preenche qualquer tamanho; a proporção é preservada porque a escala vertical é fixa (−1 a 1) e a horizontal se estende.

## Observações de fidelidade
- Recomendação: com os padrões de listas de um só elemento, apenas a primeira camada habilitada recebe o espaçamento informado; as demais caem para 0,1 × 0,01, e suas linhas quase se sobrepõem, parecendo uma linha só mais forte. Preferir aplicar o primeiro valor a todas as camadas quando a lista for mais curta.
- Recomendação: a cor de fundo configurável existe na referência mas não é usada no desenho. Ou implementá-la (pintar esse fundo sob as linhas) ou omiti-la.
- Recomendação: a suavização por quadro depende da taxa de quadros; prefira suavização baseada em tempo (equivalente a 0,05 por quadro a 60 Hz).
- Recomendação: a posição do ponteiro usada na curvatura não acompanha o deslocamento da paralaxe; corrigir para que a curvatura fique exatamente sob o cursor.
- Recomendação: as cores aceitam apenas hex; aceitar qualquer cor CSS é uma melhoria permitida.
- A demo não adapta o efeito ao tema claro do site; com mesclagem screen sobre fundo claro as linhas quase somem. Recomenda-se ativar o modo claro quando o tema for claro.
