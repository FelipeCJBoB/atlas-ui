# Especificação: Introdução radial em órbita (radial-intro)

## Propósito
Uma animação de entrada para um grupo de avatares circulares. Eles começam empilhados no centro de um "palco" quadrado, sobem até a borda superior, se abrem em leque ao redor do círculo, ficando distribuídos em ângulos iguais, e passam a orbitar lentamente e para sempre, sempre de pé. Serve como vitrine de equipe, comunidade ou parceiros.

## Aparência
- **Palco**: quadrado de **320 × 320 px** (configurável), com posicionamento relativo e overflow visível. Não tem fundo, borda nem guia de órbita visíveis.
- **Braço**: cada item tem uma camada transparente do tamanho do palco inteiro, sobreposta às outras e girando em torno do centro do palco. A ordem de empilhamento é decrescente: o primeiro item fica por cima e o último por baixo.
- **Avatar**:
  - imagem circular de **60 × 60 px** (configurável), proporção 1:1, esticada para preencher o círculo;
  - centralizada horizontalmente no braço;
  - sem borda e sem sombra;
  - não arrastável.
- **Geometria final**: o topo do avatar encosta no topo do palco. Assim, o centro do avatar fica a (lado do palco ÷ 2 − lado do avatar ÷ 2) do centro, o que dá **130 px** com os padrões. Os avatares ficam espaçados em 360° ÷ N, no sentido horário, começando às 12 h.
- **Imagens (assets)**: a referência usa fotos de perfil externas. **Não usar fotos.** Gerar avatares procedurais: círculos com gradiente próprio (duas cores derivadas do índice ou do nome, por exemplo variando o matiz em passos de 360° ÷ N) e as iniciais do nome centralizadas em branco, peso 600, com cerca de 40% do lado. O componente deve aceitar uma URL de imagem opcional por item e usar o avatar procedural quando ela não existir.

## Comportamento
Sequência temporal a partir da montagem. Todas as fases com mola usam rigidez **300**, amortecimento **35**, massa 1 e limiares de repouso de 0,01. É praticamente amortecimento crítico, sem overshoot perceptível, assentando em ~0,4–0,5 s.

1. **t = 0**:
   - todos os braços estão em 0° (sem rotação);
   - todos os avatares estão com o **topo no centro do palco**, ou seja, um pouco abaixo do centro;
   - só o **primeiro** avatar está visível (opacidade 1); os demais têm opacidade 0 e estão escondidos sob ele.
2. **t = 250 ms — subida**: todos os avatares sobem, por mola, até encostar o topo no topo do palco. O primeiro, visível, sobe sozinho aos olhos do usuário.
3. **t = 700 ms — leque**: simultaneamente, para cada item i:
   - o braço gira por mola até i × (360° ÷ N);
   - o avatar gira em sentido contrário pelo mesmo ângulo, para continuar de pé;
   - a opacidade do avatar vai a 1.
   - O efeito visual é uma "abertura de leque" a partir das 12 h, com os avatares surgindo enquanto deslizam ao longo do círculo.
4. **t = 1300 ms — órbita contínua**:
   - cada braço gira do seu ângulo até o ângulo + 360°, em **30 s**, linear, repetindo infinitamente (sentido horário);
   - cada avatar faz a contrarrotação equivalente no mesmo ritmo, para permanecer de pé.
   - A órbita substitui qualquer resto da mola anterior.
- **Desmontagem**: as rotações contínuas são canceladas.
- **Interação**: nenhuma (sem hover, clique ou arraste).
- **Casos de borda**:
  - com 1 item, não há leque; o avatar apenas sobe e gira em torno do próprio centro de órbita;
  - os itens são lidos na montagem. Mudanças posteriores na lista não reiniciam a sequência (ver Observações).

## Técnica de renderização em alto nível
DOM com transformações CSS (rotação de camadas do tamanho do palco em torno do centro, mais contrarrotação de cada imagem em torno do próprio centro). A sequência pode ser feita com uma biblioteca de animação que ofereça molas e animações lineares infinitas, ou com animações CSS/Web Animations: molas para as fases 2 e 3 e uma animação linear infinita de 30 s para a fase 4. Usar `will-change: transform` nos braços.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Itens da órbita: id, nome (texto alternativo e iniciais), imagem opcional | array | obrigatório |
| Lado do palco | número (px) | 320 |
| Lado de cada avatar | número (px) | 60 |

Sugestões opcionais (não presentes na referência): duração de uma volta completa (padrão 30 s), sentido da rotação e atrasos das fases (250 / 700 / 1300 ms).

## Demo
- Palco de 320 px centralizado na área de prévia (fundo do tema).
- **9 itens** (passo de 40°), com nomes curtos de pessoas ou marcas. Usar nomes genéricos (ex.: "Ana", "Bruno", "Caio"...) com avatares procedurais de gradiente e iniciais.

## Acessibilidade e responsividade
- Cada avatar tem texto alternativo igual ao nome. Recomendação: envolver o palco em um grupo com nome acessível (ex.: "Comunidade") e marcar a órbita como decorativa se os nomes estiverem disponíveis em outro lugar.
- **Recomendação**: com `prefers-reduced-motion`, ir direto ao estado final do leque (fase 3 concluída) e não iniciar a órbita contínua.
- Animação infinita: considerar pausar a rotação quando o palco estiver fora da tela ou a aba estiver oculta.
- O palco tem tamanho fixo em px. Em telas estreitas, reduzir o lado do palco e do avatar proporcionalmente (ex.: limitar o palco a 100% da largura disponível).

## Observações de fidelidade
- Os avatares não visíveis ficam empilhados sob o primeiro durante a subida. Manter essa ordem de empilhamento para que só o primeiro apareça antes do leque.
- A sequência roda uma única vez por montagem e ignora mudanças na lista ou nos tamanhos. Recomendação: reiniciar a sequência quando a quantidade de itens mudar.
- A referência depende de fotos externas carregadas em tempo de execução. Substituir por avatares procedurais, como descrito acima.
