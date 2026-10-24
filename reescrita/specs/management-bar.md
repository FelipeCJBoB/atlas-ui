# Especificação: Barra de gestão (management-bar)

## Propósito

Uma barra flutuante de ações para triagem de candidatos (ou itens em geral): paginação com número animado ("1 / 10"), três botões de ação compactos só com ícone que se expandem revelando o rótulo no hover ("Blacklist", "Reject", "Hire"), e um botão de chamada principal "Move to: Interview I" com atalho de teclado. O layout se reorganiza conforme a largura disponível.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Texto atenuado | `#737373` | `#a1a1a1` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |

### Barra

- Envolvida por um invólucro de largura total que centraliza a barra e serve de **contêiner de consulta de largura** (os breakpoints abaixo são da largura desse invólucro, não da janela).
- Barra: largura ajustada ao conteúdo, cantos de **16 px**, borda de 1 px na cor de borda, fundo da página, padding de **8 px**, sombra grande `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`.

### Paginação (grupo 1)

- Linha de 40 px de altura: [‹] [número / 10] [›].
- Setas: chevrons de traço, **20 px**, padding de 4 px, cor atenuada; hover → cor do texto (transição de cor curta); desabilitadas → cor atenuada com **30%** de opacidade (também no hover).
- Centro: margem lateral de 8 px, 4 px entre itens, 14 px, algarismos tabulares, alinhado ao centro:
  - número atual com dígitos que rolam verticalmente (ver Comportamento), na cor do texto;
  - "/ 10" na cor atenuada.

### Ações (grupo 2)

- Três botões, 8 px entre eles, em linha (podem quebrar linha em telas abaixo de 640 px de largura de janela).
- Cada botão: altura **40 px**, cantos de **10 px**, padding 10 px × 8 px, conteúdo em linha alinhado ao centro com 8 px entre ícone e rótulo, sem quebra, excedente oculto; ícone de **20 px** que não encolhe; rótulo de 14 px.

| Botão | Ícone | Fundo claro | Fundo escuro | Cor claro | Cor escuro |
|---|---|---|---|---|---|
| Blacklist | círculo cortado por uma diagonal (proibido) | `#e5e5e5` a 60% | `#525252` a 80% | `#525252` | `#e5e5e5` |
| Reject | "X" | `#ffc9c9` a 60% | `#9f0712` a 80% | `#e7000b` | `#ffa2a2` |
| Hire | crachá/cartão de identificação | `#b9f8cf` a 60% | `#016630` a 80% | `#00a63e` | `#7bf1a8` |

### Chamada principal (grupo 3)

- Botão de altura 40 px, padding 12 px × 8 px, cantos de 10 px, texto 14 px branco, centralizado.
- Fundo **`#00bba7`** (teal); hover **`#009689`**. No escuro: fundo `#009689` a 80%, hover `#005f5a`. Transição de cor de 300 ms.
- Conteúdo: "Move to:" (cor `#e5e5e5`, 4 px à direita) + "Interview I" + divisor vertical de 1 × 20 px branco a 40% (margem lateral 12 px, cantos redondos) + selo de atalho: fundo branco a 20%, cantos de 6 px, padding 6 px × 2 px, margem direita −4 px, 4 px entre itens, com ícone do símbolo "⌘" de 14 px e a letra "E".

### Divisores e layout responsivo

- Divisores verticais: 1 × 24 px, cor de borda, cantos redondos, margem lateral de 12 px.
- Largura do invólucro **< 512 px**: tudo empilhado em coluna, centralizado, 8 px de espaço vertical: paginação; ações; chamada principal ocupando a largura total. Sem divisores.
- **≥ 512 px**: paginação e ações lado a lado, com divisor entre eles; chamada principal abaixo, largura total.
- **≥ 576 px**: tudo numa linha: paginação | ações | chamada principal (largura automática), com divisores entre os grupos.

## Comportamento

### Paginação

