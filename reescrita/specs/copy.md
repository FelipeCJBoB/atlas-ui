# Especificação: Botão de copiar (copy)

## Propósito

Um botão quadrado, só com ícone, que copia um texto para a área de transferência. Ao copiar com sucesso, o ícone de "copiar" (duas folhas sobrepostas) se transforma num ícone de "confirmado" (✓) com uma animação de escala e desfoque, e volta sozinho ao ícone original depois de alguns segundos.

## Aparência

### Tokens de cor do tema (tema neutro)

| Token | Tema claro | Tema escuro |
|---|---|---|
| Fundo da página | `#ffffff` | `#0a0a0a` |
| Texto | `#0a0a0a` | `#fafafa` |
| Primária | `#0a0a0a` | `#fafafa` |
| Texto sobre primária | `#fafafa` | `#0a0a0a` |
| Secundária / destaque | `#f5f5f5` | `#262626` |
| Texto sobre secundária / destaque | `#171717` | `#fafafa` |
| Destrutiva | `#e7000b` | `#ff6467` |
| Borda | `#e5e5e5` | `rgba(255,255,255,0.10)` |
| Campo ("input") | `#e5e5e5` | `rgba(255,255,255,0.15)` |
| Anel de foco | `#a1a1a1` | `#737373` |

### Base

- Caixa flexível (bloco, não em linha), conteúdo centralizado, cantos de **8 px**, não encolhe, sem contorno nativo.
- Ícone: **16 × 16 px** de traço fino na cor do texto do botão (14 px no tamanho extra-pequeno). Não captura ponteiro.
- Foco por teclado: borda na cor do anel + anel externo de 3 px na cor do anel com 50% de opacidade.
- Desabilitado: 50% de opacidade, sem ponteiro. Inválido: borda e anel destrutivos (20% / 40% no escuro).
- Transições curtas de cor, borda e sombra.
- Sombra "extra-sutil" quando indicada: `0 1px 2px 0 rgb(0 0 0 / 0.05)`.

### Variantes

| Variante | Fundo | Ícone | Borda | Sombra | Hover |
|---|---|---|---|---|---|
| Padrão | primária | texto sobre primária | — | sutil | primária com 90% de opacidade |
| Destaque | destaque | texto sobre destaque | — | sutil | destaque com 90% |
| Destrutiva | destrutiva (escuro: 60% de opacidade) | branco | — | sutil | destrutiva com 90% |
| Contorno | fundo da página (escuro: campo 30% ≈ `rgba(255,255,255,0.045)`) | texto | 1 px borda (escuro: cor de campo) | sutil | fundo destaque (escuro: campo 50%) |
| Secundária | secundária | texto sobre secundária | — | sutil | secundária com 80% |
| Fantasma | transparente | herdado | — | — | fundo destaque (escuro 50%) |
| Link | transparente | primária | — | — | sublinhado (sem efeito visível num botão só de ícone) |

### Tamanhos

| Tamanho | Dimensões |
|---|---|
| Padrão | 36 × 36 px |
| Extra-pequeno | 28 × 28 px (ícone 14 px) |
| Pequeno | 32 × 32 px |
| Grande | 40 × 40 px |

### Ícones

- **Copiar**: dois retângulos de cantos arredondados sobrepostos em diagonal (um à frente, outro atrás deslocado para cima e à esquerda), em traço.
- **Confirmado**: um "✓" em traço.
- Use os ícones equivalentes do conjunto de ícones de traço disponível no projeto.

## Comportamento

### Escala do botão

- Hover: escala 1 → **1,05**. Pressionar: escala **0,95**. Mola de rigidez **550**, amortecimento **30**, massa 1.

### Copiar

1. No clique, primeiro chama o manipulador de clique de quem usa (se houver).
2. Se o estado "copiado" estiver sendo controlado de fora e for verdadeiro, não faz mais nada.
3. Se houver texto a copiar, escreve-o na área de transferência (API assíncrona do navegador).
4. Ao concluir com sucesso:
   - o estado passa a "copiado" e o ícone troca para ✓;
   - avisa quem usa: (verdadeiro, texto copiado);
   - agenda o retorno: depois do atraso (padrão **3000 ms**), o estado volta a "não copiado" e avisa (falso).
5. Em caso de falha (permissão negada, contexto inseguro), registra o erro no console e não muda o ícone.

### Troca de ícone

- O ícone que sai e o que entra ficam sobrepostos no centro durante a troca (o que sai é retirado do fluxo de layout imediatamente).
- **Entrada**: escala 0 → 1, opacidade 0,4 → 1, desfoque 4 px → 0.
- **Saída**: escala 1 → 0, opacidade 1 → 0,4, desfoque 0 → 4 px; o elemento só é removido ao fim.
- Duração **0,25 s**, curva suave de aceleração e desaceleração (ease-in-out).
- O mesmo vale na volta (✓ → copiar).

### Estado controlado

- O estado "copiado" pode ser controlado por fora (valor + aviso de mudança). Sem controle externo, é interno e começa como "não copiado".

## Técnica de renderização em alto nível

- Botão nativo com classes por variante e tamanho; escala por mola.
- Ícone dentro de um elemento animado com presença (entrada/saída), chaveado pelo estado, no modo em que o elemento que sai deixa de ocupar espaço.
- Desfoque via filtro CSS animado.
- Um temporizador para o retorno automático.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Texto a copiar | string | obrigatório |
| Estado "copiado" controlado de fora | booleano opcional | ausente (interno) |
| Aviso de mudança do estado (copiado, texto) | função | nenhum |
| Tempo até voltar ao ícone de copiar, em ms | número | 3000 |
| Variante (padrão, destaque, destrutiva, contorno, secundária, fantasma, link) | enumeração | padrão |
| Tamanho (padrão, extra-pequeno, pequeno, grande) | enumeração | padrão |
| Manipulador de clique, classe extra e atributos de botão | — | repassados |

## Demo

- Um botão centralizado na área de prévia, que copia o texto **"Hello world!"**.
- Controles: variante (as sete; padrão selecionada) e tamanho (padrão, extra-pequeno, pequeno, grande; padrão selecionado).

## Acessibilidade e responsividade

- Recomendação (não presente na referência): dar nome acessível ao botão ("Copiar") e anunciar "Copiado" por uma região viva educada ou trocando o nome acessível enquanto o ✓ aparece.
- Os ícones são decorativos (ocultos para tecnologias assistivas).
- Teclado: Enter/Espaço disparam a cópia (botão nativo).
- Movimento reduzido: recomendação — trocar o ícone sem escala/desfoque e desativar a escala do botão.

## Observações de fidelidade

- **Recomendação — aviso duplicado**: a referência avisa "copiado = verdadeiro" duas vezes por clique (uma pela mudança de estado e outra explicitamente, com o texto). Avisar uma vez só, com o texto.
- **Recomendação — cliques repetidos**: sem controle externo, cliques durante o estado "copiado" copiam de novo e criam outro temporizador; o primeiro temporizador devolve o ícone antes da hora. Reiniciar o temporizador a cada cópia.
- **Recomendação — limpeza**: cancelar o temporizador no desmonte.
- Se não houver API de área de transferência, considerar um caminho alternativo ou ao menos não quebrar.
