# Especificação: Roda de contagem de estrelas (github-stars-wheel)

## Propósito
Um contador vertical, como uma roleta de números, que gira de 0 até a quantidade de estrelas de um repositório (arredondada a um passo, por exemplo, de 100 em 100). Uma faixa central destacada, com uma estrela à esquerda, marca o valor atual. A estrela se enche de amarelo de baixo para cima conforme a contagem avança e, ao terminar, solta uma pequena explosão de partículas amarelas.

## Aparência
- **Contêiner**:
  - largura de **112 px** e altura = altura do item × (1 + 2 × itens laterais). Com o padrão (35 px e 2 itens laterais), dá **175 px**, ou seja, 5 linhas visíveis;
  - posicionamento relativo e overflow oculto.
- **Coluna de números**:
  - cada item tem **35 px** de altura, texto alinhado ao centro na vertical e à esquerda, com recuo de **32 px** (para não cobrir a estrela);
  - números formatados com separador de milhar em inglês (vírgula): "1,200";
  - cor do texto do tema (`#0a0a0a` / `#fafafa`), tamanho de fonte herdado (16 px);
  - a coluna fica acima da faixa de destaque.
- **Faixa de destaque**:
  - centralizada na vertical (topo em 50% com translação de −50%), largura total e altura de um item (35 px);
  - fundo `#f5f5f5` a 40% (claro) / `#262626` a 40% (escuro);
  - borda de 1 px na cor de borda (`#e5e5e5` / `rgba(255,255,255,0.10)`) e raio de 8 px;
  - padding esquerdo de 8 px, conteúdo centralizado na vertical.
- **Estrela** (ícone de estrela de 5 pontas com cantos levemente arredondados, 16 px):
  - camada de base cinza: preenchimento e traço `#d4d4d4` (claro) / `#404040` (escuro);
  - camada superior idêntica, amarela (`#eab308`, preenchimento e traço), recortada por cima: só é visível uma faixa que vai da base até a porcentagem de preenchimento (recorte retangular com a borda superior em 100% − preenchimento%).
  - Use SVG próprio para a estrela.
- **Esmaecimento nas bordas**: dois degradês sobrepostos (acima da coluna), cada um com altura = altura do item × itens laterais (70 px):
  - em cima, do fundo da página opaco (topo) para transparente (meio);
  - embaixo, de transparente para o fundo opaco;
  - cor do fundo: `#ffffff` claro / `#0a0a0a` escuro.
- **Partículas**: pontos circulares de **4 px**, amarelos (`#eab308`).

## Comportamento
- **Valor-alvo**: estrelas arredondadas ao múltiplo mais próximo do passo (padrão **100**). Ex.: 3 247 → 3 200.
- **Faixa de números**: de (alvo + 2 × passo) até 0, em ordem decrescente, de passo em passo. Os valores acima do alvo existem só para preencher as linhas acima do centro no final.
- **Direção padrão ("de baixo para cima" no nome original)**:
  - a coluna tem o maior valor no topo e o 0 embaixo, ancorada pela base;
  - no início, ela é deslocada para que o **0 apareça na linha central**;
  - depois, desce até que o **alvo** apareça no centro. Os valores maiores vão entrando por cima e descendo pela faixa.
  - Deslocamento final = altura do item × (quantidade de valores − linhas visíveis).
