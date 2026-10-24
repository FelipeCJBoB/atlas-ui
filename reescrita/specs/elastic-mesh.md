# Especificação: Malha elástica (elastic-mesh)

## Propósito
Uma "folha" retangular de cantos arredondados, levemente inclinada em perspectiva, que se comporta como um tecido elástico: quando o ponteiro passa (ou arrasta) sobre ela, a superfície forma uma bolha que sobe em direção ao observador e se repuxa para o ponteiro; ao soltar, ondula e volta a ficar plana. A folha mostra um gradiente de duas cores ou uma imagem, com uma grade de linhas opcional que evidencia a deformação. Uso decorativo em heros e cartões.

## Aparência
- **Contêiner**: bloco relativo, 100% × 100% do pai, altura mínima 0. Desativa os gestos de toque padrão (o toque é capturado pelo efeito, não rola a página).
- **Superfície de desenho**: ocupa todo o contêiner, fundo **transparente**, com antisserrilhado e resolução até 2× DPR.
- **Folha**: retângulo que, em repouso, ocupa a largura e a altura do contêiner reduzidas a cerca de **82%** (margem proporcional em volta) e projetado com **inclinação de 14°** em torno do eixo horizontal (o topo se afasta, a base se aproxima, efeito de trapézio sutil), com câmera em perspectiva a distância 4,6 (em unidades em que a altura da folha mede 2).
- **Cantos**: arredondados com raio padrão **25 px** (limitado à metade do menor lado), com borda antisserrilhada de ~1,25 px. O arredondamento é calculado em coordenadas da própria folha, então os cantos acompanham a deformação.
- **Preenchimento**:
  - Sem imagem: gradiente vertical de **`#5227FF`** (violeta forte, no topo) para **`#B19EEF`** (lilás claro, na base).
  - Com imagem: a imagem esticada para preencher toda a folha (sem preservar proporção).
- **Grade** (ligada por padrão): linhas finas brancas (**`#ffffff`**), com opacidade **0,28**, formando **20** células em cada direção da folha. Espessura aparente de ~1,5 px de tela, antisserrilhada. A opacidade da linha é modulada pela iluminação difusa (45% a 100%), então as linhas ficam mais visíveis nas faces viradas para a luz.
- **Iluminação falsa** (intensidade padrão **0,5**): luz direcional vinda de cima-esquerda-frente (direção aproximada (−0,35; 0,55; 0,78)). Componentes:
  - escurecimento de base de 28% × intensidade;
  - difuso Lambert somado em 55% × intensidade;
  - oclusão/realce por profundidade: pontos elevados ficam até 25% mais claros e pontos afundados até 35% mais escuros;
  - brilho especular Blinn-Phong (expoente 26) na cor de realce (padrão **branco**), normalizado de modo que a folha plana não brilhe — só as encostas da deformação acendem — com peso 25% × intensidade.

## Comportamento

### Modelo físico
- A folha é uma grade de **25 × 25** nós (configurável, limitada a 6–40). Cada nó tem um deslocamento 3D em relação à posição de repouso e uma velocidade.
- Simulação em **passo fixo de 1/120 s**, com no máximo **5 subpassos por quadro**; o tempo acumulado em excesso é descartado (e o passo de quadro é limitado a 0,25 s).
- Em cada subpasso, a aceleração de cada nó é a soma de:
  - **mola de retorno** à posição plana: −rigidez × deslocamento (rigidez padrão **0,05**);
  - **acoplamento entre vizinhos** (laplaciano discreto com os 4 vizinhos ortogonais): coeficiente = 0,06 + ondulação × 0,032 (ondulação padrão **5**, ou seja, 0,22). Mais acoplamento espalha a deformação em ondas maiores;
  - **força do ponteiro** (se ativo): para nós a uma distância d menor que o raio de captura efetivo R = max(0,08; raio) × 1,4 (raio padrão **0,6** em unidades da folha, onde a altura mede 2), com t = d/R:
    - empurrão para fora do plano (em direção ao observador) proporcional a (1 − t²)², com intensidade 6 × força;
    - puxão no plano em direção ao ponteiro com perfil t·(1 − t)² × 6,75 (máximo em t = 1/3, zero no centro e na borda), intensidade 1,6 × força;
    - força = puxão × 0,009 (puxão padrão **0,4**).
- Integração: velocidade = (velocidade + aceleração) × (1 − amortecimento) (amortecimento padrão **0,2**); posição += velocidade; cada componente do deslocamento é limitada a ±1,2.
- Após os subpassos, recalculam-se as **normais** de cada nó por diferenças centrais com os vizinhos (produto vetorial das tangentes, sempre orientadas para o observador), usadas na iluminação.
- O resultado visual com os padrões: uma bolha macia que segue o cursor com pequeno atraso, as linhas da grade se comprimem em volta dela, e ao sair a folha oscila algumas vezes e assenta em menos de ~1 s.

