import { renderWidget, usePlugin, useRunAsync, BuiltInPowerupCodes } from '@remnote/plugin-sdk';
import * as React from 'react';


const POW_CODE = 'contextForCloze';


const HIDE_IN_QUEUE = 'hideInQueue';
const REMOVE_FROM_QUEUE = 'removeFromQueue';
const NO_HIERARCHY = 'noHierarchy';
const HIDDEN_IN_QUEUE_HTML = '<span style="opacity:.6;color:var(--rn-clr-text-secondary,#57606a);font-style:italic">Hidden in queue</span>';

type Ctx = { remId?: string; cardId?: string; revealed?: boolean };

const ClozeMask = (s: string) => s.replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, '[…]');

// 基于 RichText 的逐元素掩码（HTML 版）：凡含 cloze 标记(cId)的文本元素，替换为占位符，再使用 SDK 转为 HTML
const ELLIPSIS_TOKEN = '[[[CFC_EL]]]';
const ELLIPSIS_HTML = '<span class="cfc-omission" style="display:inline-block;padding:0 10px;border-radius:6px;line-height:1.2;background:var(--rn-clr-warning-muted, rgba(255,212,0,0.15));color:var(--rn-clr-warning, #b58900);border:0">…</span>';
const QUESTION_HTML = '<span class="cfc-question" style="display:inline-block;padding:0 12px;border-radius:6px;line-height:1.2;background:var(--rn-clr-accent-muted, rgba(56,139,253,0.15));color:var(--rn-clr-accent, #0969da);border:0">?</span>';
// Rem reference "pins" are rich-text elements with i:'q' and pin:true. They must
// render as a single pin icon, NOT the full text of the referenced rem — expanding
// them clutters the context tree and can leak the cloze answer.
// Rem 引用“图钉”(pin) 是 i:'q' 且 pin:true 的富文本元素。应仅渲染为一个图钉图标，
// 而非展开被引用 Rem 的全文——展开会污染上下文树，甚至泄露 cloze 答案。
const PIN_TOKEN = '[[[CFC_PIN]]]';
const PIN_HTML = '<span class="cfc-pin" style="display:inline-block;opacity:.7;vertical-align:baseline" title="Pinned reference (hidden in context)">📌</span>';
const isPinRef = (el: any) => el != null && typeof el === 'object' && el.i === 'q' && !!el.pin;
function richHasCloze(rich: any[]): boolean {
  if (!Array.isArray(rich)) return false;
  const hasAnyCloze = (obj: any) => !!(obj?.cId || obj?.hiddenCloze || obj?.revealedCloze || obj?.latexClozes?.length || Object.keys(obj||{}).some(k => /cloze/i.test(k)));
  for (const el of rich) {
    if (typeof el === 'string') continue;
    if (hasAnyCloze(el)) return true;
  }
  return false;
}
function revealClozeInHTML(html: string): string {
  // 将 {{c1::文本}} 或 {{<id>::文本}}（可带 ::hint）替换为“仅对 cloze 内容加下划线”的 HTML 片段
  try {
    const underline = '<span class="cfc-revealed-cloze" style="text-decoration:underline;text-decoration-color:var(--rn-clr-accent, #0969da);text-decoration-thickness:2px;text-underline-offset:2px">$1</span>';
    return html
      .replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, underline)
      .replace(/\{\{[^:{}]+::(.*?)(?:::[^}]*)?\}\}/g, underline);
  } catch { return html; }
}
// mode: 'ellipsis'（黄省略号） | 'question'（蓝问号） | 'none'（不掩码，显示原文并解包 cloze）
async function richToHTMLWithClozeMask(plugin: any, rich: any[], mode: 'ellipsis' | 'question' | 'none'): Promise<string> {
  if (!Array.isArray(rich)) return '';
  // Collapse pin references to a token before rendering (applies in every mode).
  // 渲染前先把图钉引用替换为占位符（所有 mode 均适用）。
  const withPins = rich.map((el: any) => (isPinRef(el) ? { i: 'm', text: PIN_TOKEN } : el));
  if (mode === 'none') {
    try {
      const html = await plugin.richText.toHTML(withPins);
      const finalHtml = revealClozeInHTML(html).replaceAll(PIN_TOKEN, PIN_HTML);
      try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log('[CFC][Q] toHTML noMask', { rich, html, finalHtml }); } catch {}
      return finalHtml;
    } catch {
      try {
        const s = await plugin.richText.toString(rich);
        const txt = revealClozeInHTML(s || '');
        const safe = txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br/>');
        return safe;
      } catch { return ''; }
    }
  }
  const masked: any[] = [];
  for (const el of rich) {
    if (typeof el === 'string') { masked.push(el); continue; }
    if (isPinRef(el)) { masked.push({ i: 'm', text: PIN_TOKEN }); continue; }
    const i = (el as any)?.i;
    const hasAnyCloze = (obj: any) => !!(obj?.cId || obj?.hiddenCloze || obj?.revealedCloze || obj?.latexClozes?.length || Object.keys(obj||{}).some(k => /cloze/i.test(k)));
    if (i === 'm') {
      const hasCloze = hasAnyCloze(el);
      if (hasCloze) masked.push({ i: 'm', text: ELLIPSIS_TOKEN }); else masked.push(el);
    } else if (i === 'x') { // LaTeX
      const hasCloze = hasAnyCloze(el);
      if (hasCloze) masked.push({ i: 'm', text: ELLIPSIS_TOKEN }); else masked.push(el);
    } else {
      masked.push(el);
    }
  }
  try {
    const html = await plugin.richText.toHTML(masked);
    const replacement = mode === 'question' ? QUESTION_HTML : ELLIPSIS_HTML;
    const finalHtml = html.replaceAll(ELLIPSIS_TOKEN, replacement).replaceAll(PIN_TOKEN, PIN_HTML);
    try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log('[CFC][Q] rich->html', { rich, masked, html, finalHtml, mode }); } catch {}
    return finalHtml;
  } catch {
    const s = await plugin.richText.toString(masked as any);
    const replacement = mode === 'question' ? QUESTION_HTML : ELLIPSIS_HTML;
    return (s || '').replace(/\[\u2026\]|\[…\]/g, replacement);
  }
}

