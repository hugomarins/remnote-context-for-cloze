import { renderWidget, usePlugin, useRunAsync } from '@remnote/plugin-sdk';
import * as React from 'react';
import { addClozeRevealHighlight, richHasCloze, richToHTMLWithClozeMask } from '../lib/clozeMask';
import { useRevealDelegation } from '../lib/revealInteraction';
import { useRevealedAnswer } from '../lib/useRevealedAnswer';
import { collectFullTree, collectQueueDisplaySets, getCurrentCardRemId, getNearestAnchor, TreeItem } from '../lib/contextTree';
import { ContextTreeView } from '../lib/contextTreeView';

const POW_CODE = 'contextForCloze';
const HIDE_ALL_TEST_ONE = 'contextHideAllTestOne';
const LOG = '[CFC][A]';

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
  // 可靠的揭示状态（事件驱动 + 轮询兜底；原因见 useRevealedAnswer）。
  const revealed = useRevealedAnswer(plugin);

  const debug = useRunAsync(async () => !!(await plugin.settings.getSetting('debug')), []);

  // Start-collapsed preference. `undefined` while the setting is still loading — the tree is only
  // rendered once it resolves, so a branch never flashes open before collapsing.
  // “初始折叠”偏好。设置加载完成前为 undefined——树在其解析后才渲染，避免分支先展开再折叠的闪烁。
  const startCollapsedSetting = useRunAsync(
    async () => (await plugin.settings.getSetting('startCollapsed')) !== false,
    []
  );

  const { items, enabled } = (useRunAsync(async () => {
    try {
      const isDebug = await plugin.settings.getSetting('debug');

      if (!ctx?.remId) {
        setErrorCount((prev) => prev + 1);
        return { items: [] as TreeItem[], enabled: false };
      }
      if (!revealed) {
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

      // Guard: if the path from anchor to current exceeds maxDepth, show no context.
      // 若当前卡片相对锚点的深度超过 maxDepth，则不显示上下文。
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
      // 队列显示标记集合（Hide/Remove in Queue、No Hierarchy，以及父级/祖父级变体）。
      const { hideSet, removeSet, noHierarchySet } = await collectQueueDisplaySets(plugin);

      // No Hierarchy on the current card: show only the current line (matches native).
      // 当前题目带 noHierarchy：仅显示“当前题目这一行”，对齐原生。
      if (noHierarchySet.has(maskId || ctx.remId)) {
        const cur = await plugin.rem.findOne(maskId || ctx.remId);
        const rich = cur?.text || [];
        const hasCloze = richHasCloze(rich);
        let html = await richToHTMLWithClozeMask(plugin, rich, 'none', LOG);
        html = addClozeRevealHighlight(html);
        const only: TreeItem[] = [{ id: cur?._id || (maskId || ctx.remId), depth: 0, html, isCurrent: true, hasCloze }];
        return { items: only, shouldMask: false, enabled: true } as any;
      }

      // Hide All Test One on the current card → mask other lines' clozes as clickable "…".
      // 当前题目带 Hide All Test One → 将其他行的 cloze 掩码为可点击的“…”。
      const shouldMask = await (async () => {
        try {
          const power = await plugin.powerup.getPowerupByCode(HIDE_ALL_TEST_ONE);
          const tagged = power ? await power.taggedRem() : [];
          const set = new Set((tagged || []).map((r: any) => r._id));
          return set.has(maskId || ctx.remId);
        } catch {
          return false;
        }
      })();

      const items = await collectFullTree(plugin, anchor, maskId || ctx.remId, maxDepth, maxNodes, shouldMask, false, { hideSet, removeSet, applyHideInQueue: false }, LOG);
      if (isDebug) console.log(`${LOG} generated`, items.length, 'items');
      return { items, shouldMask, enabled: true };
    } catch (e) {
      console.error(`${LOG} useRunAsync error:`, e);
      setErrorCount((prev) => prev + 1);
      return { items: [], enabled: false };
    }
  }, [ctx?.remId, revealed]) || { items: [], shouldMask: true, enabled: false }) as any;

  // Wire up click-to-reveal for masked sibling clozes.
  // 为被遮挡的兄弟 cloze 接入“点击揭示”。
  useRevealDelegation(rootRef, items);

  if (errorCount >= MAX_ERRORS) {
    console.error(`${LOG} reached max errors, stopping render`);
    return (
      <div className="cfc-container" style={{ padding: '10px', color: 'red', border: '1px solid red' }}>
        <div>Plugin encountered errors and stopped. Check the console log.</div>
      </div>
    );
  }
  if (!revealed) return null;
  if (!enabled) return null; // no anchor in ancestry => render nothing
  if (!items.length) {
    return debug ? (
      <div className="cfc-container"><div className="cfc-empty">No extra context</div></div>
    ) : null;
  }
  if (startCollapsedSetting === undefined) return null; // setting still loading

  return (
    <div ref={rootRef} className="cfc-container" style={{ width: '100%', boxSizing: 'border-box', minWidth: 0, maxWidth: '100%', borderTop: '1px solid var(--rn-clr-border, #e4e8ef)', paddingTop: 6, overflowX: 'hidden', overflowY: 'visible' }}>
      <ContextTreeView items={items} startCollapsed={startCollapsedSetting !== false} />
    </div>
  );
}

renderWidget(Widget);
