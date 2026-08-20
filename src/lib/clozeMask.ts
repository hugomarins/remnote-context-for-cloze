// Shared cloze masking / rendering helpers for the context-tree widgets.

export type MaskMode = 'ellipsis' | 'question' | 'none';

// Placeholder tokens survive plugin.richText.toHTML() and are swapped for HTML afterwards.
const ELLIPSIS_TOKEN = '[[[CFC_EL]]]';
const PIN_TOKEN = '[[[CFC_PIN]]]';

export const ELLIPSIS_HTML = '<span class="cfc-omission" style="display:inline-block;padding:0 10px;border-radius:6px;line-height:1.2;background:var(--rn-clr-warning-muted, rgba(255,212,0,0.15));color:var(--rn-clr-warning, #b58900);border:0">…</span>';
export const QUESTION_HTML = '<span class="cfc-question" style="display:inline-block;padding:0 12px;border-radius:6px;line-height:1.2;background:var(--rn-clr-accent-muted, rgba(56,139,253,0.15));color:var(--rn-clr-accent, #0969da);border:0">?</span>';

// Rem reference "pins" are rich-text elements with i:'q' and pin:true. They must render
// as a single pin icon, NOT the referenced rem's full text — expanding them clutters the
// context tree and can leak the cloze answer.
export const PIN_HTML = '<span class="cfc-pin" style="display:inline-block;opacity:.7;vertical-align:baseline" title="Pinned reference (hidden in context)">📌</span>';
export const isPinRef = (el: any) => el != null && typeof el === 'object' && el.i === 'q' && !!el.pin;

// Click-to-reveal support for masked sibling clozes (used with Hide All Test One):
// each masked "…" carries its own revealed text (base64 in data-cfc-reveal) so it can be
// toggled open/closed independently, letting you self-evaluate hidden clozes one at a time.
const REVEAL_UNDERLINE_OPEN = '<span class="cfc-revealed-cloze" style="text-decoration:underline;text-decoration-color:var(--rn-clr-accent, #0969da);text-decoration-thickness:2px;text-underline-offset:2px">';
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const encodeReveal = (html: string) => { try { return btoa(unescape(encodeURIComponent(html))); } catch { return ''; } };
export const decodeReveal = (b64: string) => { try { return decodeURIComponent(escape(atob(b64))); } catch { return ''; } };
const clickableOmissionHTML = (revealHtml: string) =>
  `<span class="cfc-omission cfc-reveal" role="button" tabindex="0" data-cfc-reveal="${encodeReveal(revealHtml)}" title="Click to reveal / hide" style="display:inline-block;padding:0 10px;border-radius:6px;line-height:1.2;background:var(--rn-clr-warning-muted, rgba(255,212,0,0.15));color:var(--rn-clr-warning, #b58900);border:0;cursor:pointer">…</span>`;

const hasAnyCloze = (obj: any) => !!(obj?.cId || obj?.hiddenCloze || obj?.revealedCloze || obj?.latexClozes?.length || Object.keys(obj || {}).some((k) => /cloze/i.test(k)));

export function richHasCloze(rich: any[]): boolean {
  if (!Array.isArray(rich)) return false;
  for (const el of rich) {
    if (typeof el === 'string') continue;
    if (hasAnyCloze(el)) return true;
  }
  return false;
}

// Replace {{c1::text}} / {{<id>::text}} (optional ::hint) with a span that underlines only the cloze content.
export function revealClozeInHTML(html: string): string {
  try {
    const underline = REVEAL_UNDERLINE_OPEN + '$1</span>';
    return html
      .replace(/\{\{c\d+::(.*?)(?:::[^}]*)?\}\}/g, underline)
      .replace(/\{\{[^:{}]+::(.*?)(?:::[^}]*)?\}\}/g, underline);
  } catch {
    return html;
  }
}