async function getNearestAnchor(plugin: any, remId: string) {
  const power = await plugin.powerup.getPowerupByCode(POW_CODE);
  if (!power) return null;

  const anchors = await power.taggedRem();
  const set = new Set((anchors||[]).map((r: any) => r._id));
  let cur = await plugin.rem.findOne(remId);

  while (cur?.parent) {
    const p = await plugin.rem.findOne(cur.parent);
    if (!p) break;
    if (set.has(p._id)) return p;
    cur = p;
  }

  return null;
}
async function shouldSkipChildAsMeta(plugin: any, rem: any): Promise<boolean> {
  // Skip Search Portal ("query:") rems: their body is a transclusion of query
  // results, which pollutes the context tree and may leak the cloze answer.
  // 跳过 Search Portal（“query:”）Rem：其内容是查询结果的转写，会污染上下文树并可能泄露答案。
  try {
    if (rem && typeof rem.hasPowerup === 'function' && await rem.hasPowerup(BuiltInPowerupCodes.SearchPortal)) return true;
  } catch {}
  try {
    const s = (await plugin.richText.toString(rem?.text || []) || '').trim();
    const lower = s.toLowerCase();
    if (lower === 'size' || s === '大小') return true; // 标题样式元数据（Size/大小）
  } catch {}
  return false;
}
interface QueueAdaptOpts { hideSet: Set<string>; removeSet: Set<string>; applyHideInQueue: boolean; }

