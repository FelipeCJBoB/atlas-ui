# Especificação: Cursor de mira (target-cursor)

## Propósito
Substitui o cursor do sistema por uma "mira": um ponto central e quatro cantoneiras em L que giram continuamente. Ao passar sobre elementos marcados como alvo, a mira para de girar e as quatro cantoneiras saltam para os cantos do elemento, enquadrando-o como um visor de câmera; ao sair, voltam a formar a mira pequena e o giro recomeça.

## Aparência
- **Invólucro**: elemento renderizado diretamente no fim do corpo do documento (portal), posicionamento **fixo** no canto superior esquerdo da janela, tamanho 0 × 0, sem capturar ponteiro, z-index máximo (**2147483647**) e modo de mistura **diferença** (fica sempre contrastante com o que estiver por baixo). Sua posição (translação) é o ponto do cursor.
- **Ponto central**: círculo de **4 px**, centrado no ponto do cursor, na cor do cursor (padrão **branco `#ffffff`**).
- **Cantoneiras** (4): quadrados de **12 px** com borda de **3 px** sólida na cor do cursor, mostrando só dois lados (formando um "L"):
  - superior esquerda: lados de cima e da esquerda;
  - superior direita: cima e direita;
  - inferior direita: baixo e direita;
  - inferior esquerda: baixo e esquerda.
- **Posição de repouso das cantoneiras** (relativa ao ponto): o canto externo de cada uma fica a **18 px** do centro nos dois eixos; cada cantoneira ocupa de 6 a 18 px. O conjunto forma um quadrado de 36 × 36 px com aberturas de 12 px no meio de cada lado.

## Comportamento

### Seguir o cursor
- A cada movimento do mouse (na janela inteira), o invólucro interpola até a posição do ponteiro em **0,1 s** com desaceleração cúbica (leve atraso).
- Posição inicial: centro da janela.
- **Compensação de bloco de contenção**: se algum ancestral do invólucro tiver transformação, perspectiva, filtro, `will-change` desses, ou `contain` de pintura/layout, o posicionamento fixo deixa de ser relativo à janela. Nesse caso, mede-se o retângulo desse ancestral e subtrai-se seu deslocamento. Reavaliado ao redimensionar a janela.

### Giro
- Em repouso, o invólucro gira **360° a cada 2 s** (padrão), linear e infinito, girando ponto e cantoneiras juntos.

### Clique
- Pressionar: o ponto vai a **0,7×** em 0,3 s e o invólucro a **0,9×** em 0,2 s.
- Soltar: ambos voltam a 1× nos mesmos tempos.

### Travar num alvo
- Detecção: ao entrar o mouse em qualquer elemento, procura-se, do elemento sob o ponteiro até o corpo, o **primeiro ancestral (ou ele mesmo)** que corresponda ao seletor de alvo (padrão: elementos com a classe de alvo). Se for o mesmo alvo já ativo, nada muda.
- Ao travar:
  1. o giro é pausado e a rotação vai **instantaneamente a 0°**;
  2. se houver cor de alvo, cantoneiras e ponto mudam para ela em **0,15 s**;
  3. mede-se o retângulo do alvo e calculam-se as posições das cantoneiras **3 px para fora** de cada canto (cantoneiras alinhadas pelo lado externo);
  4. as cantoneiras interpolam até essas posições em **0,2 s** (desaceleração quadrática);
  5. uma "força de travamento" sobe de 0 a 1 no tempo de transição configurado (padrão **0,2 s**). A cada quadro, enquanto ativa, as cantoneiras são recalculadas para continuar nos cantos do alvo mesmo com o ponto se movendo dentro dele: avançam a fração = força da distância até o alvo, com interpolação de **0,05 s** enquanto a força < 0,99 e de **0,2 s** depois (efeito **paralaxe**: as cantoneiras ficam ligeiramente "elásticas" em relação ao movimento). Com paralaxe desligado, depois de travadas, ficam rígidas (sem interpolação).
- O ponto central continua seguindo o mouse livremente dentro do alvo.

