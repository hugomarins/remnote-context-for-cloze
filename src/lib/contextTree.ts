// Shared context-tree traversal for the question/answer widgets: find the anchor,
// skip metadata/search-portal rems, and collect the masked tree rooted at the anchor.
// 问题/答案挂件共享的上下文树遍历：查找锚点、跳过元数据/搜索门户 Rem、
// 并收集以锚点为根的（已掩码）上下文树。
import { BuiltInPowerupCodes, PORTAL_TYPE } from '@remnote/plugin-sdk';
import { richToHTMLWithClozeMask, richHasCloze, addClozeRevealHighlight } from './clozeMask';

export interface Ctx { remId?: string; cardId?: string; revealed?: boolean }
export interface QueueAdaptOpts { hideSet: Set<string>; removeSet: Set<string>; applyHideInQueue: boolean }
export interface TreeItem { id: string; depth: number; html: string; isCurrent?: boolean; hasCloze?: boolean }
export interface QueueDisplaySets { hideSet: Set<string>; removeSet: Set<string>; noHierarchySet: Set<string> }

const HIDDEN_IN_QUEUE_HTML = '<span style="opacity:.6;color:var(--rn-clr-text-secondary,#57606a);font-style:italic">Hidden in queue</span>';

// Official / incremental-everything queue-display power-up codes. We don't register these
// (other plugins do) — we only read their tags so the context tree mirrors native behavior.
// 官方 / incremental-everything 的队列显示 Power-Up 代码。我们不注册它们（由其他插件注册），
// 只读取其标记，让上下文树与原生行为保持一致。
const QUEUE_CODES = {
  hideInQueue: 'hideInQueue',
  removeFromQueue: 'removeFromQueue',
  noHierarchy: 'noHierarchy',
  hideParent: 'hideParent',
  hideGrandparent: 'hideGrandparent',
  removeParent: 'removeParent',
  removeGrandparent: 'removeGrandparent',
};

// Collect the id sets that drive queue-display adaptation. Direct power-ups (Hide/Remove in
// Queue, No Hierarchy) mark the tagged Rem itself; the Parent/Grandparent variants are tagged
// on the CARD but target its parent/grandparent, so we resolve those to the affected Rem id.
//  - Hide* → hideSet   (placeholder on the question side only, via applyHideInQueue)
//  - Remove* → removeSet (dropped on both sides)
// Missing power-ups (not registered in this KB) simply contribute nothing.
// 收集驱动队列显示适配的 id 集合：直接类作用于被标记 Rem 本身；父级/祖父级类作用于卡片，
// 但目标是其父/祖父，因此需解析为受影响的 Rem id。未注册的 Power-Up 不贡献任何内容。
export async function collectQueueDisplaySets(plugin: any): Promise<QueueDisplaySets> {
  const taggedRems = async (code: string): Promise<any[]> => {
    try {
      const p = await plugin.powerup.getPowerupByCode(code);
      return p ? (await p.taggedRem()) || [] : [];
    } catch {
      return [];
    }
  };
  const [hideDirect, removeDirect, noH, hideParentR, hideGpR, removeParentR, removeGpR] = await Promise.all([
    taggedRems(QUEUE_CODES.hideInQueue),
    taggedRems(QUEUE_CODES.removeFromQueue),
    taggedRems(QUEUE_CODES.noHierarchy),
    taggedRems(QUEUE_CODES.hideParent),
    taggedRems(QUEUE_CODES.hideGrandparent),
    taggedRems(QUEUE_CODES.removeParent),
    taggedRems(QUEUE_CODES.removeGrandparent),
  ]);

  const hideSet = new Set<string>(hideDirect.map((r: any) => r._id));
  const removeSet = new Set<string>(removeDirect.map((r: any) => r._id));
  const noHierarchySet = new Set<string>(noH.map((r: any) => r._id));

  // Parent variants: the tagged Rem's own `.parent` is already the affected id (no extra lookup).
  // 父级变体：被标记 Rem 的 `.parent` 就是受影响 id（无需额外查询）。
  for (const r of hideParentR) { if (r?.parent) hideSet.add(r.parent); }
  for (const r of removeParentR) { if (r?.parent) removeSet.add(r.parent); }

  // Grandparent variants: one lookup to climb from parent to grandparent.
  // 祖父级变体：需一次查询，从父级爬到祖父级。
  const grandparentId = async (r: any): Promise<string | undefined> => {
    if (!r?.parent) return undefined;
    const p = await plugin.rem.findOne(r.parent);
    return p?.parent || undefined;
  };
  await Promise.all([
    ...hideGpR.map(async (r: any) => { const t = await grandparentId(r); if (t) hideSet.add(t); }),
    ...removeGpR.map(async (r: any) => { const t = await grandparentId(r); if (t) removeSet.add(t); }),
  ]);

  return { hideSet, removeSet, noHierarchySet };
}

