# Especificação: Menu com faixa corrente (flowing-menu)

## Propósito
Menu vertical de itens grandes em caixa alta, empilhados e separados por linhas finas. Ao passar o ponteiro sobre um item, uma faixa de cor contrastante "desliza" para dentro, vinda da borda (de cima ou de baixo) mais próxima do ponto de entrada, e cobre o item. Dentro dela corre um letreiro horizontal infinito que repete o texto do item intercalado com miniaturas em pílula. Ao sair, a faixa desliza para fora pela borda mais próxima do ponto de saída.

## Aparência
- **Contêiner**: 100% × 100% do pai, overflow oculto, fundo **`#120F17`** (roxo quase preto).
- **Lista**: coluna flex de altura total, sem margem nem padding. Cada item recebe uma fração igual da altura (crescimento 1).
- **Item**:
  - posicionamento relativo, overflow oculto, texto centralizado;
  - **linha superior de 1 px** na cor de borda (padrão **branco `#fff`**), exceto no primeiro item.
- **Rótulo estático do item**: link que ocupa toda a altura do item, com conteúdo centralizado nos dois eixos. Visual:
  - caixa alta, sem sublinhado e sem quebra de linha;
  - **peso 600**;
  - **tamanho 4vh** (proporcional à altura da janela);
  - cor do texto padrão **branco `#fff`**;
  - cursor de ponteiro.
- **Faixa (sobreposição)**: camada absoluta cobrindo 100% do item, com overflow oculto. Não captura ponteiro.
  - fundo padrão **branco `#fff`**;
  - em repouso, fica transladada **101%** para baixo, fora da vista.
- **Letreiro**: trilho flex horizontal, centralizado verticalmente, com largura igual ao conteúdo. Repete N vezes uma "parte" formada por:
  - **texto**: caixa alta, **peso 400**, **4vh**, entrelinha 1, padding lateral de **1vw**, sem quebra, cor padrão **`#120F17`**;
  - **miniatura**: retângulo de **200 px de largura × 7vh de altura** (mais 1em de padding vertical), margem de **2em** vertical e **2vw** horizontal, **raio de 50 px** (pílula) e imagem de fundo em "cover" centralizada.
- **Imagens (assets)**: a referência usa fotografias externas de paisagens desérticas e costeiras em preto e branco. **Não usar arquivos externos**: gerar as miniaturas proceduralmente (gradientes em escala de cinza que lembrem dunas, colinas ou horizonte, por exemplo SVG com camadas onduladas), uma por item.

## Comportamento
- **Letreiro contínuo**:
  - assim que monta, o trilho de cada item anima a translação horizontal de 0 até −(largura de uma parte), de forma linear e em repetição infinita;
  - a duração de um ciclo é o parâmetro de velocidade, padrão **15 s** (valores menores ficam mais rápidos);
  - como as partes são idênticas, o laço não tem emenda;
  - a animação roda mesmo com a faixa oculta;
  - a configuração é feita cerca de 50 ms após a montagem e refeita quando o texto, a imagem, a velocidade ou o número de repetições muda.
- **Número de repetições**: máximo entre **4** e (arredondar para cima (largura da janela ÷ largura de uma parte) + 2). É recalculado no redimensionamento da janela.
- **Entrada do ponteiro no rótulo**:
  1. Determina-se a borda mais próxima do ponto de entrada, comparando a distância quadrática ao **meio da borda superior** com a distância ao **meio da borda inferior**.
  2. A faixa é posicionada instantaneamente fora da vista, do lado dessa borda (−101% se for o topo, +101% se for a base).
  3. Ao mesmo tempo, o trilho interno é posicionado no deslocamento oposto (+101% ou −101%).
  4. Os dois animam juntos até 0% em **0,6 s** com **ease-out exponencial**.
  - O efeito é de "cortina": a faixa entra pela borda enquanto o conteúdo parece vir parado ou do lado oposto, criando um deslizamento duplo elegante.
- **Saída do ponteiro**: recalcula a borda mais próxima do ponto de saída. A faixa anima para ±101% (para fora por essa borda) e o trilho para o valor oposto, em 0,6 s com ease-out exponencial.
- Entradas e saídas rápidas interrompem a animação anterior. Os valores partem do estado atual, exceto na entrada, que reposiciona instantaneamente.
- **Clique**: navega para o link do item.

## Técnica de renderização em alto nível
DOM + CSS com transformações animadas por um motor de interpolação (timeline) ou por Web Animations API. São duas propriedades independentes no trilho, uma horizontal (letreiro em laço infinito) e outra vertical (entrada/saída), que precisam ser compostas sem uma sobrescrever a outra. Uma saída simples é usar elementos aninhados diferentes para cada eixo. A faixa usa translação vertical em porcentagem da própria altura.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens (link, texto, imagem) | array | vazio |
| Duração de um ciclo do letreiro | segundos | 15 |
| Cor do texto estático | cor CSS | `#fff` |
| Cor de fundo do menu | cor CSS | `#120F17` |
| Cor de fundo da faixa | cor CSS | `#fff` |
| Cor do texto da faixa | cor CSS | `#120F17` |
| Cor das linhas divisórias | cor CSS | `#fff` |

## Demo
- Área de **500 px de altura**, largura total, padding de **100 px em cima e embaixo** e 0 nas laterais, overflow oculto.
- O menu fica com **300 px úteis** e **4 itens**, todos com link "#" e miniatura procedural em cinza: "Mojave", "Sonoma", "Monterey" e "Sequoia".
- **Tema escuro**: cores padrão.
- **Tema claro**: quando cada cor ainda estiver no padrão, a demo troca:
  - texto para `#18181b`;
  - fundo para `#ffffff`;
  - faixa para `#18181b`;
  - texto da faixa para `#ffffff`;
  - linhas para `#e4e4e7`.
- O efeito principal depende do ponteiro. **Recomendação para a prévia**: na montagem, simular automaticamente uma passagem, por exemplo abrindo a faixa do segundo item vinda de cima, mantendo-a por cerca de 2 s e fechando-a por baixo, de forma cíclica até haver interação real.
- Controles:
  - velocidade de 1 a 60;
  - cores de texto, fundo, faixa, texto da faixa e borda.

## Acessibilidade e responsividade
- A lista é um elemento de navegação. Cada item é um link real, focável por Tab.
- O trilho do letreiro é oculto para leitores de tela, porque o texto é repetido.
- **Recomendação**: disparar a mesma abertura da faixa em `:focus-visible` (entrando pelo topo) e fechá-la no blur, já que a referência só reage ao mouse.
- **Recomendação**: com `prefers-reduced-motion`, parar o letreiro e trocar o deslizamento por um fade curto.
- **Tipografia proporcional à janela**: 4vh, 1vw e 7vh fazem o menu escalar com a janela, não com o contêiner. Em contêineres pequenos dentro de janelas grandes, o texto pode ficar desproporcional. Aceitável, mas o tamanho pode virar parâmetro.
- Em toque não há hover. O link funciona normalmente.

## Observações de fidelidade
- A referência mede a largura da janela, e não a do contêiner, para calcular as repetições. **Recomendação**: usar a largura do item.
- O atraso fixo de 50 ms para iniciar o letreiro é uma gambiarra de temporização. **Recomendação**: iniciar após a medição, por exemplo com um observador de tamanho.
- A miniatura soma padding vertical a uma `div` sem conteúdo, o que só aumenta a altura dela. O resultado visível é uma pílula de cerca de 7vh + 2em de altura. Basta reproduzir essa aparência.
