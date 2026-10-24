# Especificação: Fundo de bolhas fluidas (bubble)

## Propósito
Um fundo animado de "lava" colorida: grandes manchas radiais de cores vivas, muito desfocadas, que flutuam, orbitam e se fundem umas nas outras sobre um degradê violeta-azulado. Opcionalmente, uma mancha extra segue o ponteiro com atraso elástico. Serve de pano de fundo para heróis e seções, com conteúdo por cima.

## Aparência
- **Contêiner**:
  - ocupa 100% × 100% do pai, com posicionamento relativo e overflow oculto;
  - fundo em **degradê diagonal** (do canto superior esquerdo ao inferior direito) de violeta escuro **`#4c1d95`** para azul escuro **`#1e3a8a`**.
- **Camada de manchas**: cobre todo o contêiner (absoluta, inset 0), com um filtro composto aplicado ao grupo inteiro:
  1. efeito **"gosma"** (*goo*): desfoque gaussiano de desvio 16, depois um realce de contraste do canal alfa (alfa × 18 − 8), o que torna sólidas as bordas das áreas sobrepostas, e por fim mistura do resultado com a imagem original;
  2. em seguida, um **desfoque de 40 px** sobre tudo.
  - O resultado são manchas macias que "grudam" quando se aproximam.
- **Cada mancha** é um círculo com degradê radial: no centro, a cor com **alfa 0,8**, caindo para alfa 0 a **50% do raio** do elemento (ou seja, a parte visível ocupa só o miolo). Todas usam o modo de mistura **hard-light**.
- **Cores padrão** (triplas RGB):
  1. azul `rgb(18,113,255)`;
  2. magenta `rgb(221,74,255)`;
  3. ciano `rgb(0,220,255)`;
  4. vermelho `rgb(200,50,50)`;
  5. oliva/amarelo `rgb(180,180,50)`;
  6. lilás `rgb(140,100,255)` (só a mancha interativa).
- **Disposição** (porcentagens relativas ao contêiner):
  1. **Mancha 1** (cor 1): 80% × 80%, canto em (10%, 10%), portanto centralizada.
  2. **Mancha 2** (cor 2): 80% × 80%, centralizada, dentro de uma camada de tela cheia que **gira** em torno do ponto (centro − 400 px, centro).
  3. **Mancha 3** (cor 3): 80% × 80%, com o canto superior esquerdo em (50% − 500 px, 50% + 200 px), ou seja, deslocada para baixo e para a esquerda. Fica dentro de uma camada que gira em torno de (centro + 400 px, centro).
  4. **Mancha 4** (cor 4): 80% × 80%, centralizada, com **opacidade 0,7**.
  5. **Mancha 5** (cor 5): **160% × 160%**, centralizada (transborda), dentro de uma camada que gira em torno de (centro − 800 px, centro + 200 px).
  6. **Mancha 6** (cor 6, só no modo interativo): 100% × 100%, partindo do canto (0, 0), com opacidade 0,7.

## Comportamento
- Animações contínuas e infinitas:
  - **Mancha 1**: vai e volta na vertical de −50 px a +50 px e de volta a −50 px, num ciclo de **30 s** com easing suave nos dois sentidos (ease-in-out).
  - **Mancha 2**: rotação completa de 360° em **20 s**, linear, em torno da origem indicada.
  - **Mancha 3**: rotação de 360° em **40 s**, linear.
  - **Mancha 4**: vai e volta na horizontal de −50 px a +50 px e de volta, em **40 s**, ease-in-out.
  - **Mancha 5**: rotação de 360° em **20 s**, linear.
- **Modo interativo** (desligado por padrão):
  - ao mover o mouse sobre o contêiner, a mancha 6 é transladada pelo vetor (ponteiro − centro do contêiner), de modo que **o centro dela acompanha o ponteiro**;
  - o movimento segue uma **mola** de rigidez **100** e amortecimento **20** (segue com atraso, leve balanço);
  - as atualizações de ponteiro são agrupadas por quadro de animação;
  - o retângulo do contêiner é remedido em redimensionamento e em rolagem;
  - ao sair, a mancha fica onde parou.
- **Conteúdo filho**: renderizado depois das camadas, acima delas.

## Técnica de renderização em alto nível
DOM + CSS: elementos `div` com degradês radiais, modo de mistura e transformações animadas (laço infinito em CSS ou `motion`). O efeito de fusão vem de um **filtro SVG** definido inline (desfoque gaussiano → matriz de cor que amplifica o alfa → mistura com a origem), referenciado por `url(#id)` e combinado com `blur(40px)` no `filter` da camada. As cores entram como variáveis CSS **escopadas no próprio contêiner**. Use promoção para camada de GPU (translateZ(0)/will-change) nas manchas.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Seis cores das manchas | triplas RGB "r,g,b" | ver Aparência |
| Mancha que segue o ponteiro | booleano | falso |
| Mola da mancha interativa | rigidez/amortecimento | 100 / 20 |
| Cores do degradê de fundo | 2 cores CSS | `#4c1d95` → `#1e3a8a` |
| Conteúdo sobreposto | nós | nenhum |

## Demo
- O componente preenche toda a área de prévia (absoluto, inset 0) com **raio de 14 px**, conteúdo centralizado e sem filhos.
- **Modo interativo ligado**, para a mancha lilás aparecer centrada sob o cursor parado no centro. Opcional: um interruptor no canto para ligar e desligar.

## Acessibilidade e responsividade
- Puramente decorativo: as camadas de manchas devem ter `aria-hidden`. O conteúdo filho mantém a semântica.
- Com `prefers-reduced-motion`, pausar as rotações e oscilações (deixar a composição estática) e a mancha interativa.
- As manchas são relativas ao contêiner, mas os deslocamentos das origens de rotação (400/500/800 px) são fixos em pixels. Em contêineres pequenos, as órbitas passam boa parte do tempo fora da área. Isso faz parte do visual.
- Custo: filtros de desfoque grandes são caros. Recomenda-se limitar a área ou reduzir o desfoque em telas pequenas.

## Observações de fidelidade
- Recomendação: a referência define as cores como variáveis na raiz do documento (`:root`) e usa um id de filtro fixo. Múltiplas instâncias se sobrescrevem. Escope as variáveis no contêiner e gere um id de filtro único por instância.
- Recomendação: a referência não reposiciona a mancha interativa ao sair do contêiner. Opcionalmente, devolva-a suavemente ao centro.
