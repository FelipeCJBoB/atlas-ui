# Especificação: Grade de pontos com inércia (dot-grid)

## Propósito
Fundo com uma grade de pontos circulares que acendem (mudam de cor) perto do cursor e, quando o mouse passa rápido ou o usuário clica, são arremessados para longe com inércia e depois voltam ao lugar com um retorno elástico. Dá a sensação de uma malha física "viva".

## Aparência
- **Estrutura**: seção flex com conteúdo centralizado (100% × 100%, posição relativa) → invólucro de 100% × 100% em posição relativa → superfície de desenho absoluta cobrindo o invólucro, que não captura o ponteiro.
- **Pontos**: círculos sólidos com diâmetro configurável (padrão **16 px**) e espaço entre bordas (padrão **32 px**); a célula mede diâmetro + espaço.
- **Grade**: colunas = parte inteira de (largura + espaço) ÷ célula; idem para linhas. A grade resultante é **centralizada** no invólucro (a sobra é dividida igualmente entre os lados).
- **Cores**:
  - cor base, padrão **`#5227FF`**;
  - cor ativa (perto do cursor), padrão **`#5227FF`** (igual à base, então por padrão não há mudança visível de cor; a demo usa cores diferentes).
- **Gradiente de proximidade**: dentro da distância de proximidade (padrão **150 px**) do cursor, a cor do ponto é interpolada linearmente em RGB da base (na borda do raio) até a ativa (no centro), com fator t = 1 − distância ÷ proximidade. A distância considera a posição de repouso do ponto.
- A superfície é ajustada ao DPR do dispositivo (sem limite).

## Comportamento
### Rastreamento do ponteiro
- O movimento do mouse é escutado na janela e **limitado a uma amostra a cada 50 ms**.
- A cada amostra, calcula-se a velocidade (px/s) a partir do deslocamento e do tempo desde a amostra anterior (16 ms na primeira), limitada a **5000 px/s** em módulo. A posição local é relativa ao canto superior esquerdo da superfície.
- O redesenho é contínuo (todo quadro); a cor dos pontos usa a posição mais recente.
### Empurrão por movimento rápido
- Se a velocidade passa de **100 px/s**, todo ponto a menos da distância de proximidade que não esteja já em movimento recebe um arremesso:
  - velocidade inicial (px/s) = vetor cursor → ponto + velocidade do mouse × 0,005;
  - ou seja, pontos mais afastados do cursor são lançados mais forte, e o sentido do movimento do mouse acrescenta um "arrasto".
### Onda de choque por clique
- Um clique (em qualquer lugar da janela, na referência) arremessa todo ponto a menos do raio de choque (padrão **250 px**) que não esteja em movimento:
  - velocidade inicial = vetor clique → ponto × força do choque (padrão **5**) × queda;
  - queda = máx(0, 1 − distância ÷ raio).
  - Exemplo: um ponto a 100 px recebe ~300 px/s.
### Fase de inércia
- O ponto se desloca a partir da velocidade inicial e desacelera até parar, com uma **resistência** (padrão **750**, em px/s²) que funciona como atrito constante. Distância percorrida ≈ v² ÷ (2 × resistência); duração ≈ v ÷ resistência (recomendado limitar entre ~0,2 s e ~3 s). Exemplo: 300 px/s → ~60 px em ~0,4 s.
- Use uma curva de desaceleração suave (por exemplo, ease-out quadrática ou cúbica) cobrindo essa distância.
### Fase de retorno
- Ao terminar a inércia, o ponto volta ao repouso em **1,5 s** com curva **elástica de saída** (amplitude 1, período 0,75): passa um pouco do ponto, oscila e assenta.
- O ponto é liberado para novos arremessos assim que o retorno **começa**, então um novo empurrão pode interromper o retorno (a animação anterior é cancelada e a nova parte da posição atual).
### Redimensionamento
- A grade é reconstruída ao mudar o tamanho do invólucro (observação de tamanho, com fallback para a janela) e ao mudar o diâmetro ou o espaço. Os deslocamentos em curso são descartados.

## Técnica de renderização em alto nível
Canvas 2D com laço de animação contínuo: limpa, e para cada ponto translada até (repouso + deslocamento) e preenche um círculo pré-construído (caminho reutilizável). Os deslocamentos de cada ponto são animados por um motor de interpolação (tween) com suporte a inércia e a easing elástico — ou por uma implementação própria: integração da desaceleração seguida de um tween elástico. O estado dos pontos vive numa lista mutável fora do estado de renderização da UI.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Diâmetro do ponto | número (px) | 16 |
| Espaço entre pontos | número (px) | 32 |
| Cor base | hex de 6 dígitos | `#5227FF` |
| Cor ativa | hex de 6 dígitos | `#5227FF` |
| Distância de proximidade (cor e empurrão) | número (px) | 150 |
| Velocidade mínima do mouse para empurrar | número (px/s) | 100 |
| Raio da onda de choque | número (px) | 250 |
| Força da onda de choque | número | 5 |
| Velocidade máxima considerada do mouse | número (px/s) | 5000 |
| Resistência da inércia | número (px/s²) | 750 |
| Duração do retorno elástico | número (s) | 1,5 |
| Classe e estilo extras da seção | string / objeto | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, overflow oculto.
- Valores (tema escuro): diâmetro **5 px**, espaço **15 px**, base **`#2F293A`** (cinza-arroxeado escuro), ativa **`#5227FF`** (violeta-azulado vivo), proximidade **120**, raio de choque 250, força 5, resistência 750, retorno 1,5 s.
- Tema claro: enquanto as cores estiverem nos padrões, base **`#d4d4d8`** e ativa **`#7c3aed`**.
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"Organized chaos with every cursor movement!"**, centralizados (aproximação: selo pequeno translúcido; título ~2,5rem, peso 600, branco no tema escuro).
- Controles (ao vivo): cor base; cor ativa; diâmetro 2–50 (1); espaço 5–100 (1); proximidade 50–500 (10); raio de choque 50–500 (10); força 1–20 (1); resistência 100–2000 (50); duração do retorno 0,1–5 (0,1).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável. Não intercepta cliques (a superfície ignora o ponteiro).
- Recomendação: com `prefers-reduced-motion`, manter só a mudança de cor por proximidade e desativar arremessos e retorno elástico.
- Em toque, um toque gera clique e dispara a onda de choque (comportamento aceitável).
- Recomendação: pausar o laço fora da tela ou com a aba oculta.

## Observações de fidelidade
- **Recomendação**: a referência escuta cliques e movimentos na **janela inteira**, então clicar em qualquer ponto da página (até fora do componente) dispara ondas de choque nos pontos próximos da borda. Restringir ao retângulo do componente.
- **Recomendação**: antes do primeiro movimento, a referência considera o cursor em (0, 0), acendendo os pontos do canto superior esquerdo. Iniciar com o cursor "ausente".
- **Recomendação**: ao reconstruir a grade, redefinir explicitamente a transformação de escala por DPR (sem acumular sobre a anterior).
- **Recomendação**: aceitar também hex de 3 dígitos e outras notações de cor (na referência, valores inválidos viram preto na interpolação).
