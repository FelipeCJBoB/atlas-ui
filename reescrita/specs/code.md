# Especificação: Bloco de código com digitação (code)

## Propósito
Um cartão de código-fonte no estilo de editor: cabeçalho com ícone, nome do arquivo e botão de copiar, e corpo com o código destacado por sintaxe. Opcionalmente, o código é "digitado" caractere a caractere ao longo de um tempo total, com um cursor de texto piscando no fim e rolagem automática para acompanhar a última linha.

## Aparência
- **Cartão**:
  - coluna flex com posicionamento relativo e overflow oculto;
  - borda de 1 px na cor de borda do tema (`#e5e5e5` claro / `rgba(255,255,255,0.10)` escuro);
  - raio de **10 px**;
  - fundo levemente acinzentado: `#f5f5f5` a 50% de opacidade no claro e `#262626` a 50% no escuro.
- **Cabeçalho**:
  - altura de **40 px** e largura total, sem encolher;
  - fundo `#f5f5f5` (claro) / `#262626` (escuro);
  - borda inferior de 1 px na cor de borda com 75% de opacidade no claro e 50% no escuro;
  - padding horizontal de 16 px, itens alinhados ao centro, espaço de 8 px entre eles;
  - texto de **14 px** na cor atenuada (`#737373` claro / `#a1a1a1` escuro);
  - ícone opcional de **16 px** à esquerda, depois o texto (nome do arquivo);
  - botão de copiar opcional, encostado à direita.
- **Botão de copiar**:
  - quadrado de 28 px em estilo "fantasma" (sem fundo; no hover, fundo `#f5f5f5` claro / `#262626` a 50% escuro), raio de 8 px, padding de 8 px;
  - ícone de 14 px de "duas folhas sobrepostas" (copiar), que vira um "visto" (check) após copiar;
  - escala de 1,05 no hover e 0,95 ao pressionar.
- **Corpo do código**:
  - padding de 16 px, overflow com rolagem nos dois eixos;
  - fonte monoespaçada de **13 px**, sem fundo próprio (transparente sobre o cartão) e sem borda;
  - linhas sem padding lateral, espaços preservados.
- **Cores de sintaxe** (paleta de inspiração "GitHub", claro / escuro):
  - texto padrão `#24292e` / `#e1e4e8`;
  - palavras-chave (`import`, `function`, `return`, `export`, `type`, `const`…) `#d73a49` / `#f97583`;
  - strings `#032f62` / `#9ecbff`;
  - nomes de função e tipo `#6f42c1` / `#b392f0`;
  - números, constantes, propriedades e atributos JSX `#005cc5` / `#79b8ff`;
  - tags JSX `#22863a` / `#85e89d`;
  - comentários `#6a737d` / `#6a737d`.
- **Cursor de digitação** (opcional): enquanto a digitação não termina, um caractere de barra vertical "|" com 1 caractere de largura fica logo após o último caractere da última linha, levemente deslocado 1 px para cima e para a esquerda.

## Comportamento
- **Sem digitação**: o código completo aparece destacado imediatamente.
- **Com digitação**:
  - espera o **atraso inicial** (padrão 0 ms); até lá, o corpo fica vazio;
  - depois revela **um caractere por passo**, em intervalos iguais a duração total ÷ número de caracteres (duração padrão **5000 ms**). A contagem é por ponto de código Unicode, para não partir emojis;
  - a cada passo, o trecho visível é destacado de novo e o corpo **rola suavemente até o fim**, para a última linha ficar à vista;
  - ao revelar o último caractere, marca o estado "concluído": o cursor some e é disparado um aviso opcional de conclusão;
  - opcionalmente, um aviso de progresso a cada passo informa índice, total e se terminou.
