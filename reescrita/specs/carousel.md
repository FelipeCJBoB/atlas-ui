# Especificação: Carrossel com giro 3D (carousel)

## Propósito
Carrossel compacto de cartões de recurso (ícone, título e descrição), navegado por **arraste horizontal** ou por pontos indicadores. Ao arrastar, os cartões giram em torno do eixo vertical, como as faces de um cubo. Pode reproduzir sozinho, funcionar em laço infinito e ter uma variante **redonda** (contêiner e cartões circulares).

## Aparência

### Contêiner
- Largura total configurável (padrão **300 px**), com posicionamento relativo e overflow oculto.
- Borda de **1 px `#555`**, raio de **24 px** e padding de **16 px**.
- **Variante redonda**: altura igual à largura e raio de 50%, formando um círculo.

### Trilho
- Flex em linha, com largura igual à de um cartão e espaço de **16 px** entre cartões.
- Perspectiva de **1000 px**. A origem da perspectiva fica no centro horizontal do cartão atual e a 50% da altura.

### Cartão
- Largura = largura total − 2 × 16 px (padrão **268 px**) e altura de 100% do trilho.
- Na variante redonda, a altura é igual à largura e o raio é de 50%.
- Fundo **`#1B1722`**, borda de **1 px `#555`** e raio de **12 px** (raio externo de 24 menos 12).
- Overflow oculto e cursor de "agarrar" (de "agarrando" enquanto pressionado).
- Coluna com conteúdo alinhado à esquerda e distribuído entre topo e base.
- Na variante redonda, o conteúdo e o texto ficam centralizados e o cartão sobe 0,1em.

### Conteúdo do cartão
- **Cabeçalho**: padding de 20 px e margem inferior de 16 px (sem padding nem margem na variante redonda). Contém um **círculo branco de 28 px** com um ícone de **16 px** em `#120F17`, centralizado.
- **Corpo**: padding de 20 px.
  - Título com **18 px**, peso **900**, branco e margem inferior de 4 px.
  - Descrição com **14 px**, branca.

### Indicadores
- Faixa centralizada abaixo do trilho.
- O grupo tem **150 px** de largura, margem superior de 16 px, padding horizontal de 32 px e pontos distribuídos por igual.
- Cada ponto:
  - círculo de **8 px**, sem borda, cursor de ponteiro;
  - **ativo** em branco `#fff` e escala **1,2**;
  - **inativo** em `#555` e escala 1;
  - a cor muda em **150 ms** e a escala em **0,15 s**;
  - foco visível com contorno de **2 px branco** afastado 2 px.
- Na variante redonda, os indicadores ficam sobrepostos de forma absoluta a **3em da base** e centralizados.

### Itens padrão
Cada item tem ícone em traço fino:
1. documento com linhas — **"Text Animations"**: "Cool text animations for your projects.";
2. círculo — **"Animations"**: "Smooth animations for your projects.";
3. camadas empilhadas — **"Components"**: "Reusable components for your projects.";
4. layout de painéis — **"Backgrounds"**: "Beautiful backgrounds and patterns for your projects.";
5. código `</>` — **"Common UI"**: "Common UI components are coming soon!".

## Comportamento

### Posição e movimento
- A posição atual é um índice inteiro. O deslocamento do trilho é −posição × (largura do cartão + 16).
- O deslocamento persegue o alvo com uma **mola**: rigidez **300**, amortecimento **30**, massa 1. É rápida e quase sem overshoot.

### Giro 3D
- O giro em Y de cada cartão *k* é uma função **linear, sem saturação**, do deslocamento atual do trilho:
  - quando o trilho está exatamente no cartão *k*, o giro é **0°**;
  - um passo inteiro antes ou depois, o giro é de **±90°** (o próximo cartão está a 90°, o anterior a −90°);
  - além disso, a função continua extrapolando.
- **Efeito**: em repouso só o cartão atual aparece de frente; os vizinhos ficam de perfil. Durante o arraste e a transição, o cartão que sai gira para longe e o que entra gira para a frente, como faces de um cubo.

