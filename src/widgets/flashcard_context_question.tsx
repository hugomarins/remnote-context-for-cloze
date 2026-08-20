import { renderWidget, usePlugin, useRunAsync } from '@remnote/plugin-sdk';
import * as React from 'react';
import { richHasCloze, richToHTMLWithClozeMask } from '../lib/clozeMask';
import { useRevealDelegation } from '../lib/revealInteraction';
import { useRevealedAnswer } from '../lib/useRevealedAnswer';
import { collectFullTree, collectQueueDisplaySets, getCurrentCardRemId, getNearestAnchor, TreeItem } from '../lib/contextTree';
import { ContextTreeView } from '../lib/contextTreeView';

const POW_CODE = 'contextForCloze';
const HIDE_ALL_TEST_ONE = 'contextHideAllTestOne';
const LOG = '[CFC][Q]';

function Widget() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const plugin = usePlugin();
  const [errorCount, setErrorCount] = React.useState(0);
  const MAX_ERRORS = 10;

  const ctx = useRunAsync(async () => {
    try {
      return await plugin.widget.getWidgetContext();
    } catch (e) {
      console.error(`${LOG} getWidgetContext failed:`, e);
      setErrorCount((prev) => prev + 1);
      return null;
    }
  }, []) as any;

  // Reliable reveal state (event-driven + polled fallback; see useRevealedAnswer for why).
  const revealed = useRevealedAnswer(plugin);

  const debug = useRunAsync(async () => !!(await plugin.settings.getSetting('debug')), []);

  // Start-collapsed preference. `undefined` while the setting is still loading — the tree is only
  // rendered once it resolves, so a branch never flashes open before collapsing.
  const startCollapsedSetting = useRunAsync(
    async () => (await plugin.settings.getSetting('startCollapsed')) !== false,
    []
  );

  const { items, enabled, defaultMasked } = (useRunAsync(async () => {
    try {
      const isDebug = await plugin.settings.getSetting('debug');

      if (!ctx?.remId) {
        setErrorCount((prev) => prev + 1);
        return { items: [] as TreeItem[], enabled: false };
      }
      if (revealed) {
        return { items: [], enabled: false };
      }

      const maskId = await getCurrentCardRemId(plugin, ctx);
      const anchor = await getNearestAnchor(plugin, maskId || ctx.remId, POW_CODE);
      if (!anchor) {
        setErrorCount((prev) => prev + 1);
        return { items: [], enabled: false };
      }
      setErrorCount(0);

      const rawDepth = await plugin.settings.getSetting('maxDepth');
      const rawNodes = await plugin.settings.getSetting('maxNodes');
      let md = Number(rawDepth); if (!Number.isFinite(md) || md < 0) md = 999;
      let mn = Number(rawNodes); if (!Number.isFinite(mn) || mn < 0) mn = 10000;
      const maxDepth = md;
      const maxNodes = mn;

      // If the current card is deeper than maxDepth below the anchor, show no context.
      const depthToCurrent = await (async () => {
        try {
          let d = 0;
          let cur = await plugin.rem.findOne(maskId || ctx.remId);
          while (cur && cur._id !== anchor._id && cur.parent) {
            cur = await plugin.rem.findOne(cur.parent);
            d++;
            if (d > 2048) break;
          }
          return cur && cur._id === anchor._id ? d : Number.POSITIVE_INFINITY;
        } catch {
          return Number.POSITIVE_INFINITY;
        }
      })();
      if (depthToCurrent > maxDepth) {
        if (isDebug) console.log(`${LOG} over maxDepth`, { depthToCurrent, maxDepth });
        return { items: [], enabled: false } as any;
      }

      // Queue-display tag sets (Hide/Remove in Queue, No Hierarchy, and the parent/grandparent variants).
      const { hideSet, removeSet, noHierarchySet } = await collectQueueDisplaySets(plugin);

      // No Hierarchy on the current card: show only the current line (matches native).
      if (noHierarchySet.has(maskId || ctx.remId)) {
        const cur = await plugin.rem.findOne(maskId || ctx.remId);
        const rich = cur?.text || [];
        const hasCloze = richHasCloze(rich);
        const html = await richToHTMLWithClozeMask(plugin, rich, 'question', LOG);
        const only: TreeItem[] = [{ id: cur?._id || (maskId || ctx.remId), depth: 0, html, isCurrent: true, hasCloze }];
        return { items: only, defaultMasked: false, enabled: true } as any;
      }

      // Hide All Test One on the current card → START with the other lines' clozes masked as
      // clickable "…". From here on it is only a default: the eye button in the widget flips the
      // mode for this card without touching the tag.
      const defaultMasked = await (async () => {
        try {
          const power = await plugin.powerup.getPowerupByCode(HIDE_ALL_TEST_ONE);
          const tagged = power ? await power.taggedRem() : [];
          const set = new Set((tagged || []).map((r: any) => r._id));
          return set.has(maskId || ctx.remId);
        } catch {
          return false;
        }
      })();

      const items = await collectFullTree(plugin, anchor, maskId || ctx.remId, maxDepth, maxNodes, true, { hideSet, removeSet, applyHideInQueue: true }, LOG);
      if (isDebug) console.log(`${LOG} generated`, items.length, 'items');
      return { items, defaultMasked, enabled: true };
    } catch (e) {
      console.error(`${LOG} useRunAsync error:`, e);
      setErrorCount((prev) => prev + 1);
      return { items: [], enabled: false };
    }
  }, [ctx?.remId, revealed]) || { items: [], defaultMasked: false, enabled: false }) as any;

  // Cloze mode for the card in front of us. `null` = follow the card's own default; the eye
  // button pins it either way until the tree changes (next card, or the question→answer flip).
  const [maskOverride, setMaskOverride] = React.useState<boolean | null>(null);
  // Local view of the card's "Context Hide All Test One" tag. Tagging is written straight to the
  // Rem, but the collected tree is not re-read for it, so we track the new value here to keep the
  // toolbar honest for the rest of this card.
  const [taggedOverride, setTaggedOverride] = React.useState<boolean | null>(null);
  React.useEffect(() => { setMaskOverride(null); setTaggedOverride(null); }, [items]);
  const tagged = taggedOverride ?? !!defaultMasked;
  const masked = maskOverride ?? tagged;

  // Nothing to switch between unless some OTHER line carries a cloze of its own.
  const canToggleMask = React.useMemo(
    () => (items as TreeItem[]).some((it) => !!it.maskedHtml),
    [items]
  );
  const currentRemId = React.useMemo(
    () => (items as TreeItem[]).find((it) => it.isCurrent)?.id,
    [items]
  );

  // Make the current mode stick: tag the Rem to keep the other answers hidden, or untag it to keep
  // them revealed. This is the one place the plugin writes to the knowledge base.
  const persistMask = React.useCallback(async () => {
    if (!currentRemId) return;
    try {
      const rem = await plugin.rem.findOne(currentRemId);
      if (!rem) return;
      if (masked) await rem.addPowerup(HIDE_ALL_TEST_ONE);
      else await rem.removePowerup(HIDE_ALL_TEST_ONE);
      setTaggedOverride(masked);
      setMaskOverride(null);
      await plugin.app.toast(
        masked
          ? 'Tagged: the other answers stay hidden for this Rem'
          : 'Untagged: the other answers stay revealed for this Rem'
      );
    } catch (e) {
      console.error(`${LOG} could not update the Hide All Test One tag:`, e);
      await plugin.app.toast('Could not update the "Context Hide All Test One" tag');
    }
  }, [plugin, currentRemId, masked]);

  // Wire up click-to-reveal for masked sibling clozes.
  useRevealDelegation(rootRef, items);

  // Gating (after all hooks):
  if (errorCount >= MAX_ERRORS) {
    console.error(`${LOG} reached max errors, stopping render`);
    return (
      <div className="cfc-container" style={{ padding: '10px', color: 'red', border: '1px solid red' }}>
        <div>Plugin encountered errors and stopped. Check the console log.</div>
      </div>
    );
  }
  if (revealed) return null;
  if (!enabled) return null; // no anchor in ancestry => render nothing
  if (!items.length) {
    return debug ? (
      <div className="cfc-container"><div className="cfc-empty">No extra context</div></div>
    ) : null;
  }
  if (startCollapsedSetting === undefined) return null; // setting still loading

  return (
    <div ref={rootRef} className="cfc-container" style={{ width: '100%', display: 'block', boxSizing: 'border-box', minWidth: 0, maxWidth: '100%', borderTop: '1px solid var(--rn-clr-border, #e4e8ef)', paddingTop: 6, overflowX: 'hidden', overflowY: 'visible' }}>
      <ContextTreeView
        items={items}
        startCollapsed={startCollapsedSetting !== false}
        masked={masked}
        onToggleMasked={canToggleMask ? () => setMaskOverride(!masked) : undefined}
        onPersistMask={canToggleMask && currentRemId && masked !== tagged ? persistMask : undefined}
      />
    </div>
  );
}

renderWidget(Widget);
