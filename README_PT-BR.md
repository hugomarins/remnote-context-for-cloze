# Context Tree for Outline Cards — Guia do usuário (Português Brasileiro)

🇬🇧 [English](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README.md) | 🇨🇳 [中文](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_ZH.md) | 🇪🇸 [Español](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_ES.md)

Deixe suas revisões mais claras mostrando onde o cartão atual se encaixa na sua árvore de conhecimento. Este plugin desenha uma “árvore de contexto” compacta abaixo do cartão na fila de revisão, para você se situar, associar e recordar — sem alterar o conteúdo do cartão nem o agendamento.

> **Renomeado na 0.2.0.** O plugin se chamava *Context for Cloze*, e seu power‑up de âncora também se chamava *Context for Cloze*. Agora ambos dizem **Context Tree**, porque a árvore não é mais só sobre clozes — ela funciona com todos os tipos de cartão. Nada do que você já marcou é afetado: o código armazenado do power‑up continua sendo `contextForCloze`, e o Rem da marcação é renomeado no lugar na primeira vez que esta versão carrega. Se você mesmo tinha renomeado essa marcação, o seu nome é preservado. O comando que a adiciona agora é **Add Context Tree to the Cards in This Outline**, código rápido `cont` (antes `cfc`).

## Funcionalidades
- Context Tree (núcleo)
  - Adicione o power‑up “Context Tree” (código: `contextForCloze`) a um Rem. Todos os seus descendentes, quando revisados como cartões, exibirão abaixo uma árvore de contexto enraizada nesse Rem.
  - Funciona com **todos os tipos de cartão**, não só clozes: um Rem do tipo Conceito/Descritor/Pergunta mostra o seu **verso** na árvore, ligado à frente por uma seta que indica a direção do cartão (`⇒` direta, `⇐` inversa, `⇔` ambas).
  - Fase de pergunta: o contexto é exibido evitando qualquer vazamento da resposta — seja o cloze em teste, seja o lado inteiro que o cartão está pedindo.
  - Fase de resposta: o contexto permanece; a resposta revelada é indicada por um sublinhado azul com destaque azul‑claro, para facilitar a comparação.
