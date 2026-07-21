// Click-to-reveal interaction for masked sibling clozes.
// Toggling is done via direct DOM mutation (no React state) so it survives re-renders
// of the same card and resets automatically when the card changes.
// 被遮挡兄弟 cloze 的“点击揭示”交互。切换直接操作 DOM（不走 React state），
// 因此在同一张卡片的重渲染中保留，切换卡片时自动重置。
import * as React from 'react';
import { decodeReveal } from './clozeMask';

// Toggle a clicked "…" between its collapsed marker and its revealed text.
// 在“…”与揭示后的原文之间切换。
export function toggleReveal(elm: HTMLElement) {
  if (elm.getAttribute('data-cfc-revealed') === '1') {
    elm.innerHTML = '…';
    elm.setAttribute('data-cfc-revealed', '0');
    elm.classList.remove('cfc-revealed');
  } else {
    const html = decodeReveal(elm.getAttribute('data-cfc-reveal') || '');
    if (html) {
      elm.innerHTML = html;
      elm.setAttribute('data-cfc-revealed', '1');
      elm.classList.add('cfc-revealed');
    }
  }
}

// Attach delegated click/keyboard handlers so any ".cfc-reveal" inside `root` toggles
// on click or Enter/Space. Re-binds whenever `dep` changes (e.g. after the tree re-renders).
// 在容器上做事件委托：容器内任意 ".cfc-reveal" 点击或按 Enter/Space 即切换。
// 当 `dep` 变化（如上下文树重渲染）时重新绑定。
export function useRevealDelegation(rootRef: React.RefObject<HTMLElement>, dep: unknown) {
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pick = (t: EventTarget | null) => (t as HTMLElement)?.closest?.('.cfc-reveal') as HTMLElement | null;
    const onClick = (e: MouseEvent) => {
      const el = pick(e.target);
      if (el && root.contains(el)) { e.preventDefault(); e.stopPropagation(); toggleReveal(el); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = pick(e.target);
      if (el && root.contains(el)) { e.preventDefault(); toggleReveal(el); }
    };
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    return () => { root.removeEventListener('click', onClick); root.removeEventListener('keydown', onKey); };
  }, [dep]);
}
