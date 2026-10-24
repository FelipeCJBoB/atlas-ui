# Especificação: Mídia que expande com a rolagem (scroll-expand)

## Propósito
Seção de destaque guiada por rolagem: uma imagem (ou vídeo) começa recortada numa "janela" central com cantos arredondados e um título por cima; à medida que o usuário rola, a janela se abre até ocupar todo o palco, o zoom da mídia volta ao normal, o título sobe e some e um conteúdo sobreposto aparece. Depois disso, o palco fica fixo por mais um trecho antes de liberar a rolagem.

## Aparência
- **Contêiner raiz**: posicionamento relativo, 100% × 100% do pai. No modo padrão (rolagem própria) ele mesmo é a área rolável: rolagem vertical automática, horizontal oculta, **barra de rolagem invisível** em todos os navegadores e encadeamento de rolagem contido (a rolagem não "vaza" para a página).
- **Trilho**: bloco de largura 100% e altura = altura do palco × (1 + distância de expansão + distância de retenção). Com os padrões: 1 + 1,2 + 0,35 = **2,55×** a altura do palco.
- **Palco**: fixo por *sticky* no topo do trilho, largura 100%, altura igual à altura visível do contêiner (ou da janela, no modo de rolagem da página), overflow oculto.
- **Moldura**: camada absoluta que cobre o palco inteiro, mas recortada por um retângulo interno com cantos arredondados (recorte por *inset*). Em repouso o recorte deixa visível uma janela central de **42% da largura × 58% da altura** com raio de **24 px**.
- **Mídia**: imagem ou vídeo cobrindo a moldura inteira (ajuste *cover*), não arrastável e não selecionável, com origem de transformação no centro. Em repouso tem zoom de **1,35×**.
- **Véu (scrim)** dentro da moldura: gradiente vertical de baixo para cima — `rgba(0,0,0,.75)` na base, `rgba(0,0,0,.10)` a 45% e `rgba(0,0,0,.35)` no topo. Opacidade inicial 0. Não captura ponteiro.
- **Conteúdo sobreposto** (opcional, filhos) dentro da moldura: coluna flex centralizada nos dois eixos, texto centralizado, padding de **6%**, opacidade inicial 0.
- **Título** (opcional) no palco, por cima da moldura (não recortado): ocupa o palco todo, centralizado, padding horizontal de 6%; fonte de peso **700**, espaçamento entre letras **−0,03em**, altura de linha 1, cor **branca**, sombra de texto `0 2px 24px rgba(0,0,0,.45)`. O tamanho da fonte é responsivo: **7,5% da largura do contêiner**, limitado entre **20 px e 84 px** (antes da primeira medição, 4rem). Não captura ponteiro.
- **Dica de rolagem** (opcional): linha centralizada a **1,25rem do fundo** do palco, fonte de **0,8125rem**, espaçamento de letras 0,02em, cor `rgba(255,255,255,.55)`. Não captura ponteiro.

## Comportamento

### Progresso
- O progresso bruto p (0–1) = deslocamento de rolagem ÷ (altura do palco × distância de expansão, com mínimo 0,01).
  - Modo próprio: deslocamento = posição de rolagem do contêiner.
  - Modo página: deslocamento = −(topo do trilho em relação à janela).
  - Saturado em [0, 1]. A retenção é simplesmente o trecho extra do trilho em que p fica em 1 com o palco ainda preso.
- **Suavização**: o progresso exibido persegue o bruto de forma exponencial. A cada quadro avança a fração 1 − e^(−1/(60 × tempo de suavização)) da distância (tempo padrão **0,1 s**; pensado para 60 Hz). Para quando a diferença é menor que 0,0004 (crava no alvo) e o laço de animação se desliga até o próximo evento de rolagem. Com suavização 0 ou com movimento reduzido, o exibido segue o bruto instantaneamente.
- **Desativado**: o progresso é sempre 1 (mídia já aberta).

### Mapeamento do progresso (e = suavização cúbica *smoothstep* de p)
- **Janela**: largura vai de 42% a 100%, altura de 58% a 100%, sempre centralizada; raio de 24 px a **0 px**. Tudo interpolado linearmente por e.
- **Zoom da mídia**: de 1,35 a 1,0, linear em e.
- **Véu**: opacidade = intensidade do véu (padrão **0,45**) × e.
- **Título**: com s = smoothstep entre p 0,40 e 0,88 → opacidade 1 − s, sobe até **28 px** e cresce até **1,06×** no fim.
- **Dica**: com g = smoothstep entre p 0 e 0,12 → opacidade 1 − g e desce **8 px**. Some logo no começo da rolagem.
- **Conteúdo sobreposto**: com i = smoothstep entre p 0,68 e 1 → opacidade i, vindo de **18 px** abaixo até a posição final.

