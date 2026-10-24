# Especificação: Distorção em ondulações (ripple-distortion)

## Propósito
Mostra uma imagem de fundo que ocupa todo o contêiner e reage ao ponteiro como uma superfície de água: por onde o cursor passa (ou onde se clica) nascem ondulações circulares que crescem, distorcem a imagem por refração e somem aos poucos. É um efeito decorativo de fundo/hero.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto e fundo **preto `#000`** (visível enquanto a imagem não carrega). Aceita classe e estilo extras.
- **Superfície**: uma única superfície WebGL em bloco, 100% × 100%, com fundo opaco preto.
- **Imagem**: ajustada ao modo *cover* (preenche tudo, centralizada, cortando o excesso no eixo que sobra), sem repetição; amostragem linear, sem mipmaps.
- **Em repouso** (sem ondas) a imagem aparece intacta, mas **em tons de cinza** por padrão (dessaturação por luminância com pesos Rec. 709: 0,2126 R, 0,7152 G, 0,0722 B).
- **Onda**: uma mancha circular cujo perfil radial é um sino gaussiano (cai como e^(−5·r²), em que r é a distância normalizada ao quadrado) normalizado para valer exatamente 0 na borda do círculo, multiplicado por um padrão de anéis concêntricos: um cosseno da distância ao centro com N ciclos do centro à borda (padrão **4 anéis**), oscilando entre 0,1 e 1,0 de intensidade. O resultado visual é um "alvo" de anéis suaves que se desfaz para fora.
- **Cor das áreas perturbadas**: a imagem é tingida de leve com a cor **roxa `#a855f7`** onde há onda (intensidade de tingimento padrão **0,1**).
- **Brilho especular** (desligado por padrão): faixa de brilho na cor **branca `#ffffff`** nas "encostas" das ondas, como se uma luz vinda de cima-esquerda refletisse na água.
- **Dispersão cromática** (desligada por padrão): separação dos canais vermelho e azul nas bordas da refração.

## Comportamento

### Geração de ondas
- **Modo de disparo** (padrão **passar o ponteiro**): passar, clicar ou ambos.
- **Passar o ponteiro**: o movimento é escutado na janela inteira, mas só conta quando o ponteiro está dentro do retângulo do contêiner. Uma nova onda é criada sempre que o ponteiro se afasta mais que o **espaçamento** (padrão **15 px**) em X **ou** em Y da posição da última onda criada. Assim, o rastro é uma trilha de ondas espaçadas.
- **Clique** (ponteiro pressionado dentro do contêiner): cria uma onda no ponto, com tamanho inicial multiplicado pela **força de clique** (padrão **2**, mínimo 1).
- **Desativado**: não cria ondas (as existentes continuam a morrer normalmente).

### Ciclo de vida de uma onda
- Diâmetro base = **tamanho do pincel** (padrão **150 px**, mínimo 1).
- Escala inicial = **1,5** × multiplicador (1 para passagem, força de clique para clique). Escala-alvo = 1,5 × **expansão** (padrão **5**, mínimo 1) × multiplicador.
- Diâmetro desenhado = escala × diâmetro base (logo, uma onda de passagem nasce com 225 px e tende a 1125 px com os padrões).
- A escala aproxima-se do alvo de forma **exponencial suave** com taxa de **1,09 por segundo** (a cada quadro avança a fração 1 − e^(−1,09·Δt) da distância restante). Ou seja, a onda cresce rápido no início e desacelera.
- Opacidade começa em 1 e decai exponencialmente de modo que, após o tempo de **esmaecimento** (padrão **3 s**, mínimo efetivo 0,15 s), chega a 1/500. Abaixo de 0,002 a onda é considerada morta.
- A contribuição visual da onda é proporcional ao **quadrado** da opacidade (o desaparecimento parece mais rápido no fim).
- Δt por quadro é limitado a 50 ms (evita saltos ao voltar de aba inativa).
- Há um **anel circular de 100 ondas** reaproveitadas: a 101ª sobrescreve a mais antiga.

### Distorção da imagem
- As ondas são somadas (mistura aditiva) num **campo de deslocamento** monocanal, desenhado fora da tela numa resolução reduzida: fator **0,4** (baixa, padrão), **0,7** (média) ou **1,0** (alta) do tamanho do contêiner.
- Para cada pixel, o valor do campo (a) define:
  - um **ângulo** = a × giro × 2π (giro padrão **1 volta**). Com giro 0, o empurrão sempre aponta na mesma direção; valores maiores "dobram" a imagem em cáusticas;
  - um **deslocamento** da coordenada de amostragem da imagem = direção desse ângulo × a × **força** (padrão **0,2**, fração do tamanho da imagem).
- **Dispersão** (0–1): o canal vermelho é amostrado com deslocamento ampliado em (1 + d/4) e o azul reduzido em (1 − d/4); o verde fica no deslocamento normal.
- **Tons de cinza**: aplicado depois da amostragem (liga/desliga).
- **Tingimento**: a cor é misturada com cor × tom × 1,9, na proporção min(1, a × 1,6) × intensidade de tingimento. Só onde há onda.
- **Brilho**: calcula-se uma normal de superfície a partir do gradiente do campo (diferenças centrais de um texel, ampliadas ~26×), ilumina-se com luz direcional vinda de cima-esquerda-frente e expoente especular alto (~22). Subtrai-se o brilho que uma superfície plana teria, para que o brilho só apareça nas inclinações, e soma-se cor de brilho × resultado × intensidade.

