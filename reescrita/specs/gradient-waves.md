# Especificação: Ondas em gradiente (gradient-waves)

## Propósito
Fundo animado que mostra uma superfície de "mar" ondulado vista em perspectiva, como se a câmera estivesse inclinada olhando para o horizonte: as ondas próximas aparecem nítidas em rosa com cristas brancas, e as distantes se dissolvem numa névoa violeta que desaparece em transparência. O ponteiro inclina levemente a câmera (paralaxe). Uso: fundo de hero.

## Aparência
- **Contêiner**: bloco com posicionamento relativo, 100% × 100% do pai, overflow oculto. Superfície de desenho em bloco, 100% × 100%, **transparente** onde não há mar (o fundo da página aparece no "céu" e ao longe).
- **Cores padrão**:
  - **corpo da onda `#FF9FFC`** (rosa-lilás);
  - **crista `#FFFFFF`** (branco);
  - **horizonte/névoa `#5227FF`** (violeta-elétrico).
- **Cor de cada ponto da superfície**: mistura entre corpo e crista conforme a altura do ponto (altura × 0,08 + 0,5, limitada a 0–1: vales puxam para o corpo, picos para a crista). Essa cor é então misturada com a cor do horizonte conforme a distância: fator de proximidade = profundidade da névoa ÷ distância, limitado a 0–1 (padrão **15**); perto (fator 1) vale a cor da superfície, longe (fator → 0) vale a cor do horizonte. Multiplicada pelo brilho (padrão **1**) e limitada a 0–1.
- **Transparência**: a opacidade do pixel é o mesmo fator de proximidade × opacidade global (padrão **1**). Assim, a superfície próxima é opaca e a distante vai ficando transparente (desbota para o fundo da página). Cor pré-multiplicada pela opacidade.
- **Granulação** (padrão ligada): ruído pseudoaleatório por pixel, renovado no tempo, somado à **opacidade** com amplitude ±metade da intensidade (padrão **0,05**). Dá textura de filme, mais visível nas zonas de transição.
- Visual típico com padrões: metade inferior com ondas rosadas de cristas claras, terço superior se esvaindo em violeta e depois em transparência.

## Comportamento
- **Superfície**: um campo de altura definido como soma de duas senoides em direções perpendiculares, cada uma com amplitude **2,5** (padrão), deslocado verticalmente por um nível-base **5,5** (padrão; "altura do horizonte").
  - As coordenadas de cada senoide são **deformadas** (*domain warping*) por outras senoides lentas: uma ondulação ampla ao longo de uma direção (intensidade "marulho" padrão **35**, comprimento ~20 unidades) e uma turbulência na outra direção (intensidade padrão **20**, comprimento ~23 unidades). Isso quebra a regularidade e gera ondas que se dobram e se cruzam.
  - Frequências: escala das ondas (padrão **0,6**) ÷ 7 numa direção e escala × proporção (padrão **0,9**) ÷ 3 na outra.
  - Animação: as quatro fases (deslocamento principal, marulho, deslocamento secundário, turbulência) avançam com o tempo × velocidade (padrão **0,4**), divididos por 0,13, 0,81, 0,20 e 0,71 respectivamente — o padrão inteiro corre continuamente numa direção enquanto se deforma.
- **Câmera**: posicionada 30 unidades acima do plano, olhando para baixo e então inclinada por um ângulo (padrão **1,11 rad**, ≈ 64°) em direção ao horizonte. Projeção tipo **olho-de-peixe equidistante**: o ângulo de cada raio em relação ao eixo é proporcional à distância do pixel ao centro, com campo de visão vertical de ≈ 78° (π ÷ 2,3) dividido pelo zoom (padrão **1**; mínimo efetivo 0,05). Isso dá uma leve curvatura ao horizonte.
- **Paralaxe do ponteiro** (padrão ligada): a posição normalizada do ponteiro (0–1, Y para cima) gira a câmera em guinada e arfagem de até ±(força × 0,2) rad, força padrão **0,5** (≈ ±0,1 rad). A posição é suavizada com fator **0,05 por quadro**; ao sair do componente (ou com a interação desligada), volta suavemente ao centro.
- **Qualidade**: número máximo de passos da marcha do raio: baixo **40**, médio **70** (padrão), alto **110**. Menos passos deixa o longe mais "rasgado".
- **Laço**: roda continuamente, mas para quando o contêiner sai da área visível ou a aba fica oculta, e retoma sozinho. O tempo é contado desde a montagem (relógio de parede; não pausa o tempo, só o desenho).
- **Redimensionamento**: observado no contêiner; resolução = tamanho arredondado × densidade de pixels limitada a **2**; desenha imediatamente.
- **Mudança de parâmetros**: aplicada ao vivo, sem recriar o contexto.