- Página inicial 1, total fixo 10.
- "‹" diminui (desabilitado na página 1); "›" aumenta (desabilitado na página 10).
- **Número rolante**: cada dígito é uma coluna de 1 "ch" que mostra um algarismo por vez; ao mudar o valor, cada coluna rola verticalmente do algarismo antigo para o novo pelo caminho mais curto do círculo 0–9, com uma **mola** de rigidez **200**, amortecimento **20**, massa **0,4**. Quantidade de colunas = dígitos do valor (de 9 para 10 surge uma coluna nova à esquerda, que rola a partir de 0). Na montagem, a coluna rola de 0 até 1.

### Botões de ação (expansão)

- **Repouso**: largura máxima **40 px** (só o ícone aparece); rótulo com opacidade 0, deslocado 4 px para a direita e invisível.
- **Hover**: largura máxima vai a **140 px** com mola de rigidez **200**, amortecimento **35**, com **atraso de 0,15 s**; o rótulo fica visível e vai para opacidade 1 e deslocamento 0 com mola de rigidez **200**, amortecimento **25** (sem atraso — o rótulo aparece enquanto o botão ainda está se abrindo, recortado pelo excedente oculto).
- **Saída**: largura máxima volta a 40 px com mola de rigidez **250**, amortecimento **25**; rótulo volta a opacidade 0 e deslocamento 4 px (mola 200/25).
- **Pressionar**: escala **0,95** (mola 250/25); o rótulo também fica visível.
- Os vizinhos se deslocam suavemente com a mudança de largura (animação de layout no grupo).
- Sem ação de clique na referência.

### Chamada principal

- Pressionar: escala **0,975** com mola rápida (rigidez 550, amortecimento 30). Sem ação.

## Técnica de renderização em alto nível

- DOM/CSS com consultas de contêiner para o layout responsivo.
- Botões de ação com variantes nomeadas (repouso/hover/pressionado) propagadas do botão para o rótulo; animação de largura máxima por mola e animação de layout no grupo para suavizar o reposicionamento dos irmãos.
- Número da paginação: colunas de dígitos com dez algarismos sobrepostos transladados por um valor contínuo animado por mola (altura de um algarismo medida, com valor de reserva).

## Parâmetros configuráveis

A referência não tem parâmetros (tudo fixo). Recomenda-se expor:

| Significado | Tipo | Padrão |
|---|---|---|
| Total de páginas | inteiro | 10 |
| Página inicial / controlada + aviso de mudança | inteiro / função | 1 |
| Ações (ícone, rótulo, cores, ação) | lista | Blacklist, Reject, Hire |
| Rótulo e destino da chamada principal + ação | strings / função | "Move to:" / "Interview I" |
| Atalho exibido no selo | string | "E" (com ⌘) |

## Demo

- A barra centralizada na área de prévia, fundo do tema, com os valores padrão acima. Sem controles.
- A área tem largura suficiente para o layout de uma linha (≥ 576 px); em larguras menores, ver o empilhamento.

## Acessibilidade e responsividade

- Botões de ação já têm nome acessível (o rótulo). **Recomendação**: dar nomes às setas ("Página anterior", "Próxima página") e anunciar a página atual (texto "Página 1 de 10" para tecnologias assistivas; colunas de dígitos ocultas).
- Recomendação: expandir os botões de ação também no foco por teclado e mostrar anel de foco visível.
- Recomendação: o atalho ⌘E exibido não está implementado; implementar opcionalmente ou marcar como decorativo.
- Movimento reduzido: recomendação — expandir/recolher sem mola e trocar dígitos sem rolagem.
- Responsivo por consulta de contêiner (ver Layout).

## Observações de fidelidade

- **Recomendação — atraso só na abertura**: o atraso de 0,15 s vale apenas para a abertura; o fechamento é imediato. Manter.
- Depois do primeiro hover, o rótulo continua "visível" mas com opacidade 0 no repouso; isso não tem efeito visual.
- **Recomendação — semântica**: os botões não têm tipo explícito; dentro de um formulário enviariam o formulário. Definir tipo "botão".
