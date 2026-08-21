import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation, SelectionType } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';
import { addPowerupToRems, planHideOtherAnswers } from '../lib/anchorCheck';
import {
  ACTION_HIDE_OTHER_ANSWERS,
  LABEL_CONTEXT_FOR_CLOZE,
  LABEL_HIDE_OTHER_ANSWERS,
  PREVIOUS_LABELS_HIDE_OTHER_ANSWERS,
  POW_CONTEXT_FOR_CLOZE as POW_CODE,
  POW_HIDE_OTHER_ANSWERS as POW_CODE_HIDE_OTHER_ANSWERS,
} from '../lib/powerups';

async function onActivate(plugin: ReactRNPlugin) {
  // Settings
  await plugin.settings.registerNumberSetting({ id: 'maxDepth', title: 'Max Depth', description: 'Maximum depth of the context tree.', defaultValue: 8 });
  await plugin.settings.registerNumberSetting({ id: 'maxNodes', title: 'Max Nodes', description: 'Maximum number of nodes shown.', defaultValue: 200 });
  await plugin.settings.registerBooleanSetting({ id: 'startCollapsed', title: 'Start Collapsed', description: 'Show the context tree collapsed: only the branches leading to the card under review are open, deeper branches are hidden behind a ▸ arrow you can click to expand (avoids spoiling the answer). Turn off to always show the whole tree.', defaultValue: true });
  await plugin.settings.registerBooleanSetting({ id: 'debug', title: 'Debug Mode', description: 'Enable debugging (console logs and placeholder hints).', defaultValue: false });
  await plugin.app.toast('Context for Cloze activated');
  console.log('[CFC] Plugin activated');

  // Power-Up
  await plugin.app.registerPowerup({ name: LABEL_CONTEXT_FOR_CLOZE, code: POW_CODE, description: 'Tag the ROOT of a subtree: every descendant of it shows a context tree rooted here while being reviewed.', options: { slots: [] } });
  await plugin.app.registerPowerup({ name: LABEL_HIDE_OTHER_ANSWERS, code: POW_CODE_HIDE_OTHER_ANSWERS, description: `Tag an individual cloze Rem — not the context anchor. While that Rem is under review, the other cloze answers in its context tree start hidden as "…" instead of revealed. Affects only the Rem you tag; the eye button in the review widget can flip it for a single review.`, options: { slots: [] } });

  // registerPowerup() creates the power-up Rem the first time and then leaves its text alone, so a
  // knowledge base that already has the tag keeps showing whatever name it was created with — which
  // is why renaming the label in code did nothing for existing KBs. Rewrite the Rem's text here,
  // but only while it still carries a label WE shipped: if the user renamed the tag themselves,
  // that name is theirs to keep.
  const PREVIOUS_LABELS: Record<string, string[]> = {
    [POW_CODE_HIDE_OTHER_ANSWERS]: PREVIOUS_LABELS_HIDE_OTHER_ANSWERS,
  };
  const syncPowerupLabel = async (code: string, label: string) => {
    try {
      const rem = await plugin.powerup.getPowerupByCode(code);
      if (!rem) return;
      const current = ((await plugin.richText.toString(rem.text || [])) || '').trim();
      if (current === label) return;
      if (current && !(PREVIOUS_LABELS[code] || []).includes(current)) return;
      await rem.setText([label]);
      console.log(`[CFC] renamed power-up ${code}: "${current}" → "${label}"`);
    } catch (e) {
      console.error(`[CFC] could not rename power-up ${code}:`, e);
    }
  };
  await syncPowerupLabel(POW_CODE, LABEL_CONTEXT_FOR_CLOZE);
  await syncPowerupLabel(POW_CODE_HIDE_OTHER_ANSWERS, LABEL_HIDE_OTHER_ANSWERS);

  // Commands operate on the current selection, single Rem or multi-selection alike.
  const selectedRemIds = async (): Promise<string[]> => {
    const sel = await plugin.editor.getSelection();
    if (!sel?.type) return [];
    if (sel.type === SelectionType.Rem) return sel.remIds || [];
    return sel.remId ? [sel.remId] : [];
  };

  const runAddPowerupCommand = async (powerup: string, label: string) => {
    const remIds = await selectedRemIds();
    if (!remIds.length) return;
    await addPowerupToRems(plugin, remIds, powerup);
    await plugin.app.toast(`Added "${label}"`);
  };

  // "Hide Other Answers" is inert unless the Rem sits below a context anchor, so this command
  // checks first and, when the anchor is missing, hands over to a popup that explains the situation
  // and offers to place one on the parent. Rems that are already covered are tagged straight away.
  const runHideOtherAnswersCommand = async () => {
    const remIds = await selectedRemIds();
    if (!remIds.length) return;
    const { anchored, orphans } = await planHideOtherAnswers(plugin, remIds);
    if (!orphans.length) {
      await addPowerupToRems(plugin, anchored, POW_CODE_HIDE_OTHER_ANSWERS);
      await plugin.app.toast(`Added "${LABEL_HIDE_OTHER_ANSWERS}"`);
      return;
    }
    if (anchored.length) await addPowerupToRems(plugin, anchored, POW_CODE_HIDE_OTHER_ANSWERS);
    await plugin.widget.openPopup('context_anchor_prompt', { orphans, taggedAlready: anchored.length });
  };

  await plugin.app.registerCommand({ id: 'add-context-for-cloze', name: 'Add Context for Cloze', quickCode: 'cfc', action: async () => runAddPowerupCommand(POW_CODE, LABEL_CONTEXT_FOR_CLOZE) });
  await plugin.app.registerCommand({ id: 'add-context-hide-all-test-one', name: ACTION_HIDE_OTHER_ANSWERS, quickCode: 'cfchide', action: runHideOtherAnswersCommand });

  await plugin.app.registerCommand({ id: 'cfc-debug', name: 'CFC: Debug Probe', quickCode: 'cfcdbg', action: async () => {
    try {
      const sel = await plugin.editor.getSelection();
      const remId = sel?.type === SelectionType.Rem ? sel.remIds?.[0] : sel?.remId;
      let msg = '[CFC][Debug]';
      msg += ` remId=${remId || 'none'}`;
      if (remId) {
        const power = await plugin.powerup.getPowerupByCode(POW_CODE);
        const anchors = power ? await power.taggedRem() : [];
        const set = new Set((anchors||[]).map((r:any)=>r._id));
        let cur = await plugin.rem.findOne(remId);
        let anchor:any = null;
        while (cur?.parent) {
          const p = await plugin.rem.findOne(cur.parent);
          if (!p) break;
          if (set.has(p._id)) { anchor = p; break; }
          cur = p;
        }
        msg += ` anchor=${anchor?._id || 'none'}`;
      }
      const debug = await plugin.settings.getSetting('debug');
      msg += ` debug=${!!debug}`;
      await plugin.app.toast(msg);
      console.log(msg);
    } catch (e) {
      console.error('[CFC][Debug] error', e);
      await plugin.app.toast('CFC Debug Error - see console');
    }
  }});

  // Question / answer widgets. Both mount at FlashcardUnder so the native card area is left
  // untouched; each component gates itself on the current stage.
  await plugin.app.registerWidget('flashcard_context_question', WidgetLocation.FlashcardUnder, { dimensions: { height: 'auto', width: '100%' } });
  await plugin.app.registerWidget('flashcard_context_answer',   WidgetLocation.FlashcardUnder, { dimensions: { height: 'auto', width: '100%' } });

  // Confirmation popup for the command above, shown only when the anchor is missing.
  await plugin.app.registerWidget('context_anchor_prompt', WidgetLocation.Popup, { dimensions: { width: 520, height: 'auto' } });

  // Hover preview for a rem reference inside the context tree. Floating rather than a popup so it
  // sits next to the reference without covering the card, and host-level so it is not clipped by
  // the tree's own widget iframe (which is only as tall as its content).
  await plugin.app.registerWidget('rem_preview', WidgetLocation.FloatingWidget, { dimensions: { width: 460, height: 'auto' } });

  // CSS: queue-only styling that stays close to the native look and hides in the editor.
  const CFC_CSS = `
    /* Show only inside the review queue. */
    .rn-queue__content .cfc-container { margin: 6px 0 0; padding: 0; font-size: 0.92rem; line-height: 1.45; color: var(--rn-clr-text, #1f2328); }
    .rn-queue__content .cfc-title { display: none; color: var(--rn-clr-text-secondary, #57606a); font-weight: 600; margin-bottom: 4px; }
    .rn-queue__content .rn-dialog .cfc-container { display: none !important; }

    /* Keep the context block inside the widget iframe so no horizontal scrollbar appears. */
    .rn-queue__content .cfc-container { box-sizing: border-box; max-width: 100%; overflow-x: hidden; }
    .rn-queue__content .cfc-container * { min-width: 0; }

    /* List and item styling: no default bullets, no oversized indent. */
    .rn-queue__content .cfc-list { list-style: none; margin: 0; padding-left: 0; }
    .rn-queue__content .cfc-item { margin: 5px 0; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; }

    /* Yellow ellipsis chip (same size / radius / border as the blue question chip). */
    .rn-queue__content .cfc-omission {
      display: inline-block; padding: 0 10px; border-radius: 8px; line-height: 1.45;
      background: var(--rn-clr-warning-muted, rgba(255,212,0,0.15));
      color: var(--rn-clr-warning, #b58900);
      border: 1px solid rgba(255,212,0,0.3);
    }

    /* Underline hint on revealed cloze content (purely visual). */
    .rn-queue__content .cfc-revealed-cloze {
      text-decoration: underline;
      text-decoration-color: var(--rn-clr-accent, #0969da);
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
    }

    /* Click-to-reveal masked clozes (Hide Other Answers): the "…" is a button; */
    /* once revealed it drops the chip background so it reads as inline text. */
    .rn-queue__content .cfc-reveal { cursor: pointer; user-select: none; }
    .rn-queue__content .cfc-reveal:hover { outline: 1px dashed var(--rn-clr-warning, #b58900); outline-offset: 1px; }
    .rn-queue__content .cfc-omission.cfc-revealed {
      background: transparent; color: inherit; padding: 0; cursor: pointer; user-select: text;
    }
  `;
  try {
    const upsertStyle = (id: string, css: string) => {
      const d = document;
      let tag = d.getElementById(id) as HTMLStyleElement | null;
      if (!tag) { tag = d.createElement('style'); tag.id = id; d.head.appendChild(tag); }
      tag.textContent = css;
    };
    upsertStyle('cfc-queue-scope', CFC_CSS);
    console.log('[CFC][CSS] injected locally (no registerCSS)');
  } catch (e) {
    console.error('[CFC][CSS] local inject failed', e);
  }
}

async function onDeactivate(_: ReactRNPlugin) {
  // No teardown needed.
}

declareIndexPlugin(onActivate, onDeactivate);