## Técnica de renderização em alto nível
WebGL 2, triângulo de tela cheia, shader de fragmento com **marcha de raio** (*ray marching*) contra um campo de altura analítico (soma de senoides com deformação de domínio senoidal): passos de 90% da distância vertical estimada, parada quando a distância é menor que 0,1, limite de 20 000 unidades (céu = sem impacto → transparente). Névoa por inverso da distância, cor por altura, granulação por hash. Sem antialiasing; saída com alfa pré-multiplicado.

## Parâmetros configuráveis
| Significado | Tipo | Padrão |
|---|---|---|
| Cor do horizonte/névoa | hex | `#5227FF` |
| Cor do corpo das ondas | hex | `#FF9FFC` |
| Cor das cristas | hex | `#FFFFFF` |
| Velocidade | número | 0,4 |
| Amplitude das ondas | número | 2,5 |
| Escala das ondas | número | 0,6 |
| Proporção entre as duas direções | número | 0,9 |
| Intensidade do marulho | número | 35 |
| Intensidade da turbulência | número | 20 |
| Inclinação da câmera | rad | 1,11 |
| Zoom | número | 1 |
| Altura do horizonte (nível-base) | número | 5,5 |
| Profundidade da névoa | número | 15 |
| Qualidade | baixa / média / alta | média |
| Brilho | número | 1 |
| Opacidade global | 0–1 | 1 |
| Paralaxe pelo ponteiro | booleano | sim |
| Força da paralaxe | número 0–1 | 0,5 |
| Granulação ligada | booleano | sim |
| Intensidade da granulação | número | 0,05 |
| Classe extra | string | vazia |

## Demo
- Área de prévia com **500 px de altura**, largura total, sem padding, overflow oculto, fundo escuro do site (visível no "céu" transparente). Todos os valores padrão.
- **Sobreposição de demonstração** (opcional, comum às prévias de fundos): barra de navegação em vidro com logotipo genérico (SVG próprio), "Features", "About" e "Sign up"; pílula "NEW · Creative Components"; título **"Soft rolling gradient waves fading into haze."** (peso 600, 1,6–2,4 rem); botões "Get started" e "Learn more"; interruptor "Demo Content" no canto inferior direito. Sem captura de ponteiro.
- Botão de recarregar que remonta o componente.
- Controles: três cores; velocidade 0–2 (0,05); amplitude 0–5 (0,05); escala 0,3–3 (0,05); proporção 0,3–3 (0,05); marulho 0–40 (0,5); turbulência 0–60 (0,5); inclinação 0,2–1,3 (0,01); zoom 0,4–2,5 (0,05); altura do horizonte 2–10 (0,1); névoa 5–60 (1); qualidade (baixa/média/alta); brilho 0,2–2 (0,05); opacidade 0–1 (0,01); paralaxe (interruptor); força 0–1 (0,01); granulação (interruptor); intensidade 0–0,3 (0,01).

## Acessibilidade e responsividade
- Decorativo: ocultar a superfície de leitores de tela; não focável.
- Recomendação: com `prefers-reduced-motion`, congelar o tempo e desligar a paralaxe.
- Custo: a marcha de raio é pesada; manter o limite de densidade 2 e oferecer a qualidade baixa em dispositivos fracos.
- Responsivo: preenche qualquer proporção; o campo de visão é vertical, então telas largas mostram mais mar lateralmente.

## Observações de fidelidade
- Recomendação: a suavização do ponteiro é por quadro; prefira baseada em tempo (equivalente a 0,05 a 60 Hz).
- Recomendação: como o relógio não para quando o laço pausa, a animação "salta" ao voltar a ser visível; acumular apenas o tempo efetivamente animado é uma melhoria permitida.
- Recomendação: a granulação aplicada à opacidade pode deixar pontos semitransparentes até nas áreas próximas; manter a intensidade baixa.
- A demo não tem adaptação ao tema claro; sobre fundo claro o "céu" transparente deixa ver o branco e as ondas continuam legíveis.
