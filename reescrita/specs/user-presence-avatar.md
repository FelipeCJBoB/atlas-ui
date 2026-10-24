# Especificação: Avatares de presença (user-presence-avatar)

## Propósito
Dois grupos de avatares sobrepostos, em pílulas lado a lado: **online** (coloridos) e **offline** (em tons de cinza). Clicar em um avatar troca o status do usuário: ele desliza até o fim do outro grupo e ganha ou perde a cor durante o trajeto, enquanto as pílulas se redimensionam com mola. Um tooltip único com o nome acompanha o avatar sob o ponteiro.

## Aparência
- **Contêiner**: linha flex com itens centralizados verticalmente e **20 px** entre as duas pílulas.
- **Pílula de grupo**:
  - fundo `#d4d4d4` no tema claro e `#404040` no tema escuro;
  - padding de **2 px** e raio totalmente arredondado.
  - Por dentro, uma linha flex de **48 px** de altura com os avatares **sobrepostos**: cada avatar após o primeiro avança −12 px sobre o anterior.
- **Avatar**:
  - círculo de **48 px**;
  - borda de **3 px** na mesma cor da pílula, o que cria um "recorte" entre avatares sobrepostos;
  - overflow oculto;
  - imagem quadrada preenchendo o círculo;
  - cursor de ponteiro.
  - **Fallback**: quando a imagem não carrega, aparece um círculo com fundo "atenuado" do tema (~`#f5f5f5` claro / ~`#262626` escuro) e as **iniciais** centralizadas.
- **Online**: imagem em cores normais. **Offline**: imagem em **escala de cinza total**.
- **Ordem de sobreposição**: a natural do DOM, em que cada avatar posterior fica por cima do anterior.
- **Tooltip**:
  - balão com fundo da cor primária do tema (quase preto no claro, quase branco no escuro) e texto na cor de contraste;
  - raio de ~6 px, padding de **6 px × 12 px** e fonte de **12 px** (texto balanceado);
  - seta de ~12 px na mesma cor, com ponta levemente arredondada;
  - aparece **acima** do avatar, a **10 px** de distância. Se não houver espaço, inverte para baixo e se desloca para dentro da viewport com margem de 8 px;
  - fica numa camada alta (z = 50), renderizada num portal no fim do documento.
- **Imagens (assets)**: a referência usa fotos externas. **Não usar fotos.** Gerar avatares procedurais: um gradiente diagonal com duas cores por usuário (matizes distintos) e as iniciais em branco, peso 600, com ~40% do diâmetro. As iniciais do fallback continuam valendo.

## Comportamento
- **Estado**: lista ordenada de usuários com flag online/offline. O grupo online mostra os online na ordem da lista; o grupo offline, os offline.
- **Clique em um avatar**: inverte o status do usuário, remove-o da posição atual e o coloca no **final da lista**. Ele aparece, portanto, como **último** do grupo de destino.
- **Animação da troca**:
  - cada avatar tem identidade estável e compartilhada entre os dois grupos. Ao mudar de grupo ou de posição, desliza da caixa antiga para a nova (animação de layout, estilo FLIP) com **mola de rigidez 200 e amortecimento 25**;
  - na mesma mola, o filtro de cinza vai de 0 a 1 (ao ficar offline) ou de 1 a 0 (ao ficar online), e a escala se mantém em 1;
  - as pílulas também animam o próprio tamanho e a posição (encolhem e crescem) com **mola de rigidez 150 e amortecimento 20**, um pouco mais lenta e elástica.
- **Camadas durante a troca**: a pílula de **origem** vai para z = 5 e a outra fica em z = 10 por **500 ms**. Assim, o avatar em trânsito passa por cima da pílula de origem. Depois, ambas voltam a z = 10.
- **Grupo vazio**: se todos os usuários ficarem num só grupo, a pílula vazia é removida. A pílula restante se reposiciona com a mola das pílulas.
- **Tooltip** (um único balão compartilhado):
  - abre **sem atraso** ao passar o ponteiro (ou focar) sobre um avatar;
  - fecha **300 ms** após o ponteiro sair;
  - se o ponteiro passa para outro avatar antes do fechamento, o balão **desliza** até o novo alvo e troca o texto, sem fechar e reabrir;
  - entrada: de opacidade 0, escala 0 e 15 px abaixo da posição final (para o lado "acima") até opacidade 1, escala 1 e posição final, com **mola de rigidez 300 e amortecimento 35**. A saída faz o inverso;
  - **Esc**, rolagem ou redimensionamento da janela fecham o balão imediatamente.
- Cada avatar também tem uma dica nativa do navegador: "Click to go offline" (online) ou "Click to go online" (offline).

## Técnica de renderização em alto nível
DOM com animação de layout compartilhado entre dois contêineres irmãos, mais animação do filtro CSS de escala de cinza. O tooltip é uma camada flutuante única, posicionada por uma biblioteca de posicionamento (com inversão, deslocamento e seta) e animada por mola, com transição de layout entre alvos. Precisa de uma biblioteca de animação com animação de layout entre listas, ou de FLIP próprio com mola amortecida.

## Parâmetros configuráveis
A referência não expõe parâmetros: os usuários são fixos no componente. Recomenda-se expor:

| Significado | Tipo | Padrão |
|---|---|---|
| Usuários: id, imagem opcional, iniciais, nome do tooltip, online | array | os 6 da demo |
| Callback ao mudar status (id, online) | função | nenhuma |
| Tamanho do avatar | número (px) | 48 |
| Sobreposição entre avatares | número (px) | 12 |

## Demo
- Componente centralizado na área de prévia (fundo do tema).
- Seis usuários, na ordem: três online e três offline. Usar nomes e iniciais genéricos (ex.: "Ana Lima"/AL, "Bruno Reis"/BR, "Caio Nunes"/CN online; "Dora Melo"/DM, "Eva Rocha"/ER, "Fábio Luz"/FL offline), com avatares procedurais.

## Acessibilidade e responsividade
- **Recomendação**:
  - renderizar cada avatar como botão focável, com nome acessível do tipo "Ana Lima, online — alternar status" e `aria-pressed` ou texto de estado;
  - cada pílula deve ser um grupo rotulado ("Online", "Offline");
  - o tooltip deve abrir também no foco por teclado.
- A dica nativa duplica o tooltip. Recomendação: removê-la e usar só o tooltip acessível (associado por `aria-describedby`).
- O status não deve depender só da cor ou do cinza: o nome acessível e o grupo comunicam o estado.
- Com `prefers-reduced-motion`, trocar as molas por mudanças instantâneas.
- Com muitos usuários, as pílulas podem extrapolar a largura. Recomendação: permitir quebra em linhas ou um indicador "+N".

## Observações de fidelidade
- O contêiner interno de cada pílula é recriado sempre que a composição do grupo muda. Isso é irrelevante para o visual, porque a animação de layout compartilhado cobre a transição. Não é preciso reproduzir.
- A lista de usuários é fixa dentro do componente. Recomendação: torná-la configurável.