### Ponteiro
- A posição do ponteiro é convertida da tela para o plano da folha **desfazendo a perspectiva e a inclinação** (interseção do raio com o plano em repouso), de modo que a bolha fique exatamente sob o cursor mesmo com a folha inclinada.
- A posição usada pela física persegue o alvo com suavização exponencial de constante **60 ms**.
- **Modo "pairar"** (padrão): ativo enquanto o mouse estiver sobre o contêiner; inativo ao sair.
- **Modo "arrastar"**: ativo apenas enquanto o botão está pressionado (o ponto salta imediatamente para o local do clique); soltar em qualquer lugar da janela desativa.
- **Toque**: em qualquer modo, tocar/arrastar ativa e move; levantar o dedo desativa.
- **Desligado**: com a interação desabilitada, a folha permanece plana (mas continua renderizada e assenta de qualquer deformação anterior).
- **Movimento reduzido**: se o sistema preferir movimento reduzido, a interação é desativada completamente.

### Atualização de parâmetros
Cores, grade, realce, raio dos cantos, inclinação, iluminação, física e modo de interação valem no quadro seguinte sem reiniciar. Trocar a imagem ou a resolução da malha recria tudo.

### Redimensionamento
Observa o tamanho do contêiner; a proporção da folha acompanha a do contêiner (largura em unidades = 2 × proporção).

## Técnica de renderização em alto nível
WebGL com uma malha triangulada (N−1)² quads. Física de massa-mola em JavaScript na CPU; a cada quadro os deslocamentos e normais são enviados como atributos de vértice. O shader de vértice aplica rotação em X (inclinação) e projeção perspectiva simples. O shader de fragmento faz o preenchimento (gradiente ou textura), iluminação Lambert + Blinn-Phong, linhas de grade por função de distância à borda da célula, e recorte de retângulo arredondado via campo de distância assinada com transparência na borda. Mistura alfa ligada. O laço de animação roda continuamente.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Imagem a deformar (vazio = gradiente) | URL | vazio |
| Cor do topo do gradiente | cor hex | `#5227FF` |
| Cor da base do gradiente | cor hex | `#B19EEF` |
| Cor do brilho especular | cor hex | `#ffffff` |
| Mostrar grade | booleano | verdadeiro |
| Número de células da grade | número | 20 |
| Opacidade das linhas | 0–1 | 0,28 |
| Cor das linhas | cor hex | `#ffffff` |
| Raio dos cantos | número (px) | 25 |
| Rigidez de retorno | número | 0,05 |
| Amortecimento | 0–1 | 0,2 |
| Raio de captura (fração da folha) | número | 0,6 |
| Intensidade do puxão | número | 0,4 |
| Ondulação (acoplamento entre vizinhos) | número | 5 |
| Inclinação em perspectiva | graus | 14 |
| Intensidade da iluminação | número | 0,5 |
| Nós por lado da malha | inteiro 6–40 | 25 |
| Modo de interação | pairar / arrastar | pairar |
| Interação habilitada | booleano | verdadeiro |
| Classe, estilo e atributos extras do contêiner | — | vazio |

## Demo
- Área de prévia em coluna, relativa, **460 px de altura**, padding de 24 px, overflow oculto, fundo do tema do site.
- O componente preenche a área. Por padrão a demo **usa uma imagem** (uma foto paisagem 900×600 de banco aleatório). **Não usar arquivo externo**: gerar proceduralmente uma imagem de exemplo, por exemplo uma paisagem estilizada com céu em degradê, sol circular e camadas de montanhas em silhueta, desenhada num canvas fora da tela. Interruptor "usar imagem" alterna entre essa imagem e o gradiente.
- Legenda centralizada na parte de baixo (12 px do fundo, fonte pequena, cor atenuada): **"Move your cursor across the sheet."**, ou **"Click and drag across the sheet."** no modo arrastar.
- Controles: usar imagem; cor 1; cor 2; cor da grade; mostrar grade; densidade da grade 4–40 (1); opacidade da grade 0–1 (0,01); realce; rigidez 0,02–0,15 (0,005); amortecimento 0,03–0,25 (0,01); raio de captura 0,15–0,8 (0,01); puxão 0–1 (0,02); ondulação 0–8 (1); inclinação 0–32 (1); iluminação 0–1,5 (0,05); raio dos cantos 0–80 (1); resolução 10–36 (1); seletor de modo de interação; interruptor habilitado. Algumas mudanças remontam o componente.

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; se a imagem tiver significado, oferecer descrição textual (recomendação).
- Respeita `prefers-reduced-motion` desativando a deformação.
- Acompanha qualquer tamanho/proporção do contêiner.
- Em toque, o efeito captura o gesto (sem rolagem da página sobre ele) — considerar isso em layouts móveis.

## Observações de fidelidade
- Recomendação: o laço roda o tempo todo, mesmo com a folha em repouso; pausar quando a energia (deslocamento e velocidade máximos) estiver abaixo de um limiar e não houver ponteiro ativo, e quando fora da viewport.
- Recomendação: reagir a mudanças de `prefers-reduced-motion` em tempo real (a referência lê só na montagem).
- Recomendação: liberar buffers/texturas explicitamente ao desmontar.
- Imagem remota da demo substituída por imagem procedural (sem rede).
