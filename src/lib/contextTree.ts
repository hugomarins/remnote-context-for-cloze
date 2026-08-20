// Shared context-tree traversal for the question/answer widgets: find the anchor,
// skip metadata/search-portal rems, and collect the masked tree rooted at the anchor.
import { BuiltInPowerupCodes, PORTAL_TYPE } from '@remnote/plugin-sdk';
import { richToHTMLWithClozeMask, richHasCloze, addClozeRevealHighlight } from './clozeMask';

export interface Ctx { remId?: string; cardId?: string; revealed?: boolean }
export interface QueueAdaptOpts { hideSet: Set<string>; removeSet: Set<string>; applyHideInQueue: boolean }
// `html` is the revealed rendering of the line; `maskedHtml` is the same line with its OTHER
// clozes masked as clickable "…", and is present only where the two actually differ (a line with
// no cloze of its own renders identically either way). Both are produced in one pass so the
// widget's reveal/hide toggle is a pure re-render — no second walk of the knowledge base.
//
// `parentId` / `hasChildren` drive the collapsible rendering in the widgets: `parentId` is the
// EFFECTIVE parent inside the collected tree (a "Remove from Queue" node is dropped and its
// children are re-attached to its own parent), and `hasChildren` is true only when at least one
// child actually made it into the list (so a chevron never promises content that maxDepth /
// maxNodes / metadata-skipping already cut).
export interface TreeItem { id: string; depth: number; html: string; maskedHtml?: string; isCurrent?: boolean; hasCloze?: boolean; parentId?: string; hasChildren?: boolean }
export interface QueueDisplaySets { hideSet: Set<string>; removeSet: Set<string>; noHierarchySet: Set<string> }

const HIDDEN_IN_QUEUE_HTML = '<span style="opacity:.6;color:var(--rn-clr-text-secondary,#57606a);font-style:italic">Hidden in queue</span>';

// Official / incremental-everything queue-display power-up codes. We don't register these
// (other plugins do) — we only read their tags so the context tree mirrors native behavior.
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
  for (const r of hideParentR) { if (r?.parent) hideSet.add(r.parent); }
  for (const r of removeParentR) { if (r?.parent) removeSet.add(r.parent); }

  // Grandparent variants: one lookup to climb from parent to grandparent.
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
//  - Title-style metadata rems: RemNote's "Size" label, matched in English and in the Chinese
//    localization it carries in a zh knowledge base.
export async function shouldSkipChildAsMeta(plugin: any, rem: any): Promise<boolean> {
  try {
    if (rem && typeof rem.getPortalType === 'function' && (await rem.getPortalType()) === PORTAL_TYPE.SEARCH_PORTAL) return true;
  } catch {}
  try {
    // Fallback for setups where the SearchPortal power-up IS applied.
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
//  - The current card's line: masked as "?" on the question stage, or revealed (highlighted) on the
//    answer stage. It is never affected by the reveal/hide toggle — it is the line being tested.
//  - Other lines: rendered BOTH ways (`html` revealed, `maskedHtml` as clickable "…"), so the widget
//    can switch between the two modes without re-collecting.
// `currentIsQuestionStage` selects the current-line rendering; official Hide/Remove marks are honoured via `opts`.
export async function collectFullTree(
  plugin: any,
  root: any,
  currentRemId: string,
  maxDepth: number,
  maxNodes: number,
  currentIsQuestionStage: boolean,
  opts?: QueueAdaptOpts,
  tag = '[CFC]'
): Promise<TreeItem[]> {
  const items: TreeItem[] = [];
  let count = 0;
  async function dfs(rem: any, depth: number, parentId?: string) {
    if (depth > maxDepth || count >= maxNodes) return;
    const id = rem._id;
    let html = '';
    let maskedHtml: string | undefined;
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
          html = await richToHTMLWithClozeMask(plugin, rich, 'none', tag);
          // Only a line that owns a cloze can look different when masked, so skip the second
          // render everywhere else — that is most of the tree.
          if (hasCloze) maskedHtml = await richToHTMLWithClozeMask(plugin, rich, 'ellipsis', tag);
        }
      }
    }
    if (!removed) items.push({ id, depth, html, maskedHtml, isCurrent, hasCloze, parentId, hasChildren: false });
    count++;
    if (count >= maxNodes) return;
    const children = (await rem.getChildrenRem()) || [];
    for (const ch of children) {
      if (count >= maxNodes) break;
      if (await shouldSkipChildAsMeta(plugin, ch)) continue;
      await dfs(ch, removed ? depth : depth + 1, removed ? parentId : id);
    }
  }
  await dfs(root, 0, undefined);
  // Flag the nodes that actually ended up with a visible child, so the widgets know where to
  // draw a collapse/expand arrow instead of a bullet.
  const parents = new Set(items.map((it) => it.parentId).filter(Boolean) as string[]);
  for (const it of items) it.hasChildren = parents.has(it.id);
  return items;
}
