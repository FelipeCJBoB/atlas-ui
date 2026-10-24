# Especificação: Abas de código (code-tabs)

## Propósito
Um cartão com várias versões de um mesmo trecho de código (por exemplo, a configuração para editores ou gerenciadores de pacote diferentes), escolhidas por abas no cabeçalho. A aba ativa é marcada por um sublinhado que desliza entre os rótulos. O conteúdo troca com um deslizamento horizontal, com desfoque nos painéis inativos, e a altura do cartão se ajusta suavemente. Um botão copia o código da aba ativa.

## Aparência
- **Cartão**:
  - largura total do pai, coluna sem espaçamento interno entre as partes;
  - fundo `#f5f5f5` a 50% (claro) / `#262626` a 50% (escuro);
  - borda de 1 px na cor de borda (`#e5e5e5` / `rgba(255,255,255,0.10)`);
  - raio de **14 px** e overflow oculto.
- **Cabeçalho (lista de abas)**:
  - altura de **40 px**, largura total;
  - fundo `#f5f5f5` (claro) / `#262626` (escuro);
  - borda inferior de 1 px na cor de borda com 75% de opacidade (claro) / 50% (escuro);
  - padding horizontal de 16 px, sem padding vertical;
  - conteúdo distribuído: abas à esquerda, botão de copiar à direita;
  - sem raio próprio.
- **Abas**: em linha, com **12 px** de espaço entre elas e ocupando toda a altura do cabeçalho. Cada rótulo:
  - texto de **14 px**, peso 500, sem padding horizontal;
  - cor atenuada (`#737373` / `#a1a1a1`) quando inativo e cor do texto corrente (`#0a0a0a` / `#fafafa`) quando ativo.
- **Indicador**: barra de **2 px** de altura colada à base da aba ativa, com a largura exata do rótulo, cantos superiores totalmente arredondados, preta no tema claro e branca no escuro. Não há fundo ou sombra atrás da aba.
- **Botão de copiar**:
  - quadrado de 28 px, transparente, raio de 8 px;
  - ícone de 14 px de "copiar", que vira "check";
  - hover com fundo `rgba(0,0,0,0.05)` (claro) / `rgba(255,255,255,0.10)` (escuro);
  - margem direita negativa de 10 px para alinhar opticamente à borda.
- **Painel de código**:
  - padding de 16 px e overflow com rolagem;
  - fonte monoespaçada de **13 px**, fundo transparente e sem borda;
  - linhas centralizadas verticalmente no painel;
  - realce com a mesma paleta "GitHub" claro/escuro: texto `#24292e`/`#e1e4e8`, chaves de objeto e números `#005cc5`/`#79b8ff`, strings `#032f62`/`#9ecbff`, comentários `#6a737d`, palavras-chave `#d73a49`/`#f97583`.

## Comportamento
- **Aba inicial**: a do valor controlado, a do valor inicial ou, na falta dos dois, a primeira chave da coleção de códigos.
- **Clique numa aba** ativa a aba e avisa a mudança (callback opcional). Também pode ser controlado de fora.
- **Indicador**: desliza horizontalmente e ajusta a largura até a nova aba com **mola** de rigidez **200** e amortecimento **25** (assentamento suave, com um toque mínimo de overshoot). Na primeira exibição, aparece já no lugar, sem animação de entrada.
- **Troca de painel**:
  - todos os painéis ficam lado a lado numa faixa horizontal, cada um com 100% da largura e um respiro de 8 px entre eles;
  - a faixa se desloca para −(índice ativo × 100%) com **mola** de rigidez **300** e amortecimento **30**, sem quique;
  - os painéis inativos ficam **desfocados 4 px** e o ativo, nítido, com transição por mola de rigidez 200 e amortecimento 25;
  - os painéis inativos são inertes (não focáveis nem clicáveis).
- **Altura**: o contêiner dos painéis anima a altura até a altura do painel ativo com a mesma mola 300/30, e observa mudanças de tamanho do painel ativo para se reajustar. A altura é arredondada para o pixel físico.
- **Copiar**: copia o código **cru** da aba ativa, troca o ícone por "check" por **3000 ms** (troca com encolhimento, opacidade 0,4 e desfoque de 4 px em 0,25 s) e avisa a mudança do estado "copiado".
- **Carregamento**: a referência só mostra abas e botão depois de preparar o realce. Na reimplementação, com realce síncrono, tudo aparece de imediato.

## Técnica de renderização em alto nível
DOM com animações por mola. O indicador é um elemento único com posição e largura animadas, medidas no rótulo ativo (ou uma animação de layout compartilhada que move o mesmo elemento entre as abas). A troca de painéis é uma faixa flex transladada, e a altura do contêiner é animada a partir de `ResizeObserver`. **Sem biblioteca de realce**: escreva um tokenizador próprio e simples por expressões regulares (pelo menos JSON e shell/bash) que gere `span` coloridos. Nada de HTML injetado.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Códigos por rótulo de aba | mapa rótulo → string | — |
| Linguagem do realce | `json` / `bash` / `tsx`… | `bash` |
| Aba inicial (não controlado) | string | primeira chave |
| Aba ativa (controlado) + aviso de mudança | string + função | — |
| Mostrar botão de copiar | booleano | verdadeiro |
| Aviso de mudança do estado "copiado" | função | — |
| Mola do indicador | rigidez/amortecimento | 200 / 25 |
| Mola da troca de painel e da altura | rigidez/amortecimento | 300 / 30 |

## Demo
- Cartão com **largura total até ~560 px**, centralizado no palco; linguagem **JSON**.
- Duas abas: **"Cursor"** e **"Windsurf"**. Cada uma contém um comentário de uma linha indicando o arquivo de destino (`// Copy and paste the code into .cursor/mcp.json` e `// Copy and paste the code into .codeium/windsurf/mcp_config.json`, respectivamente), seguido do mesmo objeto JSON de configuração:

```
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "shadcn@canary", "registry:mcp"],
      "env": {
        "REGISTRY_URL": "@animate-ui/registry.json"
      }
    }
  }
}
```

(Conteúdo de exemplo da demo.)

## Acessibilidade e responsividade
- O cabeçalho tem papel de lista de abas, cada rótulo é um botão com papel de aba e `aria-selected`, e cada painel tem papel de painel de abas, ligado por `aria-controls`/`aria-labelledby`.
- Recomendação: navegação por setas esquerda/direita entre as abas, Home/End e foco *roving*, com indicador de foco visível.
- O botão de copiar precisa de nome acessível, e o estado "copiado" deve ser anunciado.
- Com `prefers-reduced-motion`, troque as molas por mudanças instantâneas e remova o desfoque.
- O cartão ocupa 100% da largura do pai. Código largo rola na horizontal dentro do painel.

## Observações de fidelidade
- Recomendação: a referência usa o rótulo da aba como chave de tudo. Rótulos repetidos não são suportados. Documente isso ou use índices internos.
- Recomendação: a referência injeta o HTML do realce sem sanitizar e, se o realce falhar, cai para o texto cru injetado como HTML. Renderize sempre texto escapado ou nós React.
