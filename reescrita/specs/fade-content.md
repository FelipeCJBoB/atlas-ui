# Especificação: Conteúdo que surge (fade-content)

## Propósito
Envolve qualquer conteúdo e o faz aparecer suavemente (opacidade, e opcionalmente desfoque) na primeira vez em que ele entra na área visível durante a rolagem. Opcionalmente, depois de um tempo, o conteúdo volta a desaparecer. É um utilitário de animação de entrada.

## Aparência
- **Invólucro**: um bloco simples (`div`) sem estilo próprio, que repassa classe, estilo inline e demais atributos recebidos. O conteúdo filho é renderizado dentro dele sem alteração.
- **Estado inicial** (antes de animar): opacidade = opacidade inicial (padrão **0**). Quando a opacidade é 0, o invólucro também fica com visibilidade oculta (não é clicável nem anunciado). Se o desfoque estiver ligado, o invólucro começa com **desfoque de 10 px**; caso contrário, desfoque 0.
- Dica de desempenho para o navegador: o invólucro anuncia que opacidade, filtro e transformação vão mudar.
- **Estado final**: opacidade 1, visível, desfoque 0.

## Comportamento
- **Gatilho**: dispara **uma única vez**, quando o topo do invólucro cruza a linha situada a (1 − limiar) × 100% da altura da área de rolagem, medida a partir do topo. Com o limiar padrão **0,1**, dispara quando o topo do elemento chega a **90%** da altura da viewport (ou seja, quando 10% da tela ainda está abaixo dele). Se o elemento já estiver acima dessa linha na montagem, dispara imediatamente.
- **Área de rolagem**: por padrão, a janela. Pode-se informar outro contêiner rolável (elemento ou seletor CSS).
- **Entrada**: após um atraso (padrão **0**), anima de "estado inicial" para opacidade 1 e desfoque 0, com duração padrão de **1 s** e curva padrão **desaceleração cúbica** (ease-out de potência 3: começa rápido e assenta devagar). Ao terminar, chama um retorno opcional de conclusão.
- **Unidades de tempo**: duração, atraso, espera para sumir e duração do sumiço aceitam segundos; qualquer valor numérico **maior que 10** é interpretado como milissegundos (por isso o padrão de duração pode ser dado como 1000).
- **Sumiço opcional**: se o tempo de espera para sumir for maior que 0 (padrão **0**, desligado), após a entrada terminar e passado esse tempo, anima de volta à opacidade inicial (e ao desfoque de 10 px, se ligado) com duração padrão **0,5 s** e curva padrão **aceleração cúbica** (ease-in de potência 3). Ao terminar, chama um retorno opcional de "sumiço concluído". Não reaparece depois.
- **Curvas suportadas na demo**: desaceleração cúbica; quique de saída (bounce out clássico de Penner); elástica de saída com amplitude 1 e período 0,3. Para o sumiço: aceleração cúbica; quique de entrada; elástica de entrada (1; 0,3).
- **Desmontagem**: cancela gatilho e animações pendentes.
- Mudanças de parâmetros após a montagem não têm efeito (a configuração é lida uma vez); a demo remonta o componente a cada mudança.

## Técnica de renderização em alto nível
DOM puro com animação de `opacity`, `visibility` e `filter: blur()`. O gatilho pode ser implementado com um observador de interseção (margem inferior negativa equivalente ao limiar) ou com uma biblioteca de animação por rolagem. A animação pode usar uma biblioteca de tweening ou animações nativas do navegador com as curvas descritas.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Conteúdo a animar | nós React | — |
| Contêiner de rolagem a observar | elemento ou seletor | janela |
| Usar desfoque na transição | booleano | falso |
| Duração da entrada | número (s, ou ms se > 10) | 1 s |
| Curva da entrada | nome de curva | desaceleração cúbica |
| Atraso antes da entrada | número (s/ms) | 0 |
| Limiar de visibilidade (fração da altura da viewport) | 0–1 | 0,1 |
| Opacidade inicial | 0–1 | 0 |
| Espera para sumir após entrar (0 = nunca) | número (s/ms) | 0 |
| Duração do sumiço | número (s/ms) | 0,5 s |
| Curva do sumiço | nome de curva | aceleração cúbica |
| Retorno ao terminar a entrada | função | nenhum |
| Retorno ao terminar o sumiço | função | nenhum |
| Classe, estilo e atributos extras | — | vazio |

## Demo
- Área de prévia relativa com **400 px de altura**, conteúdo centralizado, fundo do tema; botão de recarregar no canto (remonta e reexecuta a animação).
- Conteúdo: um cartão de **200 × 100 px**, raio **25 px**, borda de 1 px na cor de borda sutil do tema, fundo de cartão do tema, com o texto **"Fade"** centralizado (~20 px, peso 800, cor de texto primária do tema).
- Valores iniciais da demo: duração 1 s, atraso 0, limiar 0,1, opacidade inicial 0, sem desfoque, sem sumiço.
- Controles (cada mudança remonta): curva de entrada (3 opções); curva de sumiço (3 opções); desfoque on/off; duração 0,5–3 s (0,1); atraso 0–2 s (0,1); limiar 0,1–1 (0,1); opacidade inicial 0–1 (0,1); espera para sumir 0–5 s (0,1); duração do sumiço 0,5–3 s (0,1).

## Acessibilidade e responsividade
- Com opacidade inicial 0, o conteúdo fica invisível e fora da árvore de acessibilidade até animar; garantir que ele sempre apareça (o gatilho também deve disparar se o elemento já estiver visível na montagem).
- Recomendação: com `prefers-reduced-motion`, mostrar o conteúdo imediatamente (ou apenas um fade curto sem desfoque).
- Recomendação: o modo "sumir depois" esconde conteúdo do usuário; usar só para elementos decorativos.
- Não afeta layout: o espaço do conteúdo é reservado desde o início.

## Observações de fidelidade
- Recomendação: a referência procura, por padrão, um contêiner de rolagem com um identificador específico do site de documentação; não reproduzir — usar a janela como padrão.
- Recomendação: a regra "> 10 significa milissegundos" é ambígua (um atraso de 15 s vira 15 ms); manter por compatibilidade, mas documentar, ou aceitar explicitamente a unidade.
- Recomendação: a duração padrão aparece como 1000 (ms) no componente e 1 (s) na demo — ambos equivalem a 1 s.