### Medição e redimensionamento
Na montagem, em redimensionamento da janela e quando o tamanho do contêiner muda: mede a altura do palco, recalcula a altura do trilho e o tamanho do título, relê o progresso e aplica-o direto (sem suavização).

## Técnica de renderização em alto nível
Somente DOM e CSS. Posicionamento *sticky* para prender o palco; recorte por retângulo interno arredondado para a janela; transformações e opacidade aplicadas diretamente aos estilos dos elementos a cada quadro de animação (fora do ciclo de render do React). Um laço de animação ativado sob demanda pelos eventos de rolagem implementa a suavização exponencial. Curva *smoothstep* (3t² − 2t³) para todas as transições.

**Asset**: a demo usa uma foto remota (cordilheira ao nascer do sol). **Não usar foto externa.** Gerar uma paisagem própria em SVG ou gradientes CSS: céu em gradiente de laranja-rosado `#f7a26b` para azul-arroxeado `#3b3f6b`, sol como círculo claro desfocado perto do horizonte e 3–4 camadas de silhuetas de montanhas em tons decrescentes de azul-ardósia (do mais claro ao fundo para o mais escuro na frente), na proporção 16:10.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Endereço da mídia | string | vazio (usar paisagem procedural na demo) |
| Tipo da mídia (imagem ou vídeo em laço, mudo, autoplay, inline) | `imagem` / `vídeo` | `imagem` |
| Quadro de capa do vídeo | string | vazio |
| Texto alternativo da imagem | string | vazio |
| Título sobreposto | string | vazio (não renderiza) |
| Texto da dica de rolagem | string | vazio (não renderiza) |
| Largura inicial da janela | número (% do palco) | 42 |
| Altura inicial da janela | número (% do palco) | 58 |
| Raio inicial | número (px) | 24 |
| Raio final | número (px) | 0 |
| Zoom inicial da mídia | número | 1,35 |
| Comprimento da rolagem de expansão (× altura do palco) | número | 1,2 |
| Rolagem extra com o palco preso em tela cheia | número (× altura do palco) | 0,35 |
| Tempo de suavização | número (s) | 0,1 |
| Intensidade máxima do véu | número 0–1 | 0,45 |
| Usar rolagem da página em vez da rolagem própria | booleano | falso |
| Efeito ativado | booleano | verdadeiro |
| Conteúdo sobreposto que aparece no fim | nós React | nenhum |
| Classe/estilo/atributos extras da raiz | — | — |

## Demo
- Área de prévia com **520 px de altura**, sem padding, overflow oculto, fundo escuro do site. O componente ocupa a área e rola internamente.
- Mídia: paisagem montanhosa ao amanhecer (gerada proceduralmente, ver Asset), texto alternativo "Mountain range at sunrise".
- Título **"Built to scale"**; dica **"Scroll inside the frame"**.
- Conteúdo sobreposto: título "Every pixel, everywhere" (2rem, peso 700, branco, espaçamento −0,02em, altura de linha 1,1) e, abaixo com 0,75rem de margem, o parágrafo "The frame opens up as you scroll and hands the whole stage to your media." (1rem, `rgba(255,255,255,.72)`, largura máxima 30rem).
- Controles: seletor de título ("Built to scale", "See it bigger", nenhum); largura e altura inicial 15–90%; raio inicial e final 0–80 px; zoom 1–2 (0,01); distância de expansão 0,5–3 (0,1); retenção 0–1,5 (0,05); suavização 0–0,4 s (0,01); véu 0–1 (0,01); chave ativado.

## Acessibilidade e responsividade
- A raiz rolável deve ser alcançável e rolável por teclado: recomenda-se torná-la focável (tabindex 0) com rótulo acessível quando no modo de rolagem própria, já que a barra é invisível.
- Título e dica são texto real (legíveis por leitor de tela); a imagem usa o texto alternativo. Para vídeo, oferecer descrição equivalente.
- Movimento reduzido: sem suavização (segue a rolagem). Recomendação adicional: considerar mostrar o estado final aberto.
- Tamanho do título adapta-se à largura (7,5%, 20–84 px). O palco acompanha a altura do contêiner ou da janela.

## Observações de fidelidade
- **Recomendação**: a suavização da referência depende da taxa de quadros (assume 60 Hz). Use o tempo real entre quadros: fração = 1 − e^(−Δt / tempo de suavização).
- **Recomendação**: ocultar totalmente a barra de rolagem prejudica a descoberta; manter, mas oferecer a dica de rolagem por padrão quando houver rolagem própria.
- **Recomendação**: no modo página, o trilho define a altura do componente; a raiz não deve ter altura fixa de 100% nesse modo (senão o trilho transborda).
- Vídeo deve ter `muted` e `playsInline` para autoplay funcionar em celulares.
