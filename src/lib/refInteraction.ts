// Rem-reference interaction inside the context tree.
//
// The tree is a plain HTML string rendered with dangerouslySetInnerHTML inside the plugin's
// widget iframe. A real link in there is fatal: following it loads the whole RemNote app INSIDE
// the iframe — which looks like a crash and takes the queue down with it. So clozeMask emits
// every rem reference as inert markup (`.cfc-ref[data-cfc-rem]`) and all behavior is attached
// here:
//   - click / Enter → hand the target to the widget, which asks for confirmation first, because
//                     openRem() navigates the pane and that ends the review session.
//   - hover         → a host-level floating widget previewing the referenced Rem. The popup has
//                     to be rendered by the host: this iframe is only as tall as its content, so
//                     anything we drew ourselves would be clipped.
// Any other anchor that survives into the HTML is swallowed as a safety net.
import * as React from 'react';
import { REF_ATTR } from './clozeMask';

export interface RefTarget { id: string; name: string }

export const PREVIEW_WIDGET = 'rem_preview';
export const PREVIEW_REM_KEY = 'cfc-preview-rem-id';

// Long enough that skimming a line doesn't fire popups, short enough to feel like a hover.
const OPEN_DELAY_MS = 500;
// The popup is a host element outside this iframe, so moving the pointer toward it registers as
// a mouseleave here. This grace period is what makes the popup reachable at all.
const CLOSE_DELAY_MS = 400;

const refAt = (t: EventTarget | null) => (t as HTMLElement)?.closest?.('.cfc-ref') as HTMLElement | null;
const targetOf = (el: HTMLElement): RefTarget => ({
  id: el.getAttribute(REF_ATTR) || '',
  name: el.textContent || '',
});

export function useRefDelegation(
  rootRef: React.RefObject<HTMLElement>,
  plugin: any,
  dep: unknown,
  onRequestOpen: (target: RefTarget) => void,
) {
  // Kept in refs so the delegated listeners never close over stale state.
  const openRequest = React.useRef(onRequestOpen);
  openRequest.current = onRequestOpen;

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Id of the floating widget currently on screen, and a monotonic token so a late-resolving
    // open() can tell it has already been superseded by a newer hover (or by a close).
    let floatingId: string | null = null;
    let generation = 0;
    let openTimer: any = null;
    let closeTimer: any = null;

    const clearTimers = () => {
      if (openTimer) { clearTimeout(openTimer); openTimer = null; }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    };

    const closePreview = async () => {
      generation++;
      const id = floatingId;
      floatingId = null;
      if (id) {
        try { await plugin.window.closeFloatingWidget(id); } catch { /* already gone */ }
      }
    };

    const openPreview = async (el: HTMLElement, remId: string) => {
      const mine = ++generation;
      try {
        // The floating widget is positioned in HOST coordinates, but getBoundingClientRect() is
        // relative to this iframe — so offset it by where the widget sits in the host window.
        const ctx: any = await plugin.widget.getWidgetContext();
        const host: any = await plugin.widget.getDimensions(ctx?.widgetInstanceId);
        if (mine !== generation) return;
        const r = el.getBoundingClientRect();
        await plugin.storage.setSession(PREVIEW_REM_KEY, remId);
        if (mine !== generation) return;
        const id = await plugin.window.openFloatingWidget(
          PREVIEW_WIDGET,
          { top: Math.round((host?.top || 0) + r.bottom + 6), left: Math.round((host?.left || 0) + r.left) },
          undefined,
          true,
        );
        // A newer hover (or a close) landed while the popup was opening — drop this one.
        if (mine !== generation) { try { await plugin.window.closeFloatingWidget(id); } catch {} return; }
        floatingId = id;
      } catch (e) {
        console.error('[CFC] could not open the reference preview:', e);
      }
    };

    const onOver = (e: MouseEvent) => {
      const el = refAt(e.target);
      if (!el || !root.contains(el)) return;
      const id = el.getAttribute(REF_ATTR);
      if (!id) return;
      clearTimers();
      // Already showing this one: nothing to do but cancel the pending close.
      if (floatingId && el.getAttribute('data-cfc-previewing') === '1') return;
      openTimer = setTimeout(() => {
        root.querySelectorAll('[data-cfc-previewing]').forEach((n) => n.removeAttribute('data-cfc-previewing'));
        el.setAttribute('data-cfc-previewing', '1');
        closePreview().then(() => openPreview(el, id));
      }, OPEN_DELAY_MS);
    };

    const onOut = (e: MouseEvent) => {
      const el = refAt(e.target);
      if (!el || !root.contains(el)) return;
      // Moving within the same reference (across its child nodes) is not a leave.
      if (refAt(e.relatedTarget) === el) return;
      clearTimers();
      closeTimer = setTimeout(() => {
        el.removeAttribute('data-cfc-previewing');
        closePreview();
      }, CLOSE_DELAY_MS);
    };

    const onClick = (e: MouseEvent) => {
      const el = refAt(e.target);
      if (el && root.contains(el)) {
        // Never let the click reach the queue underneath — there it would reveal / rate the card.
        e.preventDefault();
        e.stopPropagation();
        clearTimers();
        closePreview();
        openRequest.current(targetOf(el));
        return;
      }
      // Safety net: no anchor inside the tree may ever navigate this iframe.
      const a = (e.target as HTMLElement)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (a && root.contains(a)) {
        e.preventDefault();
        e.stopPropagation();
        const href = a.getAttribute('href') || '';
        if (/^https?:/i.test(href)) {
          try { window.open(href, '_blank', 'noopener'); } catch { /* blocked; better than navigating */ }
        }
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = refAt(e.target);
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      e.stopPropagation();
      clearTimers();
      closePreview();
      openRequest.current(targetOf(el));
    };

    root.addEventListener('mouseover', onOver);
    root.addEventListener('mouseout', onOut);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    return () => {
      root.removeEventListener('mouseover', onOver);
      root.removeEventListener('mouseout', onOut);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKey);
      clearTimers();
      closePreview();
    };
  }, [dep, plugin]);
}
