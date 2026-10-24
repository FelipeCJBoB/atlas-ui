# Especificação: Campo de pontos reativo (dot-field)

## Propósito
Fundo com uma grade regular de pontos minúsculos pintados com um gradiente diagonal suave. Quando o mouse se move rápido, os pontos ao redor do cursor são empurrados para fora (como uma lente de aumento ou uma onda de choque) e um halo escuro acompanha o cursor; quando o mouse para, tudo volta suavemente ao lugar. Pode ter ondulação contínua e cintilação opcionais.

## Aparência
- **Contêiner**: bloco em posição relativa, 100% × 100% do pai. Aceita atributos extras repassados ao elemento.
- **Camadas** (ambas em posição absoluta, cobrindo o contêiner):
  1. superfície de desenho 2D com os pontos (transparente);
  2. por cima, uma camada vetorial que não captura o ponteiro, contendo um único círculo de halo.
- **Pontos**: círculos preenchidos com **raio = metade do "tamanho do ponto"** (padrão 1,5 → raio de **0,75 px**, diâmetro 1,5 px).
- **Grade**: passo = tamanho do ponto + espaçamento (padrão 1,5 + **14** = **15,5 px**). O número de colunas e de linhas é a parte inteira de largura ÷ passo e altura ÷ passo. A sobra é dividida igualmente entre as margens, e cada ponto fica no centro da sua célula.
- **Cor dos pontos**: um único gradiente linear do canto superior esquerdo ao canto inferior direito da área, aplicado a todos os pontos:
  - início **`rgba(168, 85, 247, 0.35)`** (violeta translúcido);
  - fim **`rgba(180, 151, 207, 0.25)`** (lilás acinzentado translúcido).
- **Halo**: círculo de raio **160 px** preenchido com um gradiente radial da cor do halo (padrão **`#120F17`**, quase preto, igual ao fundo escuro do site) no centro até transparente na borda. Fica sobre os pontos e, portanto, os **apaga** perto do cursor, criando um "vazio" suave. Opacidade inicial 0.

## Comportamento
### Medida de engajamento
- A cada **20 ms**, mede-se a distância percorrida pelo mouse desde a amostra anterior. A velocidade suavizada anda 50% em direção a essa distância (valores < 0,001 viram 0).
- Engajamento-alvo = mín(velocidade ÷ 5, 1). O engajamento real anda **6%** por quadro em direção ao alvo (zerado abaixo de 0,001).
- Opacidade do halo anda **8%** por quadro em direção ao engajamento. O halo é centralizado no cursor a cada quadro.
- Resultado: o efeito só existe enquanto o mouse se move; ao parar, ele se desfaz em ~1 s.
### Modo "lente" (padrão ligado)
- Para cada ponto a menos do raio do cursor (padrão **500 px**) e com engajamento > 0,01:
  - fator t = 1 − distância ÷ raio;
  - empurrão = t² × intensidade da lente (padrão **67 px**) × engajamento;
  - posição-alvo = posição de repouso afastada do cursor por esse empurrão (na direção cursor → ponto);
  - a posição exibida anda **15%** até o alvo por quadro.
- Fora do raio (ou sem engajamento), a posição exibida anda **10%** por quadro de volta ao repouso.
### Modo "força" (lente desligada)
- Pontos dentro do raio recebem um deslocamento extra, afastando-se do cursor, de (500 ÷ distância) × velocidade do mouse × força (padrão **0,1**).
- O deslocamento decai ×0,9 por quadro, e a posição exibida persegue (repouso + deslocamento) a 10% por quadro, em movimento elástico amortecido.
### Ondulação (padrão desligada, amplitude 0)
- Com amplitude A > 0, cada ponto oscila:
  - vertical: A × seno(x de repouso × 0,03 + t);
  - horizontal: ½ A × cosseno(y de repouso × 0,03 + 0,7 t);
  - t cresce 0,02 por quadro (~1,2 por segundo a 60 fps). O resultado é uma onda que atravessa a grade.