### Arraste
- Somente no eixo horizontal. Desativado enquanto há uma animação de transição em curso.
- Fora do modo laço, o arraste é limitado entre o primeiro e o último cartão, com resistência elástica ao passar das pontas.
- Ao soltar:
  - avança **um** cartão se o deslocamento foi para a esquerda (qualquer valor, tolerância 0) ou se a velocidade foi menor que **−500 px/s**;
  - recua um se o deslocamento foi para a direita ou se a velocidade foi maior que +500 px/s;
  - o resultado é limitado aos índices válidos;
  - nunca pula mais de um cartão por gesto.

### Pontos
O clique num ponto vai direto para aquele cartão.

### Modo laço
- O trilho recebe uma cópia do **último** item no início e uma do **primeiro** no fim. A posição inicial é 1.
- Ao terminar uma animação que chega a uma cópia, o trilho salta **sem animação** para o item real equivalente:
  - da cópia do fim para a posição 1;
  - da cópia do início para a posição *n*.
- A transição é reativada no quadro seguinte.
- O ponto ativo é calculado de forma circular.

### Reprodução automática (padrão desligada)
- A cada intervalo (padrão **3000 ms**), avança uma posição.
- Sem laço, **para no último** cartão. Com laço, continua indefinidamente.
- Com a pausa no hover ligada, o temporizador é suspenso enquanto o ponteiro está sobre o contêiner.

### Mudanças de configuração
Mudar a quantidade de itens, o modo laço ou a largura reposiciona o trilho na posição inicial.

## Técnica de renderização em alto nível
DOM com transformações 3D. Um valor animado de deslocamento horizontal, fora do ciclo de render, alimenta tanto a translação do trilho quanto o giro de cada cartão, por mapeamento linear. São necessários um gesto de arraste com velocidade de soltura e uma animação de mola até a posição-alvo. A reimplementação pode usar uma biblioteca de animação com molas e arraste, ou uma implementação própria com eventos de ponteiro e integração de mola por quadro.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens: título, descrição, identificador e ícone (nó) | array | 5 itens padrão |
| Largura total do contêiner | número (px) | 300 |
| Reprodução automática | booleano | falso |
| Intervalo da reprodução automática | número (ms) | 3000 |
| Pausar reprodução no hover | booleano | falso |
| Laço infinito | booleano | falso |
| Variante redonda (1:1, circular) | booleano | falso |

## Demo
- Área de prévia com posicionamento relativo, **400 px de altura**, overflow oculto, fundo escuro do site e carrossel **centralizado**.
- Itens padrão com valores padrão: largura 300, sem laço, sem reprodução automática, não redondo.
- Controles:
  - largura de 250 a 330 (passo 10);
  - variante redonda;
  - laço;
  - reprodução automática;
  - intervalo de 1000 a 4000 (passo 1000; desativado sem reprodução automática);
  - pausa no hover (desativada sem reprodução automática).
- Cada mudança remonta o componente.
- Como o efeito 3D só aparece com arraste, **recomenda-se**, para a miniatura, ligar a reprodução automática com laço (intervalo ~2500 ms), para mostrar o giro entre cartões sem interação.

## Acessibilidade e responsividade
- Os pontos são botões com rótulo "Go to slide N" e indicam o item atual.
- **Recomendações não presentes na referência**:
  - papel de carrossel/região com nome;
  - cada cartão como grupo com "N de total";
  - navegação por **setas esquerda/direita** com o contêiner focado;
  - pausar a reprodução automática ao receber foco;
  - anunciar a troca de cartão numa região viva educada.
- Os cartões fora de vista (girados a ±90° e as cópias do laço) devem ficar ocultos para leitores de tela.
- Com `prefers-reduced-motion`, trocar a mola por mudança instantânea ou muito curta e desativar o giro 3D.
- A largura é fixa em pixels. Em telas muito estreitas, limitar a largura máxima a 100% do pai.

## Observações de fidelidade
- **Regras de cor conflitantes**: a referência declara duas vezes as cores dos pontos (ativo `#333`/inativo 40% de `#333` e depois `#fff`/`#555`). As últimas prevalecem. Usar **branco/`#555`**.
- **Fim da reprodução sem laço**: chega ao último cartão e para de vez, embora o temporizador continue rodando. **Recomendação**: parar o temporizador ao atingir o fim, ou voltar ao início.
- Na variante redonda, os indicadores ficam dentro do círculo e podem se sobrepor ao texto. Manter a posição (3em da base).
