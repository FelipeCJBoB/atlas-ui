# Especificação: Forma que desfoca sob o cursor (shape-blur)

## Propósito
Desenha uma forma geométrica fina e branca (por padrão o contorno de um quadrado arredondado) no centro do contêiner. Uma "lente" circular invisível acompanha o cursor com atraso suave; onde ela passa, a linha da forma deixa de ser nítida e se espalha num brilho difuso e largo. Efeito decorativo de fundo/hero.

## Aparência
- **Contêiner**: bloco 100% × 100% do pai, aceita classe extra. Sem fundo próprio: a superfície é **transparente**, só a forma é pintada.
- **Espaço de coordenadas da forma**: um quadrado normalizado (0–1) do tamanho do **lado menor** do contêiner, centralizado; o excesso do lado maior fica fora. Assim a forma nunca se deforma e fica sempre no centro.
- **Cor**: sempre **branco puro**, com a intensidade expressa só pela opacidade (mistura alfa sobre o que estiver atrás).
- **Variação 0 (padrão) — contorno de quadrado arredondado**:
  - Um campo de distância de retângulo arredondado centrado no meio. A meia-largura do quadrado, em fração do lado menor, ≈ tamanho ÷ 4,2 (tamanho padrão **1,2** → lado ≈ 57% do lado menor; tamanho 1,0 → ≈ 48%).
  - Arredondamento dos cantos controlado por um parâmetro (padrão **0,4**, em unidades do campo; 0 = cantos vivos, valores próximos ao tamanho tornam a forma quase circular).
  - Traço centrado na borda da forma com espessura **0,05** em unidades do campo (≈ 1,2% do lado menor), com antisserrilhado por derivada de tela.
  - A opacidade do traço é multiplicada por **4** (fica saturada e brilhante onde é nítido; ao se espalhar, perde intensidade mas continua visível como halo).
- **Variação 1 — disco cheio**: círculo central de raio ≈ 30% do lado menor, opacidade × 1,2.
- **Variação 2 — anel**: círculo de raio ≈ 29% do lado menor, traço fino (0,02 em unidades de diâmetro), opacidade × 4.
- **Variação 3 — triângulo cheio**: triângulo equilátero apontando para cima, centrado um pouco abaixo do meio (5% do lado menor), tamanho ≈ 15% do lado menor de apótema, opacidade × 1,4.

## Comportamento
- **Lente**: posição do cursor rastreada no **documento inteiro**, convertida para coordenadas locais do contêiner (pode ficar fora dele). A posição usada no desenho persegue a real com **amortecimento exponencial** de taxa **8/s** (a cada quadro avança 1 − e^(−8·Δt) da distância), o que dá um atraso suave de ~0,3 s.
- **Influência da lente**: para cada pixel calcula-se o dobro da distância normalizada até a lente e aplica-se um degrau suave (smoothstep) centrado no tamanho do círculo (padrão **0,3**) com meia-largura igual à suavidade da borda (padrão **0,5**). Resultado: um valor ~1 perto do cursor que decai para 0 longe dele.
- **Efeito na forma**: esse valor vira a **largura da transição** da borda da forma. Longe do cursor, a transição é zero e a linha fica nítida. Perto, a transição fica larga e a linha vira uma faixa difusa e luminosa, como desfoque localizado.
- O cursor começa na origem (canto superior esquerdo), então ao montar a lente parte dali.
- Laço de animação contínuo enquanto montado.
- **Ajustes ao vivo**: tamanho, arredondamento, espessura, tamanho do círculo, suavidade e densidade de pixels são atualizados sem recriar. Trocar a variação recria o efeito.
- **Redimensionamento**: na janela e por observação do contêiner; densidade de pixels limitada a 2.

## Técnica de renderização em alto nível
WebGL: um único retângulo cobrindo o contêiner (câmera ortográfica do tamanho em pixels) com um shader de fragmento que avalia **campos de distância com sinal** (retângulo arredondado, círculo, polígono regular) e converte a distância em opacidade com degraus suaves (smoothstep), usando derivadas de tela para antisserrilhar. A suavidade da borda é modulada por um segundo campo (o círculo da lente). Pode ser feito com three.js, uma biblioteca leve ou WebGL puro. Na limpeza, liberar geometria/material/contexto e remover ouvintes.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Variação da forma (0 contorno de quadrado arredondado, 1 disco, 2 anel, 3 triângulo) | inteiro 0–3 | 0 |
| Densidade de pixels usada para converter a posição do cursor | número | 2 |
| Tamanho da forma (variação 0) | número | 1,2 |
| Arredondamento dos cantos (variação 0) | número 0–1 | 0,4 |
| Espessura do traço (variação 0) | número | 0,05 |
| Tamanho do círculo de influência | número | 0,3 |
| Suavidade da borda do círculo de influência | número | 0,5 |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site.
- Componente na variação 0, ocupando a área, com densidade de pixels = a do dispositivo e estes valores (diferentes dos padrões do componente): tamanho **1,0**, arredondamento **0,5**, espessura **0,05**, círculo **0,25**, suavidade **1**.
- Texto **"Hover Me."** centralizado de forma absoluta (6rem, peso 600), sobreposto à superfície.
- Controles: tamanho 0,1–2 (0,1); arredondamento 0–1 (0,05); espessura 0,01–0,2 (0,005); círculo 0,1–0,5 (0,01); suavidade 0,1–2 (0,1).

## Acessibilidade e responsividade
- Puramente decorativo: marcar a superfície com `aria-hidden`; não deve receber foco nem capturar ponteiro necessário para o conteúdo por cima (recomendação: `pointer-events: none` na superfície).
- Recomendação: com `prefers-reduced-motion`, manter a forma nítida e sem seguir o cursor (ou desligar o amortecimento animado).
- Toque: a lente acompanha o último ponto tocado/arrastado.
- Responsivo: a forma escala com o lado menor do contêiner.

## Observações de fidelidade
- **Recomendação**: a referência escuta dois eventos equivalentes (mouse e ponteiro) no documento; basta o evento de ponteiro.
- **Recomendação**: a densidade de pixels configurável pode divergir da usada na resolução (limitada a 2), desalinhando a lente em telas 3×. Use sempre o mesmo valor (a densidade efetiva da superfície) para as duas coisas e trate o parâmetro só como teto.
- **Recomendação**: os padrões do componente e os da demo diferem; mantenha os do componente como padrão e os da demo apenas na prévia.
- **Recomendação**: pausar o laço quando o contêiner estiver fora da tela e a lente já tiver convergido.
- O texto da demo usa a cor de texto do tema; em tema claro a forma branca fica invisível — recomenda-se permitir configurar a cor da forma (padrão branco) e usar um tom escuro no tema claro.
