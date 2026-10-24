# Especificação: Navegação radial com ponteiro (radial-nav)

## Propósito
Um pequeno menu de navegação circular. Botões redondos ficam sobre a circunferência de um anel e, no centro, uma seta de cursor gira para apontar o item ativo. O item ativo se expande em pílula e revela o rótulo. É útil como seletor de seção compacto e lúdico.

## Aparência
- **Anel**:
  - círculo de **180 px** de diâmetro (configurável);
  - borda de **1 px** em `#262626` no tema claro ou `#e5e5e5` no tema escuro;
  - sem preenchimento;
  - conteúdo centralizado.
- **Ponteiro central**:
  - ícone de **seta de cursor de mouse** (silhueta de seta clássica apontando para o canto superior esquerdo, só contorno ou levemente preenchida) de **20 px**, na cor do texto principal;
  - centralizado no anel e girando em torno do próprio centro;
  - decorativo.
- **Posição dos itens**:
  - cada item recebe um ângulo em graus, com **0° = 12 h** e valores positivos no **sentido horário** (negativos no anti-horário);
  - o **centro** do botão fica exatamente sobre a linha do anel, a uma distância do centro igual a (diâmetro ÷ 2 − 0,5 px);
  - o botão é centralizado nesse ponto (deslocado −50% em X e em Y). Por isso, ao se expandir, ele cresce **simetricamente** para os dois lados.
- **Botão (repouso)**:
  - círculo de **40 px** (altura 40, largura mínima 40, largura máxima 40) com padding de **8 px**;
  - borda de 1 px na mesma cor do anel, fundo da página e texto na cor principal;
  - peso de fonte 500;
  - conteúdo em linha com **4 px** de espaço;
  - overflow oculto e sem quebra de linha.
- **Ícone do botão**: **20 px**, sem encolher, deslocado **1 px** para a direita para compensar visualmente e centralizar no círculo.
- **Rótulo**: texto de **14 px** ao lado do ícone. Em repouso, fica invisível, com largura 0, opacidade 0 e deslocado 4 px para a direita.
- **Botão ativo**: largura máxima de **140 px**, formando uma pílula com ícone à esquerda e rótulo visível à direita.

## Comportamento
- **Estado**: id do item ativo. O valor inicial vem do parâmetro de item inicial, ou nenhum.
- **Clique em um botão**: torna o item ativo e dispara o callback de mudança com o id.
- **Expansão / recolhimento**:
  - ao ativar, a largura máxima vai de 40 px a 140 px por **mola** (rigidez **200**, amortecimento **35**), com atraso de **0,05 s**;
  - o rótulo entra por mola (rigidez **200**, amortecimento **25**): opacidade de 0 a 1, deslocamento X de 4 px a 0, tornando-se visível e com largura automática;
  - ao desativar, o botão volta a 40 px com mola de rigidez 200 e amortecimento 25, e o rótulo volta ao repouso (opacidade 0 e X +4 px).
  - Na montagem, não há animação: o item ativo inicial já aparece expandido.
- **Rotação do ponteiro**:
  - ângulo-alvo = ângulo do item ativo + **45°**, porque a seta naturalmente aponta 45° à esquerda do "para cima". Sem item ativo, o alvo é 45° (aponta para as 12 h).
  - O ponteiro gira pelo **caminho mais curto**: o alvo é normalizado para 0–360° e então ajustado em múltiplos de 360° para ficar o mais próximo possível do ângulo anterior. Assim, ir de −115° a +115° não dá uma volta longa, e o ângulo acumulado pode ultrapassar 360°.
  - A rotação usa mola de rigidez **220** e amortecimento **26**.
- **Hover**: nenhum efeito específico além do cursor padrão do botão.
- **Teclado**: botões nativos (Tab + Enter/Espaço ativam).

## Técnica de renderização em alto nível
DOM + CSS. Os itens têm posicionamento absoluto calculado por coordenadas polares (seno e cosseno do ângulo, com a origem às 12 h). A largura máxima, a opacidade, o deslocamento do rótulo e a rotação do ponteiro são animados com molas (biblioteca de animação ou mola amortecida própria). A lógica de "rotação mais curta" mantém um ângulo acumulado entre renderizações.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Diâmetro do anel | número (px) | 180 |
| Itens: id numérico, ícone, rótulo, ângulo em graus (0 = topo, horário positivo) | array | obrigatório |
| Tamanho do ícone dentro do botão | número (px) | 20 |
| Diâmetro do botão recolhido | número (px) | 40 |
| Padding interno do botão | número (px) | 8 |
| Item ativo inicial | id | nenhum |
| Callback ao mudar o item ativo | função (id) | nenhuma |

As três opções do botão podem ser passadas parcialmente; as omitidas assumem o padrão.

## Demo
- Anel de 180 px centralizado na área de prévia (fundo do tema). Deixar folga lateral para as pílulas expandidas (≥ 80 px de cada lado).
- Três itens, com o primeiro ativo inicialmente:
  1. "Projects" — ícone de grade 2×2 de quadrados arredondados — 0° (topo);
  2. "Bookmarks" — ícone de marcador de página (fita com entalhe em V embaixo) — −115° (inferior esquerdo);
  3. "About" — ícone de silhueta de usuário (cabeça e ombros) — +115° (inferior direito).
- Ícones de traço fino de 2 px, desenhados em SVG próprio.

## Acessibilidade e responsividade
- A referência usa papel de **menu** / **item de menu** com `aria-pressed`. Essa combinação é semanticamente incorreta: menus exigem navegação por setas, e `aria-pressed` não se aplica a itens de menu. **Recomendação**: usar `nav` com uma lista de botões e `aria-current="page"` no ativo, ou um grupo de abas/botões de alternância (`aria-pressed`) sem papel de menu.
- Cada botão tem nome acessível igual ao rótulo, mesmo quando recolhido. O ponteiro central é `aria-hidden`.
- Recomendação: indicador de foco visível (anel de 2 px) e navegação por setas entre os itens, opcional.
- Com `prefers-reduced-motion`, trocar as molas por mudanças instantâneas.
- Tamanho fixo em px. Em telas estreitas, garantir espaço para a pílula expandida de até 140 px centrada sobre o anel.

## Observações de fidelidade
- A configuração do botão define uma escala de 0,95 para o estado "pressionado", mas ela nunca é acionada na referência. Recomendação opcional: aplicar escala de 0,95 ao pressionar.
- O texto do rótulo não tem truncamento: rótulos maiores que cerca de 140 px − ícone − paddings são cortados pelo overflow. Recomendação: manter rótulos curtos ou calcular a largura máxima pelo conteúdo.
