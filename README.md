# Context for Cloze — User Guide (English)

🇨🇳 [中文](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_ZH.md) | 🇪🇸 [Español](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_ES.md) | 🇧🇷 [Português Brasileiro](https://github.com/hugomarins/remnote-context-for-cloze/blob/main/README_PT-BR.md)

Make your reviews clearer by showing where the current card sits in your knowledge tree. This plugin renders a compact “Context Tree” under the card in the review queue, so you can orient, associate, and recall — without changing the card content or scheduling.

## Features
- Context for Cloze (Core)
  - Add the power‑up “Context for Cloze” (code: `contextForCloze`) to a Rem. All its descendants, when reviewed as cards, will show a context tree rooted at that Rem under the card.
  - Works for **every card type**, not only clozes: a Concept/Descriptor/Question Rem shows its **back side** in the tree, joined to the front by an arrow that spells out the card’s direction (`⇒` forward, `⇐` backward, `⇔` both).
  - Question stage: the context is shown while avoiding any leak of the answer — the cloze you are tested on, or the whole side the card is asking for.
  - Answer stage: the context remains; the revealed answer is indicated by a blue underline with a light‑blue highlight for easy comparison.
- Context Hide Others (`contextHideAllTestOne`) — applies to **one Rem**, not to a subtree.
  - By default, the context tree hides only the answer you are actually being tested on; every *other* answer in the tree — other cloze lines, and the back side of every other flashcard — is shown revealed. Tag a card with this power‑up when you don’t want **that card’s** review to be spoiled by its neighbours: while it is under review, all those other answers are hidden (shown as `…`) instead.
  - Apply it to the card Rem that would receive the spoiler (the leaf), **not** to the anchor/parent. See [Context Hide Others](#context-hide-others--protecting-a-cloze-from-its-siblings) below.
- How to add power‑ups to Rems
  - Commands:
    - Add Context for Cloze (quick code `cfc`)
    - Context: Hide Other Answers for This Rem (quick code `cfchide`)
  - Works on multi‑selection.

![Switching cloze modes with the eye button, then making it permanent with the tag button](https://raw.githubusercontent.com/hugomarins/remnote-context-for-cloze/main/img/context-for-cloze-mode-switch.gif)

## Compatibility with queue‑display power‑ups (“Hide in Queue” official plugin and "Incremental Everything" plugin)
The context tree mirrors the queue‑display power‑ups from RemNote’s official “Hide in Queue” plugin **and** from the Incremental Everything plugin. This plugin does not register any of them — it only reads their tags when they exist, so nothing is affected if a power‑up isn’t installed.

Tagged on the item itself:
- Hide in Queue (`hideInQueue`)
  - Shows the placeholder text “Hidden in queue” for that item in the context tree (question stage only; the item shows normally on the answer stage).
- Remove from Queue (`removeFromQueue`)
  - Completely removes the item from the context tree (both question and answer stages).
- No Hierarchy (`noHierarchy`)
  - When present on the current card, the context area only shows “this line” (no ancestors/siblings/descendants), matching RemNote’s native behavior.

Tagged on the card, but targeting an ancestor (Incremental Everything):
- Hide Parent (`hideParent`) / Hide Grandparent (`hideGrandparent`)
  - Shows the “Hidden in queue” placeholder for the card’s parent / grandparent line (question stage only).
- Remove Parent (`removeParent`) / Remove Grandparent (`removeGrandparent`)
  - Completely removes the card’s parent / grandparent line from the context tree (both stages); its remaining children stay, un‑indented.

The current card’s own line is always shown, regardless of any of these tags.

## Back sides and direction arrows
A Rem that is a flashcard keeps its answer in a **back side** (`backText`) — that is what a Concept, a Descriptor or a Question Rem stores. The context tree shows both sides, joined by an arrow that says which way the card is asked:

| Arrow | Practice direction | Reads as |
| --- | --- | --- |
| `⇒` | Forward | front asks, back answers |
| `⇐` | Backward | back asks, front answers |
| `⇔` | Both | either side can ask |

This is the same notation the *Incremental Everything* plugin uses, so a card reads the same way in both.

- When the Rem you are reviewing is itself a front/back card, the side being asked is masked as a blue **?** on the question stage and revealed with the underline + highlight after “Show Answer” — exactly what already happened to a cloze.
- Every *other* flashcard in the tree shows both of its sides revealed by default, and hides its answer side behind one clickable `…` when the tree is in masked mode (see the eye button below).
- A Rem with no back side renders exactly as before.

## Collapsed by default — expand what you need
The context tree starts **collapsed**. Only the branch that leads down to the card under review is open, so the tested line is always visible while deeper descendants — which often spoil or heavily hint at the answer — stay hidden.

- A line with hidden children shows a **▸ arrow** instead of a bullet; click it (or focus it and press Enter/Space) to expand that branch. The arrow points down once the branch is open.
- A line with no hidden children keeps its bullet.
- Expansion is per card: it resets when you move to the next card.
- Prefer the old always‑expanded tree? Turn off **Start Collapsed** in Settings.

## The eye and tag buttons — switch answer modes mid‑review
The tree renders the other lines' answers in one of two modes: **revealed** (blue underline, the default) or **masked** (`…`, the default for a card tagged `Context Hide Others`). “Answer” covers both kinds: a cloze inside a line, and the back side of a flashcard line. An **👁 eye button in the top‑right corner of the context area** switches between them for the card in front of you.

![Switching cloze modes with the eye button, then making it permanent with the tag button](https://raw.githubusercontent.com/hugomarins/remnote-context-for-cloze/main/img/context-for-cloze-mode-switch.gif)

- Eye **open** = the other answers are revealed. Click it to hide them.
- Eye **struck through** = the other answers are masked as `…`. Click it to reveal them.
- Use it *before* reading the tree when the revealed answers turn out to leak a hint you would rather earn — no need to tag the Rem first.
- Use it *after* “Show Answer” when a masked tree is too cryptic to make sense of.
- By itself it changes nothing in your knowledge base: the tag still decides where you start, and the mode resets on the next card.
- The button only appears when some other line actually carries an answer of its own — a cloze or a back side — otherwise there is nothing to switch.
- In masked mode each `…` is still individually clickable, so you can also uncover one answer at a time. A hidden back side is one `…` for the whole side; a cloze is one `…` per blank.

**Make it permanent — the 🏷 tag button.** As soon as the eye puts the tree in a mode that disagrees with the card's tag, a second button appears **to the left of the eye**. Click it and the choice is written to the Rem itself, so every future review starts that way:

- Plain tag icon = *add* `Context Hide Others` to this Rem (keep the other answers hidden).
- Tag icon with a slash = *remove* it from this Rem (keep the other answers revealed).
- Hover or focus either button and a short explanation appears in the same row, to the left of the icons.
- The button disappears once the tag matches what you see, and a toast confirms the change. This is the only action in the plugin that writes to your knowledge base.

## Settings (Settings → Plugins → This Plugin)
- Start Collapsed (default: On)
  - Renders the tree collapsed, with only the path to the current card open; other branches sit behind a clickable ▸ arrow. Depth is no longer capped — collapsing is what keeps a deep tree readable, so you see the whole hierarchy and open only the parts you want.
- Max Nodes (default: 200)
  - A safety budget on how many Rems the tree **collects** before it stops walking. Collapsed branches are still collected, so this — not collapsing — is what keeps a card under a very large anchor from stalling the queue. Raise it if a tree comes out truncated; lower it if a huge document makes cards slow to appear.
- Debug Mode (default: Off)
  - Adds extra hints in UI/console for troubleshooting (most users can keep it off).

## How to Use
1. Pick a Rem as the “context anchor” and add the power‑up “Context for Cloze” (`contextForCloze`).
2. Start reviewing: whenever any descendant becomes a card, a context tree rooted at the anchor appears under the card.
3. Optional: if a card would be spoiled by its neighbours’ revealed answers, add “Context Hide Others” to **that card** — run **Context: Hide Other Answers for This Rem** (`cfchide`). See the dedicated section below.
4. Click the ▸ arrows during review to open any branch you want to see; the rest stays out of the way.
5. Use the 👁 button in the top‑right of the context area to reveal or hide the other lines' answers whenever the current mode does not suit the card — and the 🏷 button next to it if you want that choice to stick to the Rem.
6. Leave Max Nodes alone unless a tree comes out truncated (raise it) or a very large document makes cards slow to appear (lower it).

## Context Hide Others — protecting a cloze from its siblings

**What it does.** By default this plugin hides only the answer you are actually being tested on. Every *other* answer in the context tree — other clozes, and the back side of every other flashcard — is shown **revealed** (blue underline), so the surrounding answers act as visible context.

`Context Hide Others` reverses that for the card it is applied to: while that card is under review, **all other** answers in the tree are **masked** (shown as `…`) instead of revealed. Note the scope difference from the anchor tag: `Context for Cloze` is placed on the **root** of a subtree and affects every descendant, while this one is placed on **a single Rem** and affects only that Rem’s reviews.

The tag sets the **starting** mode only — the 👁 button described above flips it either way for the card in front of you, without changing the tag.

### When there is no context anchor above the Rem
This tag only changes how a *context tree* looks, and a context tree exists only below a Rem tagged `Context for Cloze`. Tagging a Rem with no such ancestor would therefore do nothing at all, so the command checks first. If the anchor is missing, a dialog appears explaining the situation and offering three ways out:

- **Tag the parent too** — the parent becomes the context anchor and the selected Rem gets `Context Hide Others`. The dialog names the parent and states the consequence up front: an anchor cascades, so *every* card under that parent will show a context tree from then on. It also reports how many siblings the Rem has, since those siblings are what the context is made of — with none, the tree would be thin and a higher ancestor may be the better anchor.
- **Tag only this Rem** — adds the tag anyway; it stays dormant until an ancestor becomes an anchor.
- **Cancel** — nothing is written.

On a multi‑selection, the Rems that already sit under an anchor are tagged immediately and the dialog asks only about the rest.

The current card’s own line is always masked as `?` regardless of this power‑up, and plain (non‑cloze) context text is always shown. This power‑up only changes how *other* clozes appear.

**Where to apply it.**
- Apply it to **the cloze card Rem that would receive the unwanted spoiler from its siblings** — i.e. the leaf whose own review you want to keep clean. It is not a group marker: it protects the specific card it sits on.
- Do **not** apply it to the anchor/parent that carries `Context for Cloze`. The effect is keyed to the Rem of the card currently under review, and there is no inheritance down the tree, so a tag on the parent does nothing.
- The protection is per‑card and one‑directional: tagging card A only cleans up **A’s own** review; it has no effect on what B or C show when their turn comes. So when several siblings would each be spoiled by the others, tag **each** card you want protected — any sibling you leave untagged will still reveal all the answers during its own review.
- Tip: select the cloze cards you want to protect and run **Context: Hide Other Answers for This Rem** (`cfchide`) — the command applies to a multi‑selection, so you can tag them in one step.

**When to use it.** Use it when a parent groups several sibling clozes that would spoil each other if shown together — e.g. an enumerated list where each item is its own cloze card, or a set of parallel facts you want to recall independently. Keep the default (don’t tag) when the neighboring answers are legitimate context you *want* to see while recalling the current one.

**Reveal hidden clozes one at a time (click to reveal).** When a card is protected this way, each masked `…` is a button. Click it (or focus it and press Enter/Space) to reveal just that cloze’s answer in place; click again to hide it back to `…`. This lets you self‑evaluate the surrounding hidden clozes gradually — one by one — even though they are not the card being tested. Each `…` toggles independently, the tested blank itself stays hidden (it never becomes clickable), and every reveal resets automatically when you move to the next card.

## Tips
- The plugin only renders in the review queue; the editor view is not affected.
- If the current card is not under any “Context for Cloze” anchor, no context tree is shown.
- When used together with No Hierarchy (`noHierarchy`), only the current line is shown. This is by design.

## Example Screenshots

> The following screenshots help you see how the plugin looks during real reviews.

1) Test structure (context tree blueprint)

![Test structure](https://remnote-user-data.s3.amazonaws.com/zaFqKpkiElkV2UIcTnEPlt0mr09fwkG0FV52yBVdzCJR6nTH0Lb6tEEgRIFht-oEINkdrK8wJF1K3G_VjYmWu-vohCE6RwAez_wvjvR6h-WtUPvVPYpyL0V6XdaGRRlJ.jpeg?loading=false)

2) Review example A (Question stage, clue‑safe)

![Review A](https://remnote-user-data.s3.amazonaws.com/GT9Ausv726feJf22kII7MJhnGCbfhVYFCh5GMtf2mUweNpSQUHn6dtmL0GWSTHzLVnyEJtZjCthc5Rda7aIJ-0eFMO2xhOO6dLqRrvm8SfEzl3FFF3zRx9qR8c0czX5g.jpeg)

3) Review example B (Answer stage, cloze highlight)

![Review B](https://remnote-user-data.s3.amazonaws.com/bXoC-aeiey70Hl_jrjmS0MCUzN82TMPYUJF8KGy9iErqMqAQ-5dGy3UdqW4xbW2ezXFZg1uCgDnM4brRKA8Y0Doz87_VLLUZRS4C7i2t4qmCwVvvi8UZHp9MOaXhutc0.jpeg?loading=false)

- Note: demonstration of the “No Hierarchy” power‑up working together with this plugin.

4) Review example C (Branches / levels at a glance)

![Review C](https://remnote-user-data.s3.amazonaws.com/niJfC_INpPkpidUzOw6ZbY4r7e2bIXbK9zuVoCItDPPv3wv8qVl1b25OpTY8fWGC5JRr2jUHNN9TjOaQzuQwSc2qPqRFzBZRZHEY9vCmDJs-Lux3XYfBZapnr52ZEcyV.jpeg?loading=false)

5) Review example D (Mixed rich‑text content)

![Review D](https://remnote-user-data.s3.amazonaws.com/j_FQj9RxuQnRqFO4X3Qo64siZY_3nHxoU4vQv-Hy1Op5OcAva_IuBPFlVA1EHAsjeywgP-wBHGrBUfjv82I2V-wJ409_IdO6AOJi8w8xHdIc8DfKH9zF9pjiskwoMlyf.jpeg?loading=false)

6) Review example E (Overall look & feel)

![Review E](https://remnote-user-data.s3.amazonaws.com/rSRm6AeAIG7bsA1K74po0wdLr-cfbW9mGaA_Rkdp20qY2A54-2_W8kUy2Y4mkHls_K1CLnhR57677cGcIeBPdBSz_cmpDiTDlTN91M4r184lrhjKT4_f85OUoQ7qLG4h.jpeg?loading=false)

