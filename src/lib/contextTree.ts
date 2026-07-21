// Shared context-tree traversal for the question/answer widgets: find the anchor,
// skip metadata/search-portal rems, and collect the masked tree rooted at the anchor.
// 问题/答案挂件共享的上下文树遍历：查找锚点、跳过元数据/搜索门户 Rem、
// 并收集以锚点为根的（已掩码）上下文树。
import { BuiltInPowerupCodes } from '@remnote/plugin-sdk';
import { richToHTMLWithClozeMask, richHasCloze, addClozeRevealHighlight } from './clozeMask';

export interface Ctx { remId?: string; cardId?: string; revealed?: boolean }
export interface QueueAdaptOpts { hideSet: Set<string>; removeSet: Set<string>; applyHideInQueue: boolean }
export interface TreeItem { id: string; depth: number; html: string; isCurrent?: boolean; hasCloze?: boolean }

const HIDDEN_IN_QUEUE_HTML = '<span style="opacity:.6;color:var(--rn-clr-text-secondary,#57606a);font-style:italic">Hidden in queue</span>';

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
//    pollutes the tree and may leak the cloze answer.
//  - Title-style metadata rems (Size / 大小).
// 跳过不应出现在上下文树中的 Rem：搜索门户（“query:”）Rem，以及标题样式元数据（Size/大小）。
export async function shouldSkipChildAsMeta(plugin: any, rem: any): Promise<boolean> {
  try {
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
