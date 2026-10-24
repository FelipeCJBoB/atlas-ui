# Especificação: Fogos de artifício em anel (fireworks-circle)

## Propósito
Variação de configuração do fundo de fogos de artifício (ver especificação `fireworks`). Usa **valores fixos**, em vez de faixas aleatórias, para velocidade e tamanho dos foguetes e das partículas. Como todas as partículas de uma explosão saem com a mesma velocidade, cada explosão forma um **anel circular nítido** que se expande, desacelera, cai em bloco pela gravidade e se apaga. A peça é a mesma do `fireworks`. Se for implementada como componente separado, deve reutilizar o mesmo motor.

## Aparência
Igual à do `fireworks`:
- superfície 2D transparente cobrindo o contêiner;
- foguetes como rastros de linha com pontas arredondadas;
- partículas como círculos preenchidos com opacidade decrescente.

Diferenças visuais:
- Todos os foguetes têm a **mesma espessura**, e todas as partículas, o **mesmo raio**.
- Cada explosão é um **anel**: as partículas ficam sobre uma circunferência comum, com densidade irregular (ângulos aleatórios). Elas se apagam em momentos diferentes (taxa de apagamento ainda aleatória, entre 0,005 e 0,02 por quadro), então o anel "se desfaz" aos poucos.
- Cor única dependente do tema: **branco** (escuro) / **preto** (claro).

## Comportamento
Mesmo motor do `fireworks`, com os valores por quadro em referência de 60 qps:
- lançamento automático a cada 300–800 ms ÷ densidade;
- partida da base em x entre 10% e 90%, com alvo entre 10% e 40% da altura;
- desvio de ±0,3 rad em relação à vertical;
- gravidade de 0,02 no foguete;
- explosão de 50 a 149 partículas com ângulo aleatório;
- atrito de 0,98 e gravidade de 0,05 nas partículas;
- clique lança um foguete que explode na altura do clique.

Com velocidade de partícula fixa v, o raio do anel cresce como v × (1 − 0,98ⁿ) ÷ 0,02 após n quadros, tendendo a **50 × v px**, enquanto o anel inteiro desce pela gravidade acumulada.

**Valores da prévia**, escolhidos para o anel ficar evidente, já que a referência expõe esses números como controles sem padrão recuperável:
- densidade **2**;
- velocidade do foguete **6 px/quadro**;
- espessura do foguete **3 px**;
- velocidade das partículas **4 px/quadro** (anel de até ~200 px de raio);
- raio das partículas **2 px**.

## Técnica de renderização em alto nível
Canvas 2D com laço por quadro, idêntico ao do `fireworks`. A única diferença é a passagem de números fixos em vez de faixas {mín, máx}.

## Parâmetros configuráveis
Os mesmos do `fireworks`. Aqui, os de velocidade e tamanho são **números fixos**:

| Significado | Tipo | Padrão nesta variação |
|---|---|---|
| Densidade de lançamentos | número | 2 |
| Velocidade do foguete | número (px/quadro) | 6 |
| Espessura do foguete | número (px) | 3 |
| Velocidade das partículas | número (px/quadro) | 4 |
| Raio das partículas | número (px) | 2 |
| Cor | string | tema (branco/preto) |

## Demo
- Preenche toda a área de prévia (absoluto, inset 0) com raio de 14 px e fundo do palco.
- Valores da prévia acima. Opcional: controles discretos no canto para densidade (1–10), velocidade do foguete (2–12), espessura (1–8), velocidade das partículas (1–10) e raio das partículas (1–6), cada um com número fixo.
- Os primeiros foguetes saem imediatamente.

## Acessibilidade e responsividade
Igual ao `fireworks`:
- superfície decorativa com `aria-hidden`;
- com `prefers-reduced-motion`, sem lançamento automático;
- pausar fora da viewport;
- acompanha o tamanho do contêiner.

## Observações de fidelidade
- Valem as mesmas correções do `fireworks`: dimensionar pelo contêiner e não pela janela, usar coordenadas locais no clique, cancelar o temporizador ao desmontar e ajustar ao *device pixel ratio*.
- Recomendação: como a densidade irregular dos ângulos aleatórios deixa o anel "falhado", é aceitável distribuir os ângulos de forma uniforme com um pequeno ruído (±metade do espaçamento). Isso deixa o anel mais limpo, mantendo o caráter orgânico.