// Add a light-blue highlight to cloze content we revealed (answer stage), without touching other spans.
export function addClozeRevealHighlight(html: string): string {
  try {
    return html.replace(/<span class="cfc-revealed-cloze" style="([^"]*)">/g,
      (_m, s1) => `<span class="cfc-revealed-cloze" style="${s1};background:var(--rn-clr-accent-muted, rgba(56,139,253,0.15));border-radius:3px">`);
  } catch {
    return html;
  }
}

// Render a rem's rich text to HTML with the requested cloze-masking policy.
//  - 'none'     : reveal cloze content (underlined); nothing masked.
//  - 'question' : mask every cloze in the rem as a blue "?" (the tested line).
//  - 'ellipsis' : mask every cloze as a clickable "…" that can be toggled to reveal its own text.
export async function richToHTMLWithClozeMask(plugin: any, rich: any[], mode: MaskMode, tag = '[CFC]'): Promise<string> {
  if (!Array.isArray(rich)) return '';
  // Collapse pin references to a token before rendering (applies in every mode).
  const withPins = rich.map((el: any) => (isPinRef(el) ? { i: 'm', text: PIN_TOKEN } : el));
  if (mode === 'none') {
    try {
      const html = await plugin.richText.toHTML(withPins);
      const finalHtml = revealClozeInHTML(html).replaceAll(PIN_TOKEN, PIN_HTML);
      try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log(`${tag} toHTML noMask`, { rich, html, finalHtml }); } catch {}
      return finalHtml;
    } catch {
      try {
        const s = await plugin.richText.toString(rich);
        const txt = revealClozeInHTML(s || '');
        return txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
      } catch {
        return '';
      }
    }
  }
  const masked: any[] = [];
  const reveals: string[] = []; // ellipsis mode: revealed HTML per masked cloze (for click-to-reveal)
  for (const el of rich) {
    if (typeof el === 'string') { masked.push(el); continue; }
    if (isPinRef(el)) { masked.push({ i: 'm', text: PIN_TOKEN }); continue; }
    const i = (el as any)?.i;
    if ((i === 'm' || i === 'x') && hasAnyCloze(el)) {
      if (mode === 'ellipsis') {
        // Remember this cloze's own text so a click can reveal it in place.
        let revealText = '';
        try { revealText = (await plugin.richText.toString([el])) || ''; } catch {}
        if (!revealText) revealText = (el as any)?.text || '';
        reveals.push(`${REVEAL_UNDERLINE_OPEN}${escapeHtml(revealText)}</span>`);
        masked.push({ i: 'm', text: `[[[CFC_EL_${reveals.length - 1}]]]` });
      } else {
        masked.push({ i: 'm', text: ELLIPSIS_TOKEN });
      }
    } else {
      masked.push(el);
    }
  }
  try {
    const html = await plugin.richText.toHTML(masked);
    let finalHtml = html.replaceAll(PIN_TOKEN, PIN_HTML);
    if (mode === 'question') {
      finalHtml = finalHtml.replaceAll(ELLIPSIS_TOKEN, QUESTION_HTML);
    } else {
      // ellipsis mode: each masked cloze becomes an independently clickable "…"
      for (let n = reveals.length - 1; n >= 0; n--) {
        finalHtml = finalHtml.replaceAll(`[[[CFC_EL_${n}]]]`, clickableOmissionHTML(reveals[n]));
      }
      finalHtml = finalHtml.replaceAll(ELLIPSIS_TOKEN, ELLIPSIS_HTML); // safety for any leftover token
    }
    try { const dbg = await plugin.settings.getSetting('debug'); if (dbg) console.log(`${tag} rich->html`, { rich, masked, html, finalHtml, mode }); } catch {}
    return finalHtml;
  } catch {
    const s = await plugin.richText.toString(masked as any);
    const replacement = mode === 'question' ? QUESTION_HTML : ELLIPSIS_HTML;
    return (s || '').replace(/\[…\]/g, replacement).replace(/\[\[\[CFC_EL_\d+\]\]\]/g, ELLIPSIS_HTML);
  }
}
