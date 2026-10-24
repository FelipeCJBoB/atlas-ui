# Especificação: Fios luminosos (strands)

## Propósito
Fundo animado com alguns "fios" de luz colorida que ondulam horizontalmente no centro do contêiner, entrelaçando-se e se apagando suavemente nas pontas esquerda e direita. Opcionalmente, os fios são mostrados dentro de uma esfera de vidro que refrata a luz na borda. Decorativo.

## Aparência
- **Contêiner**: posicionamento relativo, 100% × 100% do pai, **fundo transparente**. Aceita classe e estilo extras. A superfície WebGL dentro dele é bloco, 100% × 100%, transparente (alfa pré-multiplicado).
- **Sistema de coordenadas**: origem no centro; unidade = altura do contêiner; tudo é dividido pela **escala** (padrão **1,5**, ou seja, o efeito aparece ampliado 1,5×).
- **Envelope horizontal**: cada fio é modulado por cos(1,3·π·x) elevado ao expoente de **afunilamento** (padrão **3**), com valores negativos zerados. O fio é mais forte no centro e some a ±0,385 unidades (com escala 1,5, cerca de ±58% da altura do contêiner a partir do centro). Afeta amplitude, espessura e brilho.
- **Fios** (padrão **3**, máximo 12): cada um é uma curva y(x) formada pela soma de duas senoides com pesos 0,6 e 0,4, a segunda com frequência 1,1× maior e movendo-se no sentido contrário a 0,7× a velocidade. Para o fio de índice i:
  - fase = i × 1,7 × separação (padrão **1**);
  - frequência espacial = (2 + 0,35·i) × ondulação (padrão **1**);
  - velocidade própria = 1,4 + 1,2·i (os fios de cima do índice correm mais rápido);
  - amplitude = (0,1 + 0,02·E) × envelope × amplitude configurada (padrão **1**), onde E = 0,06 + 0,94 × intensidade (padrão intensidade **0,6** → E ≈ 0,62).
- **Brilho de cada fio**: com d = distância vertical do pixel até a curva e T = (0,001 + 0,05·E) × (0,35 + envelope) × espessura (padrão **0,7**), a contribuição é (T ÷ (d + 0,45·T))², um núcleo intenso com halo de decaimento polinomial. A contribuição é multiplicada pela cor do fio e pelo envelope, e todos os fios são **somados**.
- **Cor do fio**: amostrada de uma paleta cíclica por um parâmetro h = i/N + 0,3·x + 0,04·tempo + deslocamento de matiz. Ou seja, a cor varia ao longo do fio, difere entre fios e desliza lentamente com o tempo.
  - **Paleta padrão**: `#FF4242` (vermelho), `#7C3AED` (violeta), `#06B6D4` (ciano), `#EAB308` (âmbar). A cor é interpolada linearmente entre entradas consecutivas e a última volta para a primeira. Máximo de 8 cores.
  - **Paleta vazia**: usa um espectro arco-íris por cossenos (três cossenos defasados em 0, ⅓ e ⅔ de volta).
- **Pós-processamento**: soma × (0,45 + 0,7·E); mapeamento de tons exponencial 1 − e^(−cor × brilho) (brilho padrão **2,6**), que satura suavemente; ajuste de saturação em torno da luminância Rec. 709 (padrão **1,5**; > 1 intensifica, < 1 dessatura); alfa = maior canal × opacidade (padrão **1**). O fundo fica transparente onde não há fio.

### Modo esfera de vidro (desligado por padrão)
- A cena dos fios é desenhada fora da tela e mostrada **somente dentro de um círculo** centralizado de raio 0,46 × tamanho (padrão **1**) da altura do contêiner, com borda antisserrilhada. Fora do círculo fica transparente.
- **Refração**: só numa faixa estreita junto à borda (de 85% a 100% do raio, com peso crescente pela 6ª potência da distância normalizada). A amostragem é deslocada radialmente para dentro em até 0,15 × refração (padrão **1**). O miolo não é distorcido.
- **Dispersão**: na mesma faixa, os canais vermelho e azul são deslocados em sentidos opostos em até 0,012 × dispersão (padrão **1**), criando franjas de arco-íris.
- **Aro de Fresnel** neutro: branco somado com intensidade 0,18 × (1 − altura da esfera)³, mais forte na borda.
- **Realce especular**: mancha clara vinda de cima-esquerda (expoente 6, intensidade 0,4), que se apaga na borda.
- **Corpo**: um leve escurecimento/véu de opacidade 0,05 a 0,10 (mais perto da borda), para o vidro "existir" mesmo sem fios atrás.