### Sair do alvo
- Ao sair do elemento (ou quando, durante uma rolagem, o elemento sob o ponto deixa de ser o alvo):
  1. a força volta a 0 e o cálculo por quadro é desligado;
  2. a cor volta à do cursor em 0,15 s (se houver cor de alvo);
  3. as cantoneiras voltam à posição de repouso em **0,3 s** com desaceleração cúbica;
  4. após **50 ms**, se nenhum outro alvo foi travado, o giro recomeça a partir do ângulo atual, completando a volta proporcionalmente e depois seguindo em laço.

### Cursor nativo
- Se a opção estiver ligada (padrão), o cursor nativo do corpo do documento é escondido enquanto o componente estiver montado e restaurado ao desmontar.

### Dispositivos móveis
- Se houver tela de toque **e** largura ≤ **768 px**, ou o agente de usuário indicar celular/tablet, o componente **não renderiza nada**.

### Mudanças de parâmetro
- Alterar a duração do giro recria o giro com a nova velocidade. Demais mudanças reiniciam a configuração.

## Técnica de renderização em alto nível
Somente DOM: elementos absolutos dentro de um invólucro fixo, movidos por transformações animadas por uma biblioteca de interpolação temporizada (ou implementação própria baseada em `requestAnimationFrame` com curvas de desaceleração). Um laço por quadro, ativo apenas enquanto há alvo travado, recalcula as cantoneiras. Mistura por diferença para contraste automático. Portal para o corpo do documento.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Seletor CSS dos elementos-alvo | string | seletor da classe de alvo do componente |
| Duração de uma volta do giro | número (s) | 2 |
| Esconder o cursor nativo | booleano | verdadeiro |
| Duração do travamento no alvo | número (s) | 0,2 |
| Paralaxe das cantoneiras no alvo | booleano | verdadeiro |
| Cor do cursor | cor CSS | `#ffffff` |
| Cor ao travar num alvo | cor CSS | nenhuma (mantém a cor) |

## Demo
- Área de prévia com **400 px de altura**, coluna centralizada, overflow oculto, fundo do site. O cursor atua na página inteira.
- Título **"Hover Below."**, tamanho fluido entre 2rem e 3rem (6vw), peso 600, margem inferior de 1,5rem.
- Grade de 3 colunas com espaço de 1rem e quatro alvos: **"THIS"**, **"FEELS"**, **"QUITE"** na primeira linha e **"SNAPPY!"** ocupando as 3 colunas na segunda. Cada alvo: texto centralizado, cor **`#B497CF`**, borda de **1 px tracejada `#B497CF`**, raio de **15 px**, peso 600, tamanho fluido entre 1rem e 2rem (4vw), padding de 0,5rem × 1,5rem.
- Valores da demo: cor de alvo **`#B497CF`**; cor do cursor branca no tema escuro e **`#18181b`** no claro (se não alterada).
- Controles: duração do giro 0,5–5 s (0,1); duração do travamento 0,1–1 s (0,05); chaves "esconder cursor" e "paralaxe"; seletores de cor do cursor e cor no alvo.

## Acessibilidade e responsividade
- O invólucro é decorativo: `aria-hidden`. Nunca captura ponteiro.
- **Recomendação**: esconder o cursor nativo também em elementos interativos que definem o próprio cursor (links, botões), via uma regra global aplicada só enquanto o componente estiver ativo; e garantir que o foco por teclado continue visível (o cursor customizado não substitui indicadores de foco).
- **Recomendação**: com `prefers-reduced-motion`, desativar o giro contínuo.
- **Recomendação**: detectar dispositivo sem mouse por `(hover: none) and (pointer: coarse)` em vez de agente de usuário.

## Observações de fidelidade
- **Defeito a corrigir (recomendação)**: o retângulo do alvo é medido só ao entrar; se a página rolar ou o alvo mudar de tamanho sem o ponteiro sair, as cantoneiras ficam no lugar antigo. Remedir a cada quadro enquanto travado (ou em rolagem/redimensionamento).
- **Recomendação**: usar eventos de ponteiro em vez de mouse.
- **Recomendação**: ao desmontar durante a pausa de 50 ms, cancelar o temporizador pendente.
