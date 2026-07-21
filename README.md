# Context for Cloze — User Guide (English)

[Read this guide in Chinese »](./README_ZH.md)

Make your reviews clearer by showing where the current card sits in your knowledge tree. This plugin renders a compact “Context Tree” under the card in the review queue, so you can orient, associate, and recall — without changing the card content or scheduling.

## Features
- Context for Cloze (Core)
  - Add the power‑up “Context for Cloze” (code: `contextForCloze`) to a Rem. All its descendants, when reviewed as cards, will show a context tree rooted at that Rem under the card.
  - Question stage: the context is shown while avoiding any leak of cloze answers.
  - Answer stage: the context remains; revealed cloze is indicated by a blue underline with a light‑blue highlight for easy comparison.
- Context Hide All Test One (`contextHideAllTestOne`) — “Hide All others, Test this One.”
  - By default, the context tree hides only the blank you are actually being tested on; every *other* cloze line is shown with its answer revealed. Tag a cloze card with this power‑up when you don’t want **that card’s** review to be spoiled by its siblings — while it is under review, all other cloze answers are hidden (shown as `…`) instead.
  - Apply it to the cloze card Rem that would receive the spoiler (the leaf), **not** to the anchor/parent. See [Context Hide All Test One](#context-hide-all-test-one--protecting-a-cloze-from-its-siblings) below.
- How to add power‑ups to Rems
  - Commands:
    - Add Context for Cloze (quick code `cfc`)
    - Add Context Hide All Test One (quick code `cfcnohide`)
  - Works on multi‑selection.

## Compatibility with RemNote’s official “Hide in Queue” plugin
Fully adapted to the three official power‑ups:
- Hide in Queue (`hideInQueue`)
  - Shows the placeholder text “Hidden in queue” for that item in the context tree.
- Remove from Queue (`removeFromQueue`)
  - Completely removes the item from the context tree (both in question and answer stages).
- No Hierarchy (`noHierarchy`)
  - When present on the current card, the context area only shows “this line” (no ancestors/siblings/descendants), matching RemNote’s native behavior.

## Settings (Settings → Plugins → This Plugin)
- Max Depth (default: 3)
  - Limits the maximum depth of the context tree. Reduce for deep hierarchies to improve readability.
- Max Nodes (default: 100)
  - Limits the maximum number of nodes shown. Reduce for highly branched trees to avoid overload.
- Debug Mode (default: Off)
  - Adds extra hints in UI/console for troubleshooting (most users can keep it off).

## How to Use
1. Pick a Rem as the “context anchor” and add the power‑up “Context for Cloze” (`contextForCloze`).
2. Start reviewing: whenever any descendant becomes a card, a context tree rooted at the anchor appears under the card.
3. Optional: if a cloze card would be spoiled by its siblings’ revealed answers, add “Context Hide All Test One” (`contextHideAllTestOne`) to **that card**. See the dedicated section below.
4. Tune Max Depth / Max Nodes in Settings to balance information density and readability.

## Context Hide All Test One — protecting a cloze from its siblings

**What it does.** By default this plugin hides only the blank you are actually being tested on. Every *other* cloze in the context tree — siblings, and any other cloze line — is shown with its answer **revealed** (blue underline), so the surrounding answers act as visible context.

`Context Hide All Test One` reverses that for the card it is applied to: while that card is under review, the answers on **all other** cloze lines in the tree are **masked** (shown as `…`) instead of revealed. Mnemonic: *Hide All [other answers], Test [this] One.*

The current card’s own line is always masked as `?` regardless of this power‑up, and plain (non‑cloze) context text is always shown. This power‑up only changes how *other* clozes appear.

**Where to apply it.**
- Apply it to **the cloze card Rem that would receive the unwanted spoiler from its siblings** — i.e. the leaf whose own review you want to keep clean. It is not a group marker: it protects the specific card it sits on.
- Do **not** apply it to the anchor/parent that carries `Context for Cloze`. The effect is keyed to the Rem of the card currently under review, and there is no inheritance down the tree, so a tag on the parent does nothing.
- The protection is per‑card and one‑directional: tagging card A only cleans up **A’s own** review; it has no effect on what B or C show when their turn comes. So when several siblings would each be spoiled by the others, tag **each** card you want protected — any sibling you leave untagged will still reveal all the answers during its own review.
- Tip: select the cloze cards you want to protect and run **Add Context Hide All Test One** (`cfcnohide`) — the command applies to a multi‑selection, so you can tag them in one step.

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