- **Início condicionado à visibilidade** (opcional, desligado por padrão): só começa quando o bloco entra na viewport (com margem configurável), uma única vez por padrão.
- **Copiar**:
  - clicar copia o código **completo** (não só o já digitado) para a área de transferência;
  - em caso de sucesso, troca o ícone por "check" por **3000 ms** e depois volta;
  - a troca de ícones usa uma transição de 0,25 s em que o ícone que sai encolhe até escala 0 com opacidade 0,4 e desfoque de 4 px, enquanto o que entra faz o caminho inverso.
- **Tema**: o realce segue o tema claro/escuro do ancestral (paleta acima).

## Técnica de renderização em alto nível
DOM puro. **Não há biblioteca de realce disponível**: implemente um tokenizador próprio e leve por expressões regulares para TS/TSX/JS e JSON (comentários, strings, palavras-chave, números, identificadores seguidos de "(", tags JSX e nomes de atributo). Renderize os tokens como elementos `span` coloridos dentro de `pre > code`, uma linha por elemento, para que o cursor possa ser um pseudo-elemento depois da última linha. Não injete HTML cru. A digitação é um temporizador de intervalo fixo (ou um laço de animação que calcula quantos caracteres já deveriam estar visíveis pelo tempo decorrido, o que é mais robusto). O botão de copiar usa a API de área de transferência.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Código-fonte | string | — |
| Linguagem para o realce | `tsx` / `ts` / `js` / `json` / texto | `tsx` |
| Ícone do cabeçalho | componente | nenhum |
| Texto do cabeçalho (nome do arquivo) | nó | — |
| Mostrar botão de copiar | booleano | falso |
| Animar digitação | booleano | falso |
| Duração total da digitação | ms | 5000 |
| Atraso antes de começar | ms | 0 |
| Mostrar cursor durante a digitação | booleano | falso |
| Só começar quando visível | booleano | falso |
| Margem da detecção de visibilidade / disparar uma vez | string / booleano | "0px" / verdadeiro |
| Aviso de conclusão e de progresso | funções | — |
| Tempo mostrando o "check" após copiar | ms | 3000 |

## Demo
- Cartão de **420 × 372 px** centralizado no palco.
- Cabeçalho com o **logotipo de átomo** (núcleo circular + três órbitas elípticas giradas 0°, 60° e 120°), desenhado em **SVG próprio** de 16 px na cor do texto atenuado, seguido do texto `my-component.tsx`, e com o botão de copiar ligado.
- Digitação ligada, cursor ligado, duração de **~8000 ms** e atraso de **500 ms** (valores escolhidos para a prévia mostrar o efeito logo).
- Código exibido (TSX):

```
'use client';

import * as React from 'react';

type MyComponentProps = {
  myProps: string;
} & React.ComponentProps<'div'>;

function MyComponent(props: MyComponentProps) {
  return (
    <div {...props}>
      <p>My Component</p>
    </div>
  );
}

export { MyComponent, type MyComponentProps };
```

(Este trecho é conteúdo de exemplo da demo, não código do componente.)

## Acessibilidade e responsividade
- O botão de copiar precisa de nome acessível ("Copiar código"), e o estado "copiado" deve ser anunciado numa região *live* educada.
- O corpo do código deve ser focável quando houver rolagem (tabindex 0), para permitir a rolagem pelo teclado.
- Durante a digitação, marque o bloco com `aria-busy` e exponha o código completo a leitores de tela (por exemplo, texto oculto visualmente), para não anunciar caractere a caractere.
- Com `prefers-reduced-motion`, mostre o código completo de imediato e use rolagem instantânea.
- A largura e a altura vêm de fora. O corpo rola quando o conteúdo excede o espaço.

## Observações de fidelidade
- Recomendação: a referência destaca o código inteiro de novo a cada caractere (custo quadrático) e rola o contêiner duas vezes por passo. Basta destacar de forma incremental ou com limite de frequência, e rolar uma vez por quadro.
- Recomendação: a referência copia o código completo mesmo durante a digitação. Mantenha esse comportamento, que é o esperado.
- Recomendação: na referência, se a digitação estiver desligada, o estado "concluído" nunca é marcado. Nesse caso, trate como concluído desde o início, para o cursor nunca aparecer.