### Ajustes ao vivo
Força, giro, anéis, dispersão, brilho, tingimento, cor de tingimento, cor de brilho e tons de cinza mudam sem reiniciar. Imagem e qualidade recriam o efeito. Pincel, expansão, esmaecimento, espaçamento, força de clique, modo e ativado são lidos na hora de cada evento/quadro.

### Redimensionamento
Observa o tamanho do contêiner e ajusta a superfície (densidade de pixels limitada a 2) e o campo de deslocamento.

### Movimento reduzido
Com `prefers-reduced-motion: reduce`, nenhuma onda é criada (a imagem fica estática).

## Técnica de renderização em alto nível
WebGL em duas passagens por quadro:
1. **Campo de deslocamento**: todas as ondas vivas são desenhadas como quadrados instanciados (posição, escala e opacidade por instância) num alvo de renderização fora da tela, com mistura aditiva. Cada quadrado descarta os pixels fora do círculo inscrito e escreve o perfil gaussiano × anéis.
2. **Composição**: um triângulo em tela cheia amostra a imagem com a coordenada deslocada pelo campo (direção rotacionada pelo valor do campo), aplica cinza, tingimento e brilho especular por normal derivada do gradiente.
Qualquer biblioteca WebGL leve ou WebGL puro serve. Na limpeza, cancelar o laço, remover ouvintes, desconectar o observador e perder o contexto.

**Asset**: a referência carrega uma fotografia remota. **Não usar foto externa.** Gerar a textura proceduralmente (por exemplo, um canvas 2D com um gradiente diagonal de céu azul-acinzentado para areia, algumas formas orgânicas desfocadas e uma grade sutil de linhas finas, que deixa a distorção bem legível) ou aceitar qualquer imagem passada por parâmetro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Imagem a distorcer (URL) | string | textura procedural própria |
| Diâmetro de cada onda | número (px) | 150 |
| Força do empurrão (fração do tamanho da imagem) | número | 0,2 |
| Voltas de giro da direção do empurrão | número | 1 |
| Quantidade de anéis concêntricos por onda | número (aceita fração) | 4 |
| Fator de crescimento da onda até morrer | número (≥ 1) | 5 |
| Tempo de vida da onda | número (s) | 3 |
| Distância do ponteiro entre ondas | número (px) | 15 |
| Dispersão cromática | número 0–1 | 0 |
| Intensidade do brilho especular | número | 0 |
| Cor de tingimento | cor hex | `#a855f7` |
| Intensidade do tingimento | número | 0,1 |
| Converter imagem para cinza | booleano | verdadeiro |
| Cor do brilho | cor hex | `#ffffff` |
| Modo de disparo | `passar` / `clicar` / `ambos` | `passar` |
| Multiplicador de tamanho para cliques | número (≥ 1) | 2 |
| Qualidade do campo | `baixa` / `média` / `alta` | `baixa` |
| Efeito ativado | booleano | verdadeiro |
| Classe/estilo extra do contêiner | string / objeto | vazio |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto; o componente ocupa 100% dela. Botão de "recarregar" no canto que remonta o componente.
- Usa todos os valores padrão (imagem em cinza, tingimento roxo leve, giro 1, 4 anéis).
- Controles: tamanho do pincel 40–260 (passo 5); força 0,01–0,3 (passo 0,005); giro 0–3 (0,05); anéis 0–5 (0,25); expansão 1–10 (0,25); esmaecimento 0,5–5 s (0,1); espaçamento 1–40 px; força de clique 1–4 (0,1); dispersão 0–1 (0,05); brilho 0–1,5 (0,05); intensidade de tingimento 0–0,6 (0,02); seletores de cor para tingimento e brilho; seletor de modo (passar/clicar/ambos); seletor de qualidade (baixa/média/alta); chaves para cinza e ativado.

## Acessibilidade e responsividade
- Decorativo: a superfície deve ter `aria-hidden` ou, se a imagem tiver significado, o contêiner deve expor `role="img"` com texto alternativo configurável (recomendação).
- Respeita movimento reduzido (sem ondas).
- Responsivo: acompanha o contêiner; o ajuste *cover* mantém a proporção da imagem.
- Em toque, o modo "passar" funciona durante o arraste (eventos de ponteiro); o clique funciona com toque.

## Observações de fidelidade
- **Recomendação**: a escuta do movimento é global (janela). Prefira escutar no próprio contêiner ou manter a verificação de limites, mas evitar custo quando o componente está fora da tela (pausar o laço com um observador de interseção).
- **Recomendação**: o laço roda sempre, mesmo sem ondas; pode ser pausado quando não há ondas vivas, desde que a imagem tenha sido desenhada ao menos uma vez após carregar.
- **Recomendação**: a referência não trata falha de carregamento da imagem (fica preto). Exibir a textura procedural como alternativa.
- A primeira onda por passagem é comparada com a posição (0,0) inicial, o que pode gerar uma onda imediata ao entrar. Comportamento aceitável.
