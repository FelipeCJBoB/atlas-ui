# Especificação: Faixas de cor curvadas (color-bends)

## Propósito
Fundo animado com faixas luminosas de cor que se curvam e se dobram como fitas de neon ou reflexos em seda, sobre fundo transparente. As faixas ondulam lentamente, giram opcionalmente e reagem ao ponteiro com um leve efeito de paralaxe e atração. Decorativo.

## Aparência
- **Contêiner**: bloco em posição relativa, 100% × 100% do pai, overflow oculto. Dentro dele, uma superfície de desenho em bloco ocupando 100% × 100%.
- **Fundo**: **transparente** por padrão (o fundo da página aparece onde não há faixa). Com transparência desligada, o fundo fica preto opaco.
- **Faixas**:
  - Com uma lista de cores (até **8**): cada cor gera uma "camada" de faixas finas e brilhantes. As camadas são quase coincidentes, com pequenos deslocamentos entre si, então as cores aparecem como bordas paralelas sobrepostas (somadas e limitadas a 1).
  - **Sem cores** (padrão: lista vazia): três camadas alimentam diretamente os canais vermelho, verde e azul, produzindo faixas iridescentes multicoloridas com franjas RGB.
- **Formato**: curvas suaves de espessura variável, mais grossas e luminosas no núcleo e com queda rápida nas bordas; tendem a se concentrar e "dobrar" ao redor do centro por causa de uma distorção de lente.
- **Intensidade**: multiplicador de brilho padrão **1,5**.
- **Grão**: ruído por pixel, que muda a cada quadro, com amplitude **0,15** (centrado em zero).
- **Orientação**: o padrão inteiro é girado em **90°** por padrão.

## Comportamento
### Campo (ideia matemática)
1. Coordenadas normalizadas em [−1, 1], deslocadas pela paralaxe do ponteiro, giradas pelo ângulo atual e corrigidas pela proporção da tela (eixo horizontal multiplicado por largura ÷ altura).
2. Divididas pela escala (padrão **1**; maior = faixas maiores).
3. **Lente**: as coordenadas são divididas por (0,5 + 0,2 × distância² ao centro), o que comprime a periferia e curva as faixas.
4. Deslocamento global que oscila com cos(tempo) × 0,2 mais um deslocamento fixo (para não começar num ponto simétrico do campo).
5. Atração ao ponteiro: soma-se (ponteiro − posição) × influência × 0,2 (influência padrão **1**).
6. **Iterações de dobra** (padrão **1**, o que significa nenhuma dobra extra; cada unidade acima de 1 acrescenta uma, até 4): a coordenada é puxada 15% em direção a um campo vetorial senoidal dela mesma (seno de 1,5 × componentes trocadas × frequência + 2 × cosseno), aumentando a complexidade.
7. **Para cada camada**: a coordenada é deslocada um pouco (0,01 por camada); calcula-se o mesmo campo senoidal e uma medida de distância a uma curva ondulada que se move com o tempo (fase −3 × tempo + índice da camada). A força de distorção (padrão **1**) mistura a versão simples com uma versão distorcida (curva de resposta forte entre 0 e 1; acima de 1 amplifica o deslocamento).
8. **Perfil da faixa**: intensidade = 1 − e^(−L ÷ e^(L × distância)), em que L é a largura de banda (padrão **6**). L maior = faixas mais finas e nítidas.
9. A frequência (padrão **1**) multiplica todas as senoides (maior = mais faixas, mais apertadas).
### Transparência
- Com transparência: o alfa de cada pixel é a maior cobertura entre as camadas, e a cor é pré-multiplicada pelo alfa. Assim as faixas se sobrepõem suavemente ao conteúdo de trás.
### Tempo e rotação
- Tempo do campo = segundos desde a montagem × velocidade (padrão **0,2**).
- Ângulo = rotação fixa (padrão **90°**, considerada módulo 360) + giro automático (padrão **0°/s**) × segundos decorridos.
### Ponteiro
- A posição do ponteiro sobre o contêiner é normalizada em [−1, 1] (y para cima). O valor efetivo persegue o alvo com suavização exponencial: a cada quadro anda mín(1, Δt × 8) da distância (constante de tempo ~125 ms).
- Paralaxe: desloca as coordenadas em ponteiro × paralaxe × 0,1 (padrão **0,5**).
- Não há reset ao sair do contêiner: o último valor permanece. Antes do primeiro movimento, o ponteiro vale (0, 0).
### Atualização
- Mudanças em rotação, giro automático, cores e transparência são aplicadas ao vivo. Na referência, os demais parâmetros recriam a superfície.
- O tamanho acompanha o contêiner por observação de tamanho (com fallback para o redimensionamento da janela). A densidade de pixels é o DPR do dispositivo limitado a **2**.

## Técnica de renderização em alto nível
WebGL com quad de tela cheia (câmera ortográfica) e shader de fragmento. A forma vem de campos vetoriais senoidais aninhados (dobra de domínio) e de uma função de distância exponencial que transforma a distância à curva em uma faixa brilhante. Saída com alfa pré-multiplicado. Cores entram como vetores RGB 0–1 (aceita hex de 3 ou 6 dígitos).

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Rotação do padrão | graus | 90 |
| Velocidade da animação | número | 0,2 |
| Cores das camadas (até 8; vazio = modo RGB) | array de hex | vazio |
| Fundo transparente | booleano | verdadeiro |
| Giro automático | graus por segundo | 0 |
| Escala | número | 1 |
| Frequência das ondas | número | 1 |
| Força de distorção | número | 1 |
| Influência de atração do ponteiro | número | 1 |
| Paralaxe do ponteiro | número | 0,5 |
| Grão | número | 0,15 |
| Iterações de dobra (1 = nenhuma) | inteiro 1–5 | 1 |
| Intensidade (brilho) | número | 1,5 |
| Largura de banda (nitidez das faixas) | número | 6 |
| Classe e estilo extras | string / objeto | — |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, sobre o fundo escuro do site (o componente é transparente).
- Valores: os padrões da tabela, com **uma única cor `#A855F7`** (violeta) — faixas violetas sobre o fundo escuro.
- Sobreposição de demonstração do site (não faz parte do componente): selo em pílula **"New Background"** e título **"You have the power to reshape your own destiny"**, centralizados (aproximação: selo pequeno translúcido; título branco ~2,5rem, peso 600). Recomenda-se que a sobreposição não bloqueie o ponteiro.
- Controles (ao vivo): cor; rotação −180 a 180 (1); giro automático −5 a 5 (1); velocidade 0–1 (0,01); escala 0,2–5 (0,1); frequência 0–5 (0,1); força de distorção 0,9–1 (0,005); influência do ponteiro 0–2 (0,05); paralaxe 0–2 (0,05); grão 0–1 (0,01); iterações 1–5 (1); intensidade 0,1–2 (0,1); largura de banda 1–20 (0,5).

## Acessibilidade e responsividade
- Decorativo: ocultar de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo e o giro automático e desativar o grão animado.
- Recomendação: pausar o laço fora da tela ou com a aba oculta (a referência não pausa).
- Responsivo: corrige a proporção, então as faixas mantêm a forma em qualquer tamanho.

## Observações de fidelidade
- **Recomendação**: atualizar todos os parâmetros ao vivo (sem recriar o contexto WebGL), como já acontece com rotação e cores.
- **Recomendação**: opcionalmente, devolver o ponteiro suavemente ao centro ao sair da área; a referência mantém a última posição.
- **Recomendação**: frequência 0 (permitida pela demo) gera campo constante (faixa uniforme ou vazia); aceitável, mas documentar.
