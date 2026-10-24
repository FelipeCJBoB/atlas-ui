# Especificação: Número Deslizante (sliding-number)

## Propósito

Exibe um número cujos dígitos "rolam" na vertical, como um odômetro ou um contador mecânico, quando o valor muda. Também pode fazer uma contagem animada a partir de um valor inicial até o valor final, com separadores de milhar e casas decimais.

## Aparência

- **Componente**
  - É um elemento em linha flexível, com os itens alinhados ao centro na vertical.
  - Herda fonte, tamanho e cor do contexto e não define cor própria.
- **Coluna de dígito** (cada posição do número)
  - Caixa em linha com exatamente 1 "ch" de largura, que é a largura do caractere zero.
  - Altura de linha 1.
  - Algarismos tabulares, ou seja, todos com a mesma largura.
  - Corte vertical: só se vê um algarismo por vez. Na horizontal o conteúdo pode transbordar.
  - A altura da coluna vem de um "0" invisível que ocupa o espaço.
  - Os dez algarismos (0 a 9) ficam sobrepostos sobre esse espaço, centralizados, e deslocados na vertical.
- **Sinal negativo**: quando o valor é negativo, aparece um "−" (hífen) antes dos dígitos, com 4 px (0,25rem) de margem à direita.
- **Separadores**
  - O separador de milhar, se fornecido, é inserido entre colunas a cada três dígitos contados da direita. Nunca aparece antes do primeiro dígito nem depois do último.
  - O separador decimal aparece entre a parte inteira e a fracionária, só se houver parte fracionária.
  - Separadores são texto simples, sem animação.

## Comportamento

### Valor exibido

- O valor exibido é sempre o valor absoluto. O sinal é tratado à parte.
- Com um número fixo de casas decimais, o valor é formatado com exatamente essas casas. Por padrão são zero casas, então só a parte inteira aparece.

### Rolagem de cada coluna

- Cada coluna representa uma ordem de grandeza: unidades, dezenas, centenas e assim por diante. Na parte decimal, cada coluna é uma posição da fração.
- A coluna guarda um valor contínuo entre 0 e 10 que indica qual algarismo está centralizado. Quando o algarismo-alvo muda, esse valor vai até o novo algarismo por uma **mola**:
  - rigidez 200
  - amortecimento 20
  - massa 0,4

  Essa combinação é rápida, com um leve balanço no final.
- Cada um dos dez algarismos da coluna se posiciona assim:
  - deslocamento vertical = (algarismo − valor contínuo) × altura da coluna, tomado de forma circular (módulo 10);
  - o resultado é ajustado para a faixa de cerca de −4 a +5 alturas;
  - na prática, algarismos "maiores" que o atual ficam abaixo e os "menores" ficam acima, sempre pelo caminho mais curto do círculo.
  - Exemplo: de 9 para 0, a coluna rola um passo para a frente, não nove para trás.
- Quando a coluna ainda não foi medida (altura desconhecida), os algarismos ficam invisíveis até a medição.
- Na montagem, cada coluna começa no algarismo correspondente ao **valor anterior** e rola para o algarismo do valor atual. Sem histórico, o valor anterior é 0, então no primeiro render todas as colunas partem do 0.

### Dois modos de animação

**A. Sem valor inicial informado (troca direta)**

- O número exibido passa a ser o valor-alvo imediatamente.
- Cada coluna rola de forma independente do seu algarismo antigo para o novo. Não existem números intermediários.
- Quando o componente aparece, todas as colunas rolam a partir do 0.

**B. Com valor inicial informado (contagem)**

- Um valor numérico interno parte do valor inicial e segue até o alvo por uma **mola lenta**: rigidez 90, amortecimento 50. É uma curva sem oscilação perceptível, com desaceleração longa.
- A cada mudança, o valor intermediário é arredondado para as casas decimais configuradas (ou para inteiro) e exibido. As colunas então rolam para os algarismos de cada valor intermediário.
- O resultado é uma contagem: a coluna das unidades gira rapidamente várias voltas e as colunas mais altas avançam mais devagar.
- A cada novo valor exibido, um retorno de chamada opcional é avisado com esse valor.
- Quando o alvo muda depois, a contagem continua do valor atual até o novo alvo.

### Atraso

- Um atraso em milissegundos (padrão 0) adia o início da contagem do modo B.
- O mesmo atraso adia a rolagem das colunas decimais.

### Largura variável e preenchimento com zeros