async function collectFullTree(plugin: any, root: any, currentRemId: string, maxDepth: number, maxNodes: number, shouldMask: boolean, opts?: QueueAdaptOpts) {
  const items: { id: string; depth: number; html: string; isCurrent?: boolean; hasCloze?: boolean }[] = [];
  let count = 0;
  async function dfs(rem: any, depth: number) {
    if (depth > maxDepth || count >= maxNodes) return;
    // 输出当前节点（包含 root 自身），应用占位/掩码
    const id = rem._id;
    let html = ''; let isCurrent = false; let hasCloze = false;
    let _removed = false;
    if (id === currentRemId) {
      isCurrent = true;
      const rich = rem.text || [];
      hasCloze = richHasCloze(rich);
      html = await richToHTMLWithClozeMask(plugin, rich, 'question');
    } else {
      // 使用 RichText 级别的 cloze mask 
      const rich = rem.text || [];
      hasCloze = richHasCloze(rich);
      // 根据官方 Remove/Hide 标记覆盖渲染
      _removed = !!opts?.removeSet?.has(id);
      if (!_removed) {
        if (opts?.applyHideInQueue && opts?.hideSet?.has(id)) {
          html = HIDDEN_IN_QUEUE_HTML;
        } else {
          html = await richToHTMLWithClozeMask(plugin, rich, shouldMask ? 'ellipsis' : 'none');
        }
      }

      // html computed above (Hide/Remove adaptation)
      // 兜底：若未检测到 cId 

    }
    if (!_removed) items.push({ id, depth, html, isCurrent, hasCloze });
    count++;
    if (count >= maxNodes) return;
    // 递归子节点
    const children = (await rem.getChildrenRem()) || [];
    for (const ch of children) {
      if (count >= maxNodes) break;
      if (await shouldSkipChildAsMeta(plugin, ch)) {
        try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log('[CFC][Q] skip meta child', ch?._id); } catch {}
        continue;
      }
      await dfs(ch, _removed ? depth : depth + 1);
    }
  }
  await dfs(root, 0);
  return items;
}


// 旧的路径排除逻辑已移除

async function getCurrentCardRemId(plugin: any, ctx: Ctx | undefined) {
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
      console.error('[CFC][Q] getCurrentCardRemId 异常:', e);
    }
  }
  return ctx?.remId;
}