### Cintilação (padrão desligada)
- A cada 8 quadros, cerca de **3%** dos pontos, escolhidos de forma pseudoaleatória pelo índice, são desenhados com raio **1,8×** maior, piscando.
### Coordenadas e tamanho
- A posição do mouse é escutada na janela inteira e convertida para coordenadas locais do contêiner. Antes do primeiro movimento, o mouse é considerado muito longe (sem efeito).
- Redimensionamento da janela com debounce de **100 ms** reconstrói a grade. Mudar o tamanho do ponto ou o espaçamento também reconstrói a grade (os pontos voltam ao repouso).
- Densidade de pixels = DPR limitado a 2, aplicada à superfície.

## Técnica de renderização em alto nível
Canvas 2D: a cada quadro limpa a superfície, monta um único caminho com todos os círculos e preenche-o de uma vez com o gradiente linear (uma chamada de preenchimento por quadro). O halo é um círculo vetorial (SVG) com gradiente radial e identificador único por instância, movido por atributos a cada quadro. O estado dos pontos vive numa lista mutável fora do estado de renderização da UI.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Tamanho (diâmetro) do ponto | número (px) | 1,5 |
| Espaçamento entre pontos | número (px) | 14 |
| Raio de influência do cursor | número (px) | 500 |
| Força do empurrão (modo força) | número | 0,1 |
| Modo lente (em vez de força) | booleano | verdadeiro |
| Intensidade da lente | número (px) | 67 |
| Raio do halo | número (px) | 160 |
| Cintilação | booleano | falso |
| Amplitude da ondulação | número (px) | 0 |
| Cor inicial do gradiente | cor CSS | `rgba(168, 85, 247, 0.35)` |
| Cor final do gradiente | cor CSS | `rgba(180, 151, 207, 0.25)` |
| Cor do halo | cor CSS | `#120F17` |
| Atributos extras do contêiner | objeto | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site (`#120F17` aproximadamente, o que faz o halo parecer um "apagamento").
- Valores: padrões, exceto o gradiente, que usa cores **opacas** **`#A855F7`** → **`#B497CF`** (pontos bem mais visíveis).
- Sobreposição de demonstração do site com o conteúdo padrão (selo em pílula e título centralizados; textos e estilos exatos não constam da referência — usar, por exemplo, "New Background" e um título curto, branco, ~2,5rem, peso 600). Não deve bloquear o ponteiro.
- Controles (aplicados ao vivo; há botões de restaurar e de remontar): tamanho do ponto 0,5–5 (0,5); espaçamento 5–30 (1); raio do cursor 100–1000 (50); força 0–1 (0,01); chave do modo lente; intensidade da lente 0–150 (1); raio do halo 50–400 (10); amplitude da ondulação 0–20 (1); chave de cintilação; cores inicial, final e do halo.

## Acessibilidade e responsividade
- Decorativo: ocultar ambas as camadas de leitores de tela; nada focável.
- Recomendação: com `prefers-reduced-motion`, desativar ondulação e cintilação e reduzir (ou remover) o empurrão.
- Em toque não há movimento de mouse; o campo fica estático (aceitável). Opcionalmente, reagir a arraste de toque.
- Recomendação: pausar o laço fora da tela ou com a aba oculta.

## Observações de fidelidade
- **Recomendação**: a referência calcula a posição local do mouse usando um deslocamento do contêiner medido apenas no redimensionamento; se o elemento mudar de lugar (rolagem dentro de outro contêiner, mudança de layout), o efeito desalinha. Medir o retângulo do contêiner a cada movimento (coordenadas de viewport para ambos).
- **Recomendação**: observar o tamanho do contêiner (não só da janela).
- **Recomendação**: o "raio do ponto" é na prática um diâmetro; manter o comportamento visual, mas nomear o parâmetro de forma clara.
- **Recomendação**: as taxas de suavização são por quadro; em telas de 120 Hz o efeito fica duas vezes mais rápido. Opcionalmente, normalizar por Δt.
- **Recomendação**: a densidade de pixels é lida só na montagem; relê-la ao redimensionar.