// Walk up from `remId` to the nearest ancestor tagged with the context power-up (the anchor/root).
// 从 `remId` 向上查找最近的、被上下文 Power-Up 标记的祖先（锚点/根）。
export async function getNearestAnchor(plugin: any, remId: string, powCode: string) {
  const power = await plugin.powerup.getPowerupByCode(powCode);
  if (!power) return null;
  const anchors = await power.taggedRem();
  const set = new Set((anchors || []).map((r: any) => r._id));
  let cur = await plugin.rem.findOne(remId);
  while (cur?.parent) {
    const p = await plugin.rem.findOne(cur.parent);
    if (!p) break;
    if (set.has(p._id)) return p;
    cur = p;
  }
  return null;
}

// Skip rems that shouldn't appear in the context tree:
//  - Search Portal ("query:") rems — their body is a transclusion of query results, which
//    pollutes the tree and may leak the cloze answer. Detected via getPortalType() === SEARCH_PORTAL
//    (the SearchPortal power-up is NOT reliably present on these rems — confirmed by logging).
//    Normal portals (portalType PORTAL / undefined) are deliberately kept: they can be real context.
//  - Title-style metadata rems (Size / 大小).
// 跳过不应出现在上下文树中的 Rem：搜索门户（“query:”）Rem——其内容是查询结果的转写，会污染上下文树
// 并可能泄露答案。通过 getPortalType() === SEARCH_PORTAL 识别（这些 Rem 上并不可靠地带有 SearchPortal
// Power-Up——已由日志证实）。普通门户（portalType 为 PORTAL/undefined）故意保留，它们可能是真实上下文。
// 以及标题样式元数据（Size/大小）。
export async function shouldSkipChildAsMeta(plugin: any, rem: any): Promise<boolean> {
  try {
    if (rem && typeof rem.getPortalType === 'function' && (await rem.getPortalType()) === PORTAL_TYPE.SEARCH_PORTAL) return true;
  } catch {}
  try {
    // Fallback for setups where the SearchPortal power-up IS applied.
    // 兜底：某些环境中 SearchPortal Power-Up 确实存在。
    if (rem && typeof rem.hasPowerup === 'function' && (await rem.hasPowerup(BuiltInPowerupCodes.SearchPortal))) return true;
  } catch {}
  try {
    const s = (await plugin.richText.toString(rem?.text || []) || '').trim();
    const lower = s.toLowerCase();
    if (lower === 'size' || s === '大小') return true;
  } catch {}
  return false;
}

// Resolve the rem that owns the card currently under review (falls back to ctx.remId).
// 解析当前正在复习的卡片所属的 Rem（回退到 ctx.remId）。
export async function getCurrentCardRemId(plugin: any, ctx: Ctx | undefined) {
  if (ctx?.cardId) {
    try {
      const card = await plugin.card.findOne(ctx.cardId);
      if (card) {
        const rem = await card.getRem();
        if (rem?._id) return rem._id;
        // @ts-ignore
        if ((card as any).remId) return (card as any).remId;
      }
    } catch (e) {
      console.error('[CFC] getCurrentCardRemId error:', e);
    }
  }
  return ctx?.remId;
}

// Depth-first collect the tree rooted at `root`, masking cloze content per policy.
//  - The current card's line: masked as "?" on the question stage, or revealed (highlighted) on the answer stage.
//  - Other lines: masked as clickable "…" when `shouldMask`, otherwise revealed.
// `currentIsQuestionStage` selects the current-line rendering; official Hide/Remove marks are honoured via `opts`.
// 深度优先收集以 `root` 为根的树，并按策略对 cloze 掩码。
export async function collectFullTree(
  plugin: any,
  root: any,
  currentRemId: string,
  maxDepth: number,
  maxNodes: number,
  shouldMask: boolean,
  currentIsQuestionStage: boolean,
  opts?: QueueAdaptOpts,
  tag = '[CFC]'
): Promise<TreeItem[]> {
  const items: TreeItem[] = [];
  let count = 0;
  async function dfs(rem: any, depth: number) {
    if (depth > maxDepth || count >= maxNodes) return;
    const id = rem._id;
    let html = '';
    let isCurrent = false;
    let hasCloze = false;
    let removed = false;
    if (id === currentRemId) {
      isCurrent = true;
      const rich = rem.text || [];
      hasCloze = richHasCloze(rich);
      if (currentIsQuestionStage) {
        html = await richToHTMLWithClozeMask(plugin, rich, 'question', tag);
      } else {
        html = await richToHTMLWithClozeMask(plugin, rich, 'none', tag);
        html = addClozeRevealHighlight(html);
      }
    } else {
      const rich = rem.text || [];
      hasCloze = richHasCloze(rich);
      removed = !!opts?.removeSet?.has(id);
      if (!removed) {
        if (opts?.applyHideInQueue && opts?.hideSet?.has(id)) {
          html = HIDDEN_IN_QUEUE_HTML;
        } else {
          html = await richToHTMLWithClozeMask(plugin, rich, shouldMask ? 'ellipsis' : 'none', tag);
        }
      }
    }
    if (!removed) items.push({ id, depth, html, isCurrent, hasCloze });
    count++;
    if (count >= maxNodes) return;
    const children = (await rem.getChildrenRem()) || [];
    for (const ch of children) {
      if (count >= maxNodes) break;
      if (await shouldSkipChildAsMeta(plugin, ch)) continue;
      await dfs(ch, removed ? depth : depth + 1);
    }
  }
  await dfs(root, 0);
  return items;
}