function Widget() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const plugin = usePlugin();
  const [errorCount, setErrorCount] = React.useState(0);
  const MAX_ERRORS = 10; // 最大连续错误次数

  // 移除轮询机制 - RemNote SDK 会在需要时自动触发重新渲染
  const ctx = useRunAsync(async () => {
    try {
      const context = await plugin.widget.getWidgetContext();
      return context;
    } catch (e) {
      console.error('[CFC][Q] getWidgetContext 失败:', e);
      setErrorCount(prev => prev + 1);
      return null;
    }
  }, []) as any;

  const debug = useRunAsync(async () => !!(await plugin.settings.getSetting('debug')), []);

  // 获取 overrideNativeContent 设置并通过 postMessage 通知 index.tsx 更新 CSS
  const overrideNative = useRunAsync(async () => {
    try {
      const override = await plugin.settings.getSetting('overrideNativeContent');

      // 通过 postMessage 通知 index.tsx 更新 CSS
      // 发送到多个目标以确保消息被接收
      const message = {
        type: 'CFC_UPDATE_OVERRIDE_CSS',
        enabled: !!override
      };

      // 发送到当前窗口
      window.postMessage(message, '*');

      // 发送到父窗口
      if (window.parent !== window) {
        window.parent.postMessage(message, '*');
      }

      // 发送到顶层窗口
      if (window.top && window.top !== window) {
        window.top.postMessage(message, '*');
      }

      console.log(`[CFC][Q] Sent postMessage to window/parent/top: enabled=${!!override}`);

      return !!override;
    } catch (e) {
      console.error('[CFC][Q] Failed to get/apply overrideNativeContent:', e);
      return false;
    }
  }, [ctx?.remId]); // 依赖 ctx.remId,每次切换卡片时重新检查

  // 统一 hooks 顺序：不在此处提前 return；在后面再做 gating
  const { items, shouldMask, enabled } = useRunAsync(async () => {
    try {
      // 获取 debug 设置
      const isDebug = await plugin.settings.getSetting('debug');
      if (isDebug) console.log('[CFC][Q] useRunAsync 开始执行');

      if (!ctx?.remId) {
        if (isDebug) console.warn('[CFC][Q] ctx.remId 为空');
        setErrorCount(prev => prev + 1);
        return { items: [] as { id: string; depth: number; html: string; isCurrent?: boolean }[], enabled: false };
      }

      if (ctx?.revealed) {
        if (isDebug) console.log('[CFC][Q] revealed=true (答案阶段)');
        return { items: [], enabled: false };
      }

      const maskId = await getCurrentCardRemId(plugin, ctx);
      const anchor = await getNearestAnchor(plugin, maskId || ctx.remId);

      if (!anchor) {
        if (isDebug) console.warn('[CFC][Q] 未找到 anchor');
        setErrorCount(prev => prev + 1);
        return { items: [], enabled: false };
      }

      if (isDebug) console.log('[CFC][Q] 找到 anchor:', anchor._id);
      // 重置错误计数（成功找到 anchor）
      setErrorCount(0);
      // 从设置接入 Max Depth / Max Nodes（提供健壮的数值兜底）
      const rawDepth = await plugin.settings.getSetting('maxDepth');
      const rawNodes = await plugin.settings.getSetting('maxNodes');
      let _md = Number(rawDepth); if (!Number.isFinite(_md) || _md < 0) _md = 999;
      let _mn = Number(rawNodes); if (!Number.isFinite(_mn) || _mn < 0) _mn = 10000;
      const maxDepth = _md;
      const maxNodes = _mn;
      // 若当前卡片相对 anchor 的深度超过 maxDepth，则直接不显示上下文（保持插件启用态，便于 debug 显示占位）
      const depthToCurrent = await (async () => {
        try {
          let d = 0;
          let cur = await plugin.rem.findOne(maskId || ctx.remId);
          while (cur && cur._id !== anchor._id && cur.parent) {
            cur = await plugin.rem.findOne(cur.parent);
            d++;
            if (d > 2048) break; // 安全上限
          }
          return cur && cur._id === anchor._id ? d : Number.POSITIVE_INFINITY;
        } catch { return Number.POSITIVE_INFINITY; }
      })();
      if (depthToCurrent > maxDepth) {
        try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log('[CFC][Q] over maxDepth', { depthToCurrent, maxDepth }); } catch {}
        return { items: [], enabled: false } as any;
      }

      // 读取三种官方 Power-up 的标记集合（用于上下文区域的适配）
      const [hideSet, removeSet, noHSet] = await Promise.all([
        (async () => { const p = await plugin.powerup.getPowerupByCode(HIDE_IN_QUEUE); const t = p ? await p.taggedRem() : []; return new Set((t||[]).map((r:any)=>r._id)); })(),
        (async () => { const p = await plugin.powerup.getPowerupByCode(REMOVE_FROM_QUEUE); const t = p ? await p.taggedRem() : []; return new Set((t||[]).map((r:any)=>r._id)); })(),
        (async () => { const p = await plugin.powerup.getPowerupByCode(NO_HIERARCHY); const t = p ? await p.taggedRem() : []; return new Set((t||[]).map((r:any)=>r._id)); })(),
      ]);

	      // 如果当前题目被标记 noHierarchy：仅显示“当前题目这一行”（不显示祖先/兄弟/子孙），对齐原生
	      if (noHSet.has(maskId || ctx.remId)) {
	        try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log('[CFC][Q] noHierarchy on current -> show only current line'); } catch {}
	        const cur = await plugin.rem.findOne(maskId || ctx.remId);
	        const rich = cur?.text || [];
	        const hasCloze = richHasCloze(rich);
	        const html = await richToHTMLWithClozeMask(plugin, rich, 'question');
	        const items = [{ id: cur?._id || (maskId || ctx.remId), depth: 0, html, isCurrent: true, hasCloze }];
	        return { items, shouldMask: false, enabled: true } as any;
	      }



      const noHide = await (async () => {
        try {
          const power = await plugin.powerup.getPowerupByCode('contextHideAllTestOne');
          const tagged = power ? await power.taggedRem() : [];
          const set = new Set((tagged||[]).map((r:any)=>r._id));
          return set.has(maskId || ctx.remId);
        } catch { return false; }
      })();
      const shouldMask = noHide;
      let items = await collectFullTree(plugin, anchor, maskId || ctx.remId, maxDepth, maxNodes, shouldMask, { hideSet, removeSet, applyHideInQueue: true });
      // No Hierarchy：如果当前题目被标记，则移除所有祖先行
      if (isDebug) {
        console.log('[CFC][Q] 成功生成', items.length, '个 items');
        console.log('[CFC][Q] items 详情:', items.map(x => ({ id: x.id, depth: x.depth, isCurrent: x.isCurrent })));
      }

      return { items, shouldMask, enabled: true };
    } catch (e) {
      console.error('[CFC][Q] useRunAsync 异常:', e);
      setErrorCount(prev => prev + 1);
      return { items: [], enabled: false };
    }
  }, [ctx?.remId, ctx?.revealed]) || { items: [], shouldMask: true, enabled: false } as any;

  React.useEffect(() => {
    if (rootRef.current && debug) {
      const w = rootRef.current.clientWidth;
      console.log('[CFC][Q] width] root', w, 'iframe', window.innerWidth);
    }
  }, [items.length, debug]);
  const renderItem = (it: { id: string; depth: number; html: string; isCurrent?: boolean; hasCloze?: boolean }) => {
    if (it.isCurrent) {
      return (
        <span style={{ fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: it.html }} />
      );
    }
    if (shouldMask === false && it.hasCloze) {
      return (
        <span style={{ fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: it.html }} />
      );
    }
    return <span style={{ fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: it.html }} />;
  };

  // gating (after all hooks):
  if (errorCount >= MAX_ERRORS) {
    console.error('[CFC][Q] 达到最大错误次数，停止渲染');
    return (
      <div className="cfc-container" style={{ padding: '10px', color: 'red', border: '1px solid red' }}>
        <div>插件遇到错误，已停止运行。请检查控制台日志。</div>
      </div>
    );
  }

  if (ctx?.revealed) {
    return null;
  }

  if (!enabled) {
    return null; // 未标记我们 Power-Up（上溯链无 anchor）=> 完全透明，不渲染任何内容
  }

  if (!items.length) {
    return debug ? (
      <div className="cfc-container"><div className="cfc-empty">No extra context</div></div>
    ) : null;
  }

  // 渲染阶段日志（同步，使用 debug state）
  if (debug) {
    console.log('[CFC][Q] 准备渲染', items.length, '个 items');
  }
  return (
    <div ref={rootRef} className="cfc-container" style={{ width: '100%', display: 'block', boxSizing: 'border-box', minWidth: 0, maxWidth: '100%', borderTop: '1px solid var(--rn-clr-border, #e4e8ef)', paddingTop: 6, overflowX: 'hidden', overflowY: 'visible' }}>
      <ul className="cfc-list" style={{ listStyle: 'disc', listStylePosition: 'outside', margin: 0, paddingLeft: 20, paddingBottom: 8, width: '100%', fontSize: '1.08rem' }}>
        {items.map((it: { id: string; depth: number; html: string; isCurrent?: boolean; hasCloze?: boolean }) => (
          <li key={it.id} className="cfc-item" style={{ position:'relative', marginLeft: `${Math.max(0, it.depth)*24}px`, padding: '2px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {Array.from({ length: Math.max(0, it.depth) }).map((_, i) => (
              <span key={`g-${it.id}-${i}`}
                    style={{ position:'absolute', top:2, bottom:2, width:0,
                             left: `${-((Math.max(0, it.depth) - i) * 24 - 12)}px`,
                             borderLeft: '2px solid rgba(148,163,184,0.35)', pointerEvents:'none' }} />
            ))}
            {renderItem(it)}
          </li>
        ))}
      </ul>
    </div>
  );
}

renderWidget(Widget);
