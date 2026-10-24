# Especificação: Transição de pixels (pixel-transition)

## Propósito
Um cartão com dois conteúdos, frente e verso. Ao passar o mouse, focar ou tocar, uma grade de quadrados sólidos **cobre o cartão pixel a pixel em ordem aleatória**. O conteúdo é trocado por baixo, e os quadrados se desfazem também em ordem aleatória, revelando o segundo conteúdo. O efeito lembra uma "dissolução" de videogame antigo.

## Aparência
- **Cartão**:
  - fundo **`#222`** e cor de texto igual à cor primária do tema (branco como alternativa);
  - raio de **15 px** e borda de **2 px sólida `#fff`**;
  - largura de **300 px** (máximo 100%);
  - posicionamento relativo e overflow oculto;
  - focável por Tab;
  - aceita classe e estilo extras.
- **Altura**: dada por um espaçador interno com padding superior igual à proporção configurada, em porcentagem da largura (padrão **100%**, ou seja, cartão quadrado).
- **Camadas** (todas absolutas, cobrindo 100%):
  1. primeiro conteúdo, sempre presente;
  2. segundo conteúdo, acima do primeiro e **oculto** (sem exibição) até a troca;
  3. camada de pixels, acima de tudo e sem capturar ponteiro.
- **Grade de pixels**: G × G quadrados (padrão **7 × 7**), cada um com largura e altura de 100/G % e posicionado por porcentagem. Cor sólida configurável (padrão: **cor atual do texto**). Todos começam ocultos.

## Comportamento
- **Ativar** (só se ainda não estiver ativo):
  1. todos os pixels são ocultados;
  2. os pixels aparecem **um a um, instantaneamente**, em ordem aleatória, com intervalo de D ÷ G² entre eles. A cobertura completa leva cerca de D (padrão **D = 0,3 s**);
  3. no instante D, o segundo conteúdo é exibido, sem capturar ponteiro;
  4. a partir de D, os pixels somem um a um, em **nova** ordem aleatória, com o mesmo intervalo, até cerca de 2D.
- **Desativar** (se ativo e se o modo "uma vez só" estiver desligado): a mesma sequência, mas no instante D o segundo conteúdo é ocultado e volta a capturar ponteiro.
- O estado lógico de "ativo" muda **no início** da animação.
- **Interrupção**: uma nova ativação ou desativação cancela as aparições pendentes e a troca agendada, oculta todos os pixels e recomeça do passo 1.
- **Gatilhos**:
  - em dispositivos com mouse: entrar com o mouse ou focar ativa; sair ou desfocar desativa;
  - em dispositivos de toque (detectados por suporte a toque, pontos de toque > 0 ou ponteiro "grosso"): o clique alterna.
- **Uma vez só**: depois de ativado, não volta mais ao primeiro conteúdo.
- Mudar o tamanho da grade ou a cor reconstrói os pixels.

## Técnica de renderização em alto nível
DOM puro. Os pixels são elementos absolutos criados uma vez, com tamanho e posição em porcentagem. Um agendador de animação, ou temporizadores próprios, alterna a exibição de cada pixel com atrasos escalonados em ordem embaralhada, além de uma chamada atrasada que troca a visibilidade do segundo conteúdo. Não há interpolação de opacidade: cada pixel liga e desliga de forma seca.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Primeiro conteúdo | nós React ou texto | — |
| Segundo conteúdo | nós React ou texto | — |
| Pixels por lado | inteiro | 7 |
| Cor dos pixels | cor CSS | cor atual do texto |
| Duração de cada fase, cobrir e descobrir (s) | número | 0,3 |
| Ativar uma vez só | booleano | falso |
| Proporção (altura em % da largura) | string CSS | "100%" |
| Classe e estilo extras | string / objeto | — |

## Demo
- Área de prévia em flex em coluna, com altura fixa de **400 px**, overflow oculto, conteúdo centralizado e fundo escuro do site.
- Cartão com os padrões de aparência (300 px, quadrado).
- **Primeiro conteúdo**: uma foto ocupando todo o cartão, com recorte "cover". **Asset**: a referência usa a foto de um gato tirada de um site externo. **Não usar.** Gerar uma imagem própria, por exemplo um SVG de gato estilizado (cabeça redonda, orelhas triangulares, olhos amendoados) sobre um gradiente quente de bege para laranja, embutido como data URL.
- **Segundo conteúdo**: fundo **`#111`**, conteúdo centralizado e o texto **"Meow!"** com peso 900, 3rem, em branco.
- Abaixo do cartão, com margem superior de 0,5rem, o texto atenuado "Psst, hover the card!".
- Valores da demo: grade **8**, pixels **`#ffffff`**, duração **0,4 s**, "uma vez só" desligado.
- Controles:
  - grade de 2 a 50;
  - duração de 0,1 a 2 s (passo 0,1);
  - cor;
  - chave "uma vez só" (sem remontar).
  - As demais mudanças remontam o componente.

## Acessibilidade e responsividade
- O conteúdo inativo é marcado como oculto para leitores de tela, e a marcação se inverte com o estado.
- O cartão é focável. **Recomendação**: dar a ele um indicador de foco visível e um nome acessível. Se o segundo conteúdo tiver ações, considerar papel de botão com estado expandido.
- **Recomendação**: com `prefers-reduced-motion`, trocar o conteúdo instantaneamente, sem a grade.
- Largura máxima de 100%: encolhe em telas estreitas e mantém a proporção.

## Observações de fidelidade
- A detecção de toque é avaliada durante o render, acessando a janela, o que quebra em renderização no servidor. **Recomendação**: avaliar depois da montagem.
- Com o segundo conteúdo ativo, ele **não** captura ponteiro, então links e botões dentro dele não funcionam. Isso é provavelmente indesejado. **Recomendação**: permitir interação no estado ativo e documentar.
- As posições em porcentagem podem deixar frestas de subpixel entre os quadrados. **Recomendação**: sobrepor cada pixel em cerca de 0,5 px.
- O intervalo D ÷ G² faz a cobertura completa durar ligeiramente menos que D, porque o último pixel aparece em D × (G² − 1) ÷ G². Manter.