- **Direção inversa**: coluna invertida (0 no topo), ancorada pelo topo, subindo. Os números entram por baixo.
- **Movimento**: o deslocamento persegue o destino com **mola** de rigidez **90** e amortecimento **30** (massa 1). É sobreamortecida: acelera e desacelera longamente, sem overshoot. Ela começa após o **atraso** configurado (padrão 0 ms).
- **Valor corrente**: derivado do deslocamento animado, arredondado à linha mais próxima e limitado a [0, alvo]. É usado para o preenchimento da estrela.
- **Preenchimento da estrela**: porcentagem = valor corrente ÷ alvo × 100. Enquanto não terminou, mostra **10 pontos percentuais a menos** (fica ligeiramente atrasada). Ao atingir o alvo, fica 100% amarela.
- **Conclusão**: quando o valor corrente chega ao alvo, dispara as partículas, uma única vez:
  - **6 partículas** saem da **borda superior central da estrela**;
  - cada uma vai até um ponto a **30 px** de raio, em ângulos distribuídos pela volta (ver Observações);
  - durante **0,8 s** com easing de desaceleração, a escala faz 0 → 1 → 0 e a opacidade 0 → 1 → 0;
  - a primeira parte após **0,5 s** e cada seguinte, **50 ms** depois da anterior.
- **Fonte do número**: o valor é passado diretamente. Opcionalmente, o componente aceita uma função assíncrona fornecida pelo usuário para obter a contagem. Enquanto ela não resolve, o componente não exibe nada (ou exibe a roda parada em 0).
- **Início condicionado à visibilidade** (opcional, desligado por padrão): a rolagem só começa quando o componente entra na viewport.

## Técnica de renderização em alto nível
DOM com uma coluna flex transladada verticalmente por um valor animado por mola (fora do ciclo de render). Valores derivados (linha atual, porcentagem) são calculados a partir desse valor animado e só atualizam o estado React quando a linha arredondada muda. O preenchimento da estrela é feito com `clip-path: inset(...)` sobre a cópia amarela. As partículas são elementos absolutos com animação por quadros-chave (motion ou CSS). Os esmaecimentos são degradês lineares em camadas absolutas.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Quantidade de estrelas | número | — (obrigatório na reimplementação) |
| Função opcional que obtém a contagem | função assíncrona | nenhuma |
| Passo da roda (arredondamento) | número | 100 |
| Direção | descendo (padrão) / subindo | descendo |
| Altura de cada linha | px | 35 |
| Linhas visíveis acima e abaixo do centro | inteiro | 2 |
| Atraso antes de girar | ms | 0 |
| Mola da roda | rigidez/amortecimento | 90 / 30 |
| Só começar quando visível | booleano | falso |
| Largura do contêiner | px | 112 |

## Demo
- Componente centralizado no palco (área com largura e altura totais, conteúdo centralizado).
- **Sem rede**: usar valor fixo de **3 200** estrelas, passo 100, direção padrão e atraso 0. A roda parte do 0 e gira até "3,200". A estrela enche e as partículas estouram ao final.
- Opcional: um controle discreto no canto para alternar a direção, remontando o componente.

## Acessibilidade e responsividade
- O contêiner deve expor o valor final como texto acessível (por exemplo, `aria-label` "3,200 estrelas" e `role="img"`), e a coluna animada deve ficar `aria-hidden`.
- Estrela e partículas são decorativas (`aria-hidden`).
- Com `prefers-reduced-motion`, mostre direto o alvo no centro, a estrela cheia e nenhuma partícula.
- Tamanho fixo e pequeno. Não depende da largura do contêiner.

## Observações de fidelidade
- A referência busca a contagem numa API pública da internet. **Não reproduzir**: o valor deve vir por parâmetro (e, opcionalmente, por uma função do usuário).
- Recomendação: na referência, quando o valor é fornecido junto com o identificador do repositório, o componente nunca sai do estado "carregando" e não aparece. Com valor fornecido, ele deve aparecer imediatamente.
- Recomendação: a referência converte o deslocamento em linha usando o valor absoluto, o que faz o valor corrente começar em 4 passos e cair para 2 antes de subir. Calcule a linha pelo deslocamento com sinal em relação à posição inicial: linha = (deslocamento − inicial) ÷ altura do item.
- Recomendação: a referência distribui as 6 partículas dividindo a volta por (quantidade − 1), então a primeira e a última coincidem em 0°/360°. Distribua por 360° ÷ quantidade (60° entre elas) quando o arco for a volta completa.
