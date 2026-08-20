// Collapsible rendering of the collected context tree, shared by the question / answer widgets.
//
// Why collapse at all: the tree used to render fully expanded down to Max Depth, so a deep
// descendant of the tested line could spoil (or heavily hint at) the answer before you recalled
// it. Now every branch starts closed except the path that leads to the card under review — the
// card itself is always visible, its own children are not — and each branch that hides something
// carries an arrow you can click to open it (same affordance as incremental-everything's
// Rem History rows).
//
// 为什么要折叠：此前上下文树会一直展开到 Max Depth，被测行的深层子级可能在回忆前就泄露（或强烈暗示）
// 答案。现在除“通往当前卡片的路径”外，所有分支默认闭合——当前卡片始终可见，而它自己的子级默认隐藏——
// 且每个隐藏了内容的分支都带一个可点击展开的箭头（与 incremental-everything 的 Rem History 行一致）。
import * as React from 'react';
import { TreeItem } from './contextTree';

const INDENT_PX = 24;

// Ancestors of the current card, so the tested line is never hidden behind a closed arrow.
// Falls back to "expand everything" when the tree should not start collapsed.
// 当前卡片的所有祖先——保证被测行不会藏在闭合的箭头后面。若不要求初始折叠，则全部展开。
export function defaultExpandedIds(items: TreeItem[], startCollapsed: boolean): Set<string> {
  if (!startCollapsed) return new Set(items.map((it) => it.id));
  const byId = new Map(items.map((it) => [it.id, it] as const));
  const expanded = new Set<string>();
  for (const it of items) {
    if (!it.isCurrent) continue;
    let cur: TreeItem | undefined = it;
    // Guard against a malformed chain; the depth of a real context tree is tiny.
    // 防御性上限；真实上下文树的深度很小。
    for (let i = 0; cur?.parentId && i < 256; i++) {
      expanded.add(cur.parentId);
      cur = byId.get(cur.parentId);
    }
  }
  return expanded;
}

// A node shows only when every ancestor between it and the root is open.
// 仅当从根到该节点的每个祖先都处于展开状态时，节点才可见。
function visibleItems(items: TreeItem[], expanded: Set<string>): TreeItem[] {
  const byId = new Map(items.map((it) => [it.id, it] as const));
  return items.filter((it) => {
    let parentId = it.parentId;
    for (let i = 0; parentId && i < 256; i++) {
      if (!expanded.has(parentId)) return false;
      parentId = byId.get(parentId)?.parentId;
    }
    return true;
  });
}

// Centred on the first text line of the item (the li is a flex row aligned to its top), so the
// arrow/bullet lines up with the text next to it however long that text wraps.
// 与条目首行文本垂直居中对齐（li 为顶部对齐的 flex 行），无论文本换行多少，箭头/圆点都对齐。
const MARKER_WIDTH = 14;
const MARKER_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: MARKER_WIDTH,
  minHeight: '1.5em',
  marginRight: 4,
  flex: '0 0 auto',
  userSelect: 'none',
  color: 'var(--rn-clr-content-tertiary, rgba(100,116,139,0.75))',
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: `rotate(${open ? 0 : -90}deg)`,
        transitionProperty: 'transform',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        transitionDuration: '150ms',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface MarkerProps { hasChildren: boolean; open: boolean; onToggle: () => void }

function Marker({ hasChildren, open, onToggle }: MarkerProps) {
  if (!hasChildren) {
    return <span className="cfc-bullet" style={{ ...MARKER_STYLE, fontSize: '0.8em' }}>•</span>;
  }
  // Clicks and Enter/Space are swallowed here: inside the queue they would otherwise bubble up
  // and reveal the answer / rate the card.
  // 此处吞掉点击与 Enter/Space：否则事件会冒泡到队列，触发“显示答案”或评分。
  const toggle = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };
  return (
    <span
      className="cfc-toggle"
      role="button"
      tabIndex={0}
      aria-expanded={open}
      aria-label={open ? 'Collapse' : 'Expand'}
      title={open ? 'Collapse' : 'Expand'}
      onClick={toggle}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle(e); }}
      style={{ ...MARKER_STYLE, cursor: 'pointer', lineHeight: 1 }}
    >
      <Chevron open={open} />
    </span>
  );
}

export interface ContextTreeViewProps {
  items: TreeItem[];
  /** Start with every branch closed except the path down to the card under review. */
  startCollapsed: boolean;
}

export function ContextTreeView({ items, startCollapsed }: ContextTreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => defaultExpandedIds(items, startCollapsed));

  // Re-seed whenever the tree changes (new card, or the question→answer flip): expansion is
  // per-card UI state and must not leak from one card to the next.
  // 树变化时（换卡，或题面→答案切换）重新初始化：展开状态属于当前卡片，不应带到下一张。
  React.useEffect(() => {
    setExpanded(defaultExpandedIds(items, startCollapsed));
  }, [items, startCollapsed]);

  const toggle = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const visible = React.useMemo(() => visibleItems(items, expanded), [items, expanded]);

  return (
    <>
      {/* Hover affordance for the arrows. It lives here rather than in the plugin-level CSS
          because that stylesheet is injected into the host document, not into this widget iframe.
          悬停反馈样式放在此处：插件级 CSS 注入的是宿主文档，而非本挂件 iframe。 */}
      <style>{`
        .cfc-toggle { border-radius: 4px; }
        .cfc-toggle:hover { background: var(--rn-clr-background--hovered, rgba(148,163,184,0.22)); color: var(--rn-clr-content-primary, inherit); }
        .cfc-toggle:focus-visible { outline: 2px solid var(--rn-clr-accent, #0969da); outline-offset: 1px; }
      `}</style>
      <ul
        className="cfc-list"
        style={{ listStyle: 'none', margin: 0, padding: 0, paddingBottom: 8, width: '100%', fontSize: '1.08rem' }}
      >
        {visible.map((it) => {
          const depth = Math.max(0, it.depth);
          return (
            <li
              key={it.id}
              className="cfc-item"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                marginLeft: `${depth * INDENT_PX}px`,
                padding: '2px 0',
              }}
            >
              {Array.from({ length: depth }).map((_, i) => (
                <span
                  key={`g-${it.id}-${i}`}
                  style={{
                    position: 'absolute', top: 2, bottom: 2, width: 0,
                    left: `${-((depth - i) * INDENT_PX - MARKER_WIDTH / 2)}px`,
                    borderLeft: '2px solid rgba(148,163,184,0.35)', pointerEvents: 'none',
                  }}
                />
              ))}
              <Marker
                hasChildren={!!it.hasChildren}
                open={expanded.has(it.id)}
                onToggle={() => toggle(it.id)}
              />
              <span
                style={{ fontSize: '1rem', lineHeight: 1.5, minWidth: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: it.html }}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
