# Especificação: Mira de cursor (crosshair)

## Propósito
Duas linhas finas, uma horizontal e uma vertical, atravessam a tela inteira (ou um contêiner) e seguem o ponteiro com um leve atraso, formando uma mira. Ao passar sobre um link, as linhas se "estilhaçam" num ruído deslocado e voltam a ficar retas em meio segundo. Efeito decorativo de cursor.

## Aparência
- **Camada**:
  - cobre 100% × 100% da área-alvo;
  - posicionamento **fixo** em relação à viewport quando não há contêiner, ou **absoluto** dentro do contêiner informado;
  - canto superior esquerdo em (0, 0), sem capturar ponteiro e com camada muito alta (z ≈ 10000).
- **Linha horizontal**: largura de 100% da camada, **1 px** de altura e cor configurável (padrão **branco**).
- **Linha vertical**: altura de 100% da camada e **1 px** de largura, na mesma cor.
- Ambas começam com **opacidade 0**. Não têm sombra nem brilho.
- Um elemento SVG invisível, do tamanho da camada, hospeda dois filtros de ruído, um por linha.

## Comportamento
- **Primeiro movimento** do ponteiro (na viewport ou no contêiner):
  - as posições suavizadas são inicializadas exatamente no ponteiro, sem "voo" a partir de (0, 0);
  - as duas linhas fazem fade de 0 a 1 em **0,9 s** com easing cúbico de desaceleração;
  - inicia o laço de animação.
- **Laço por quadro**:
  - posição suavizada = interpolação linear entre o valor anterior e o ponteiro atual, com fator de **0,15 por quadro**, separadamente em X e Y. O resultado é um seguimento elástico curto;
  - a linha **vertical** é transladada horizontalmente até o X suavizado;
  - a linha **horizontal** é transladada verticalmente até o Y suavizado.
- **Coordenadas**:
  - modo viewport: coordenadas do cliente;
  - modo contêiner: coordenadas relativas ao canto superior esquerdo do contêiner. Os eventos de movimento são ouvidos no próprio contêiner.
- **Modo contêiner — sair da área**: a intenção é fazer fade das linhas para 0 quando o ponteiro está fora dos limites do contêiner e para 1 quando volta (≈0,5 s, easing quadrático de desaceleração). Ver Observações.
- **Hover em links** (todos os elementos de link dentro do contêiner, ou do documento no modo viewport):
  - **entrada**: aplica às duas linhas um filtro de **turbulência fractal** (1 oitava) seguido de **mapa de deslocamento** com escala de **40**, ou seja, deslocamento de até ±20 px. A frequência base do ruído é animada de **1** até **0** em **0,5 s** com easing quadrático de desaceleração. Visualmente, a linha se fragmenta em pixels espalhados e pontilhados ao redor da posição e, à medida que a frequência cai, o deslocamento fica suave e uniforme até a linha voltar a ser reta. Ao fim, o filtro é removido;
  - **saída**: a animação salta para o fim e o filtro é removido imediatamente.
- **Desmontagem**: remove os ouvintes de movimento e de hover dos links.

## Técnica de renderização em alto nível
DOM + CSS para as linhas (translação via transform) e **filtros SVG** (turbulência fractal + mapa de deslocamento) para o efeito de ruído. A frequência base é animada por atributo a cada quadro. Um laço com `requestAnimationFrame` faz a interpolação linear da posição. Os fades podem usar Web Animations API ou uma biblioteca de tweens.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor das linhas | string de cor CSS | branco |
| Contêiner de referência (limita a mira a um elemento) | referência a elemento | nenhum (viewport inteira) |

## Demo
- Área de prévia com posicionamento relativo, **altura mínima de 300 px**, overflow oculto e fundo do tema.
- Ao centro, numa coluna centralizada:
  - um **link** com o texto **"Target"**, peso 600, tamanho 2rem em telas pequenas e **4rem** a partir de ~768 px, centralizado;
    - cor `#2f293a` no tema escuro e `#d4d4d8` no tema claro;
    - no hover, a cor muda para **magenta** (`#ff00ff`) com transição de 0,3 s e o texto vira **"Locked"**, voltando a "Target" ao sair;
    - a largura mínima do link é fixada na maior largura já medida dos dois textos (por um clone invisível), para que a troca não desloque o layout;
  - abaixo, a instrução **"(hover the text)"** em texto atenuado, deslocada 10 px para cima.
- **Cor da mira**: no tema claro, se a cor ainda for o padrão branco, a demo usa **`#18181b`**.
- Controles:
  - cor;
  - seletor "Viewport" × "Targeted". O padrão da demo é **Viewport**: a mira cobre a página inteira. Em "Targeted", ela é limitada à área da prévia.

## Acessibilidade e responsividade
- Decorativo: camada `aria-hidden` e sem captura de ponteiro, para não interferir em cliques.
- **Recomendação**: com `prefers-reduced-motion`, desativar o seguimento suavizado (posição direta) e o efeito de ruído, ou não exibir a mira.
- Em dispositivos de toque não há movimento de ponteiro contínuo: a mira fica oculta até o primeiro toque com arraste. Recomendação: não montar o efeito em dispositivos sem ponteiro fino (`pointer: coarse`).
- Os links do conteúdo continuam acessíveis normalmente.

## Observações de fidelidade
- No modo contêiner, o teste de "fora dos limites" fica dentro de um ouvinte registrado **no próprio contêiner**, que nunca recebe eventos de fora. Por isso, as linhas **não somem** ao sair. Recomendação: fazer o fade-out no evento de saída do ponteiro do contêiner e o fade-in na entrada.
- O efeito de ruído é encerrado de forma definitiva na primeira saída de um link e pode não se repetir em hovers seguintes. Recomendação: recriar ou reiniciar a animação a cada entrada, para que o efeito ocorra em todo hover.
- Os links são coletados uma única vez, na montagem; links adicionados depois não disparam o efeito. Recomendação: usar delegação de eventos (ouvir a entrada do ponteiro no contêiner e verificar se o alvo está dentro de um link).
- Os identificadores dos filtros são fixos, o que gera colisão com múltiplas instâncias. Recomendação: identificadores únicos por instância.
- O laço de animação nunca para, nem na desmontagem. Recomendação: cancelá-lo ao desmontar e pausá-lo quando a posição suavizada convergir.
- Na demo, o tema claro usa um cinza muito claro (`#d4d4d8`) para o texto, com baixo contraste. Recomendação: no tema claro, usar um cinza médio-escuro (ex.: `#52525b`).