- Sem preenchimento, o número de colunas inteiras é o número de dígitos do valor exibido no momento. Durante a contagem, as colunas vão surgindo à esquerda conforme o número cresce.
- Com preenchimento ativado, o número de colunas é o maior entre a quantidade de dígitos do alvo e a do valor exibido. Os dígitos que faltam à esquerda aparecem como zeros. Exemplo: "0.000" a caminho de "2.025".
- Se o valor anterior tinha mais dígitos que a largura atual, só os dígitos finais dele são considerados. Na parte decimal, o anterior é truncado ou completado com zeros à direita para ter o mesmo número de casas.

### Visibilidade na tela (opcional)

- Com a opção de "só animar quando visível" ligada:
  - a contagem do modo B só começa quando o componente entra na área visível, com uma margem configurável;
  - antes disso, o modo A mostra 0 e o sinal negativo não aparece.
- Por padrão a detecção acontece uma vez só. Depois de visível, sair da tela não reinicia nada.
- Com a opção desligada (padrão), tudo é considerado visível desde o início.

### Estável na montagem (opcional)

- Com essa opção ligada, o número aparece já no valor-alvo, sem animar na montagem.
- Só as mudanças posteriores do alvo animam.

## Técnica de renderização em alto nível

- É composição de elementos em linha (DOM e CSS), sem canvas.
- Cada coluna é um "rolo" de dez camadas absolutas com algarismos. Elas são transladadas na vertical em função de um valor animado por mola, com a coluna cortando tudo o que fica fora da linha visível.
- A altura de referência de cada coluna é medida em tempo real, com um observador de tamanho, para traduzir "um algarismo" em pixels.
- **Modo de contagem**: um segundo valor animado por mola (o número inteiro) alimenta o estado exibido. A cada mudança do valor exibido, os algarismos de cada ordem de grandeza são extraídos por divisão inteira e módulo 10, e cada rolo persegue o seu algarismo.
- O valor anterior é guardado entre renderizações para servir de ponto de partida dos rolos recém-montados.

## Parâmetros configuráveis

| Significado | Tipo | Padrão |
|---|---|---|
| Valor-alvo a exibir | número | obrigatório |
| Valor inicial da contagem; se ausente, usa a troca direta (modo A) | número opcional | ausente |
| Aviso a cada valor exibido durante a contagem | função(número) | nenhum |
| Completar com zeros à esquerda até o número de dígitos do alvo | booleano | falso |
| Caractere separador decimal | string | "." |
| Número fixo de casas decimais | inteiro ≥ 0 | 0 |
| Separador de milhar; se ausente, não há separação | string opcional | ausente |
| Configuração da mola de cada coluna (rigidez, amortecimento, massa) | objeto | 200 / 20 / 0,4 |
| Atraso antes de iniciar, em ms | número | 0 |
| Aparecer já no valor final, sem animar na montagem | booleano | falso |
| Só animar quando estiver visível na tela | booleano | falso |
| Margem usada na detecção de visibilidade | string de margem CSS | "0px" |
| Detectar a visibilidade só uma vez | booleano | verdadeiro |
| Atributos e estilos extras do contêiner (classe, estilo etc.) | — | repassados |

## Demo

- **Número**
  - Tamanho de fonte 36 px (2,25rem), peso 600, centralizado na área de prévia, com as cores do tema.
  - Valor-alvo 2025, contando a partir de 0 (o controle "contar a partir de" ligado passa valor inicial 0).
  - Preenchimento com zeros ligado.
  - Separador decimal ",", zero casas decimais e separador de milhar ".".
  - Resultado visual: começa em "0.000" e conta até "2.025".
- **Controles da prévia**
  - campo numérico do valor;
  - liga/desliga "contar a partir de 0";
  - liga/desliga preenchimento com zeros;
  - campos de texto para os separadores;
  - número de casas decimais;
  - deslizador de atraso de 0 a 3000 ms, em passos de 100.
- Mudar o atraso ou o "contar a partir de" recria o componente do zero, o que reinicia a animação.

## Acessibilidade e responsividade

- **Leitura por tecnologias assistivas**
  - Como cada coluna contém dez algarismos, um leitor de tela leria lixo. Recomenda-se marcar as colunas como ocultas para tecnologias assistivas.
  - Também se recomenda expor o valor final formatado num rótulo acessível ou em texto só para leitores de tela.
  - Para contagens frequentes, considere uma região viva educada.
- **Movimento reduzido**: recomenda-se, sob preferência de movimento reduzido, exibir o valor final direto, sem rolagem.
- **Escala com a fonte**: tudo é medido em "ch" e na altura da linha, então o componente escala com o tamanho da fonte do contexto. A medição dinâmica de altura acompanha mudanças de fonte e de zoom.