- Context Hide Others (`contextHideAllTestOne`) — aplica‑se a **um único Rem**, não a uma subárvore.
  - Por padrão, a árvore de contexto esconde apenas a resposta que está sendo testada; toda *outra* resposta da árvore — outras linhas com cloze e o verso de todos os demais cartões — aparece revelada. Marque um cartão com este power‑up quando não quiser que a revisão **daquele cartão** seja estragada pelos vizinhos: enquanto ele estiver em revisão, todas as demais respostas ficam escondidas (exibidas como `…`).
  - Aplique‑o ao Rem do cartão que receberia o spoiler (a folha), e **não** à âncora nem ao pai. Veja [Context Hide Others](#context-hide-others--protegendo-um-cloze-de-seus-irmãos) abaixo.
- Como adicionar power‑ups aos Rems
  - Comandos:
    - Add Context Tree to the Cards in This Outline (código rápido `cont`)
    - Context: Hide Other Answers for This Rem (código rápido `cfchide`)
  - Funcionam com seleção múltipla.

![Alternando o modo de cloze com o botão de olho e fixando a escolha com o botão de etiqueta](https://raw.githubusercontent.com/hugomarins/remnote-context-for-cloze/main/img/context-for-cloze-mode-switch.gif)

## Compatibilidade com power‑ups de exibição na fila (plugin oficial “Hide in Queue” e plugin “Incremental Everything”)
A árvore de contexto espelha os power‑ups de exibição na fila do plugin oficial “Hide in Queue” do RemNote **e** do plugin Incremental Everything. Este plugin não registra nenhum deles — apenas lê suas marcações quando existem, de modo que nada é afetado se um power‑up não estiver instalado.

Marcados no próprio item:
- Hide in Queue (`hideInQueue`)
  - Exibe o texto de espaço reservado “Hidden in queue” para aquele item na árvore de contexto (somente na fase de pergunta; na fase de resposta o item aparece normalmente).
- Remove from Queue (`removeFromQueue`)
  - Remove o item por completo da árvore de contexto (nas duas fases).
- No Hierarchy (`noHierarchy`)
  - Quando presente no cartão atual, a área de contexto mostra apenas “esta linha” (sem ancestrais, irmãos ou descendentes), igual ao comportamento nativo do RemNote.

Marcados no cartão, mas com efeito sobre um ancestral (Incremental Everything):
- Hide Parent (`hideParent`) / Hide Grandparent (`hideGrandparent`)
  - Exibe o espaço reservado “Hidden in queue” na linha do pai / avô do cartão (somente na fase de pergunta).
- Remove Parent (`removeParent`) / Remove Grandparent (`removeGrandparent`)
  - Remove por completo da árvore de contexto a linha do pai / avô do cartão (nas duas fases); os filhos restantes permanecem, sem recuo.

A linha do próprio cartão atual é sempre exibida, independentemente de qualquer uma dessas marcações.

## Versos e setas de direção
Um Rem que é um cartão guarda a resposta no seu **verso** (`backText`) — é o que um Rem do tipo Conceito, Descritor ou Pergunta armazena. A árvore de contexto mostra os dois lados, unidos por uma seta que diz em que direção o cartão é perguntado:

| Seta | Direção de prática | Lê‑se como |
| --- | --- | --- |
| `⇒` | Direta (forward) | a frente pergunta, o verso responde |
| `⇐` | Inversa (backward) | o verso pergunta, a frente responde |
| `⇔` | Ambas (both) | qualquer lado pode perguntar |

É a mesma notação usada pelo plugin *Incremental Everything*, então um cartão se lê da mesma forma nos dois.

- Quando o Rem em revisão é ele próprio um cartão frente/verso, o lado perguntado aparece como um **?** azul na fase de pergunta e é revelado com sublinhado + destaque depois do “Show Answer” — exatamente o que já acontecia com um cloze.
- Todos os *outros* cartões da árvore mostram os dois lados revelados por padrão, e escondem o lado da resposta atrás de um único `…` clicável quando a árvore está no modo escondido (veja o botão de olho abaixo).
- Um Rem sem verso é desenhado exatamente como antes.

## Recolhida por padrão — expanda o que precisar
A árvore de contexto começa **recolhida**. Apenas o ramo que leva até o cartão em revisão fica aberto, de modo que a linha testada está sempre visível enquanto os descendentes mais profundos — que muitas vezes entregam a resposta ou dão pistas demais — permanecem escondidos.

- Uma linha com filhos escondidos exibe uma **seta ▸** no lugar do marcador; clique nela (ou dê foco e pressione Enter/Espaço) para expandir aquele ramo. A seta aponta para baixo quando o ramo está aberto.
- Uma linha sem filhos escondidos mantém seu marcador.
- A expansão é por cartão: ela se reinicia quando você passa para o próximo.
- Prefere a árvore sempre expandida de antes? Desative **Start Collapsed** nas configurações.

## Os botões de olho e de etiqueta — alternar o modo das respostas durante a revisão
A árvore exibe as respostas das outras linhas em um de dois modos: **revelado** (sublinhado azul, o padrão) ou **escondido** (`…`, o padrão para um cartão marcado com `Context Hide Others`). “Resposta” cobre os dois casos: um cloze dentro de uma linha e o verso de uma linha que é cartão. Um **botão 👁 no canto superior direito da área de contexto** alterna entre os dois para o cartão à sua frente.

- Olho **aberto** = as outras respostas estão reveladas. Clique para escondê‑las.
- Olho **cortado** = as outras respostas estão escondidas como `…`. Clique para revelá‑las.
- Use‑o *antes* de ler a árvore quando as respostas reveladas acabarem entregando uma pista que você preferia conquistar — sem precisar marcar o Rem antes.
- Use‑o *depois* do “Show Answer” quando a árvore escondida ficar críptica demais.
- Por si só, ele não altera nada na sua base de conhecimento: a marcação continua decidindo o ponto de partida, e o modo se reinicia no próximo cartão.
- O botão só aparece quando alguma outra linha realmente contém uma resposta própria — um cloze ou um verso — caso contrário, não há o que alternar.
- No modo escondido, cada `…` continua clicável individualmente, então você também pode descobrir uma resposta de cada vez. Um verso escondido é um único `…` para o lado inteiro; um cloze é um `…` por lacuna.

**Torne isso permanente — o botão 🏷 de etiqueta.** Assim que o olho deixa a árvore em um modo que discorda da marcação do cartão, um segundo botão aparece **à esquerda do olho**. Ao clicá‑lo, a escolha é gravada no próprio Rem, de modo que toda revisão futura comece assim:

- Ícone de etiqueta simples = *adicionar* `Context Hide Others` a este Rem (manter as outras respostas escondidas).
- Ícone de etiqueta cortado = *remover* a marcação deste Rem (manter as outras respostas reveladas).
- Passe o mouse ou o foco sobre qualquer um dos botões e uma breve explicação aparece na mesma linha, à esquerda dos ícones.
- O botão desaparece assim que a marcação corresponde ao que você vê, e um aviso confirma a mudança. Esta é a única ação do plugin que escreve na sua base de conhecimento.

## Configurações (Settings → Plugins → este plugin)
- Start Collapsed (padrão: ligado)
  - Desenha a árvore recolhida, com apenas o caminho até o cartão atual aberto; os demais ramos ficam atrás de uma seta ▸ clicável. A profundidade não é mais limitada — é o recolhimento que mantém uma árvore profunda legível, então você vê toda a hierarquia e abre só o que quiser.
- Max Nodes (padrão: 200)
  - Um limite de segurança para quantos Rems a árvore **percorre** antes de parar. Ramos recolhidos também são percorridos, então é isso — e não o recolhimento — que evita que um cartão sob uma âncora enorme trave a fila. Aumente se uma árvore vier truncada; reduza se um documento muito grande deixar os cartões lentos para aparecer.
- Debug Mode (padrão: desligado)
  - Acrescenta dicas extras na interface e no console para diagnóstico (a maioria dos usuários pode deixar desligado).

## Como usar
1. Escolha um Rem como “âncora de contexto” — o topo do outline que você quer que os cartões enxerguem — e adicione a ele o power‑up “Context Tree” (`contextForCloze`), pelo comando **Add Context Tree to the Cards in This Outline** (`cont`).
2. Comece a revisar: sempre que qualquer descendente virar um cartão, uma árvore de contexto enraizada na âncora aparece abaixo dele.
3. Opcional: se um cartão fosse ser estragado pelas respostas reveladas dos vizinhos, adicione “Context Hide Others” **àquele cartão** — execute **Context: Hide Other Answers for This Rem** (`cfchide`). Veja a seção dedicada abaixo.
4. Clique nas setas ▸ durante a revisão para abrir o ramo que quiser ver; o resto fica fora do caminho.
5. Use o botão 👁 no canto superior direito da área de contexto para revelar ou esconder as respostas das outras linhas sempre que o modo atual não servir para o cartão — e o botão 🏷 ao lado se quiser fixar essa escolha no Rem.
6. Deixe o Max Nodes como está, a menos que uma árvore venha truncada (aumente) ou que um documento muito grande deixe os cartões lentos para aparecer (reduza).

## Context Hide Others — protegendo um cloze de seus irmãos

**O que faz.** Por padrão, este plugin esconde apenas a resposta que está de fato sendo testada. Toda *outra* resposta da árvore de contexto — outros clozes e o verso de todos os demais cartões — aparece **revelada** (sublinhado azul), de modo que as respostas ao redor funcionam como contexto visível.

`Context Hide Others` inverte isso para o cartão em que é aplicado: enquanto aquele cartão está em revisão, **todas as outras** respostas da árvore ficam **escondidas** (exibidas como `…`) em vez de reveladas. Note a diferença de alcance em relação à marcação da âncora: `Context Tree` é colocado na **raiz** de um outline e afeta todos os descendentes, enquanto esta é colocada em **um único Rem** e afeta apenas as revisões desse Rem.

A marcação define somente o modo **inicial** — o botão 👁 descrito acima o inverte nos dois sentidos para o cartão à sua frente, sem alterar a marcação.

### Quando não há âncora de contexto acima do Rem
Esta marcação só muda a aparência de uma *árvore de contexto*, e uma árvore de contexto só existe abaixo de um Rem marcado com `Context Tree`. Marcar um Rem sem esse ancestral não faria absolutamente nada, então o comando verifica isso antes. Se a âncora estiver faltando, aparece um diálogo explicando a situação e oferecendo três saídas:

- **Marcar também o pai** — o pai se torna a âncora de contexto e o Rem selecionado recebe `Context Hide Others`. O diálogo nomeia o pai e expõe a consequência de antemão: uma âncora se propaga em cascata, então *todos* os cartões abaixo daquele pai passarão a exibir uma árvore de contexto. Ele também informa quantos irmãos o Rem tem, já que é desses irmãos que o contexto é feito — sem nenhum, a árvore ficaria rala e talvez um ancestral mais alto seja a âncora melhor.
- **Marcar apenas este Rem** — adiciona a marcação mesmo assim; ela fica dormente até que algum ancestral se torne uma âncora.
- **Cancelar** — nada é gravado.

Em uma seleção múltipla, os Rems que já estão sob uma âncora são marcados imediatamente e o diálogo pergunta apenas sobre os demais.

A linha do próprio cartão atual é sempre escondida como `?`, independentemente deste power‑up, e o texto de contexto sem cloze é sempre exibido. Este power‑up muda apenas como os *outros* clozes aparecem.

**Onde aplicar.**
- Aplique **ao Rem do cartão de cloze que receberia o spoiler indesejado dos irmãos** — ou seja, a folha cuja revisão você quer manter limpa. Não é um marcador de grupo: ele protege o cartão específico em que está.
- **Não** aplique à âncora nem ao pai que carrega `Context Tree`. O efeito é atrelado ao Rem do cartão que está sendo revisado e não é herdado árvore abaixo, então uma marcação no pai não faz nada.
- A proteção é por cartão e unidirecional: marcar o cartão A limpa apenas **a revisão do próprio A**; não influencia o que B ou C mostram quando chegar a vez deles. Por isso, quando vários irmãos se estragariam mutuamente, marque **cada** cartão que quiser proteger — qualquer irmão deixado sem marcação continuará revelando todas as respostas durante a própria revisão.
- Dica: selecione os cartões de cloze que quiser proteger e execute **Context: Hide Other Answers for This Rem** (`cfchide`) — o comando funciona com seleção múltipla, então dá para marcá‑los de uma vez.

**Quando usar.** Use quando um pai agrupa vários clozes irmãos que se estragariam se exibidos juntos — por exemplo, uma lista enumerada em que cada item é seu próprio cartão de cloze, ou um conjunto de fatos paralelos que você quer recordar de forma independente. Mantenha o padrão (não marcar) quando as respostas vizinhas forem contexto legítimo que você *quer* ver enquanto recorda a atual.

**Revelar os clozes escondidos um a um (clique para revelar).** Quando um cartão está protegido dessa forma, cada `…` escondido é um botão. Clique nele (ou dê foco e pressione Enter/Espaço) para revelar no lugar apenas a resposta daquele cloze; clique de novo para escondê‑la outra vez como `…`. Isso permite autoavaliar aos poucos — um por um — os clozes escondidos ao redor, mesmo que não sejam o cartão testado. Cada `…` alterna de forma independente, a lacuna testada em si permanece escondida (ela nunca se torna clicável) e todas as revelações se reiniciam automaticamente quando você passa para o próximo cartão.

## Dicas
- O plugin só é desenhado na fila de revisão; a visão do editor não é afetada.
- Se o cartão atual não estiver sob nenhuma âncora “Context Tree”, nenhuma árvore de contexto é exibida.
- Quando usado junto com No Hierarchy (`noHierarchy`), apenas a linha atual é exibida. Isso é intencional.

## Capturas de exemplo

> As capturas a seguir ajudam a ver como o plugin se comporta em revisões reais.

1) Estrutura de teste (planta da árvore de contexto)

![Estrutura de teste](https://remnote-user-data.s3.amazonaws.com/zaFqKpkiElkV2UIcTnEPlt0mr09fwkG0FV52yBVdzCJR6nTH0Lb6tEEgRIFht-oEINkdrK8wJF1K3G_VjYmWu-vohCE6RwAez_wvjvR6h-WtUPvVPYpyL0V6XdaGRRlJ.jpeg?loading=false)

2) Exemplo de revisão A (fase de pergunta, sem vazar pistas)

![Revisão A](https://remnote-user-data.s3.amazonaws.com/GT9Ausv726feJf22kII7MJhnGCbfhVYFCh5GMtf2mUweNpSQUHn6dtmL0GWSTHzLVnyEJtZjCthc5Rda7aIJ-0eFMO2xhOO6dLqRrvm8SfEzl3FFF3zRx9qR8c0czX5g.jpeg)

3) Exemplo de revisão B (fase de resposta, destaque do cloze)

![Revisão B](https://remnote-user-data.s3.amazonaws.com/bXoC-aeiey70Hl_jrjmS0MCUzN82TMPYUJF8KGy9iErqMqAQ-5dGy3UdqW4xbW2ezXFZg1uCgDnM4brRKA8Y0Doz87_VLLUZRS4C7i2t4qmCwVvvi8UZHp9MOaXhutc0.jpeg?loading=false)

- Observação: demonstração do power‑up “No Hierarchy” funcionando junto com este plugin.

4) Exemplo de revisão C (ramos / níveis num relance)

![Revisão C](https://remnote-user-data.s3.amazonaws.com/niJfC_INpPkpidUzOw6ZbY4r7e2bIXbK9zuVoCItDPPv3wv8qVl1b25OpTY8fWGC5JRr2jUHNN9TjOaQzuQwSc2qPqRFzBZRZHEY9vCmDJs-Lux3XYfBZapnr52ZEcyV.jpeg?loading=false)

5) Exemplo de revisão D (conteúdo com texto rico misto)

![Revisão D](https://remnote-user-data.s3.amazonaws.com/j_FQj9RxuQnRqFO4X3Qo64siZY_3nHxoU4vQv-Hy1Op5OcAva_IuBPFlVA1EHAsjeywgP-wBHGrBUfjv82I2V-wJ409_IdO6AOJi8w8xHdIc8DfKH9zF9pjiskwoMlyf.jpeg?loading=false)

6) Exemplo de revisão E (aparência geral)

![Revisão E](https://remnote-user-data.s3.amazonaws.com/rSRm6AeAIG7bsA1K74po0wdLr-cfbW9mGaA_Rkdp20qY2A54-2_W8kUy2Y4mkHls_K1CLnhR57677cGcIeBPdBSz_cmpDiTDlTN91M4r184lrhjKT4_f85OUoQ7qLG4h.jpeg?loading=false)