## Comportamento
- Animação contínua guiada pelo relógio da página (segundos desde o carregamento); a fase das ondas usa tempo × velocidade (padrão **0,5**), e a deriva de cor usa o tempo bruto.
- **Todos os parâmetros são lidos a cada quadro**: mudanças aplicam-se ao vivo, sem recriar o contexto. A quantidade de fios é arredondada e limitada a 1–12.
- **Redimensionamento**: ao redimensionar a janela, a superfície, a resolução e o alvo fora da tela são ajustados ao tamanho do contêiner.
- Sem interação com ponteiro.

## Técnica de renderização em alto nível
WebGL2 com um triângulo de tela cheia. Um shader de fragmento avalia, para cada pixel, a distância vertical a cada curva senoidal e acumula um brilho de decaimento inverso ao quadrado, com envelope de cosseno, paleta interpolada e mapeamento de tons exponencial. No modo vidro, a cena vai para uma textura e uma segunda passagem desenha uma lente esférica (máscara circular, refração radial na borda, dispersão cromática, Fresnel e especular). Mistura com alfa pré-multiplicado sobre fundo transparente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Paleta de cores (vazia = arco-íris) | lista de cores hex (até 8) | `#FF4242`, `#7C3AED`, `#06B6D4`, `#EAB308` |
| Quantidade de fios | inteiro 1–12 | 3 |
| Velocidade | número | 0,5 |
| Amplitude vertical | número | 1 |
| Ondulação (densidade de curvas) | número | 1 |
| Espessura | número | 0,7 |
| Intensidade do brilho (tone map) | número | 2,6 |
| Afunilamento nas pontas | número | 3 |
| Separação de fase entre fios | número | 1 |
| Deslocamento de matiz na paleta | número 0–1 | 0 |
| Intensidade geral | número 0–1 | 0,6 |
| Saturação | número | 1,5 |
| Opacidade | número 0–1 | 1 |
| Escala (zoom) | número | 1,5 |
| Mostrar dentro de esfera de vidro | booleano | falso |
| Refração da esfera | número | 1 |
| Dispersão da esfera | número | 1 |
| Tamanho da esfera (× 0,46 da altura) | número | 1 |
| Classe/estilo extra | — | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site. O componente ocupa toda a área.
- Paleta da demo com **três cores**: `#F97316` (laranja), `#7C3AED` (violeta), `#06B6D4` (ciano). Saturação **2**. Demais valores como os padrões.
- Controles: três seletores de cor; quantidade 1–10; velocidade 0–3 (0,1); amplitude 0–3 (0,1); ondulação 0,2–3 (0,1); espessura 0,2–4 (0,1); brilho 0,3–3 (0,05); afunilamento 0,5–6 (0,1); separação 0–3 (0,1); matiz 0–1 (0,01); intensidade 0–1 (0,05); saturação 0–2 (0,05); opacidade 0–1 (0,05); escala 0,3–3 (0,1); chave "esfera de vidro"; refração 0–3, dispersão 0–4 (0,05) e tamanho da esfera 0,3–1 (0,01), estes três desabilitados quando a esfera está desligada.

## Acessibilidade e responsividade
- Decorativo: `aria-hidden` na superfície; sem foco.
- **Recomendação**: com `prefers-reduced-motion`, congelar o tempo (renderizar um único quadro).
- **Recomendação**: pausar o laço quando o contêiner estiver fora da tela (observador de interseção) ou a aba oculta.
- Escala com a altura do contêiner; em contêineres muito largos, as pontas se apagam antes das laterais (é intencional).

## Observações de fidelidade
- **Recomendação**: a referência só reage ao redimensionamento da **janela**; use um observador de tamanho do contêiner.
- **Recomendação**: a superfície não considera a densidade de pixels; considere renderizar a min(DPR, 2) para fios mais nítidos.
- **Recomendação**: a paleta é reconstruída a cada quadro; basta recalculá-la quando as cores mudarem.
- **Recomendação**: liberar programas e alvos ao desmontar (a referência só perde o contexto).
