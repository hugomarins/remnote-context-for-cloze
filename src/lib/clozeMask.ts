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

// Click-to-reveal support for masked sibling clozes (used with Hide Other Answers):
// each masked "…" carries its own revealed text (base64 in data-cfc-reveal) so it can be
// toggled open/closed independently, letting you self-evaluate hidden clozes one at a time.
const REVEAL_UNDERLINE_OPEN = '<span class="cfc-revealed-cloze" style="text-decoration:underline;text-decoration-color:var(--rn-clr-accent, #0969da);text-decoration-thickness:2px;text-underline-offset:2px">';
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const encodeReveal = (html: string) => { try { return btoa(unescape(encodeURIComponent(html))); } catch { return ''; } };
export const decodeReveal = (b64: string) => { try { return decodeURIComponent(escape(atob(b64))); } catch { return ''; } };
const clickableOmissionHTML = (revealHtml: string) =>
  `<span class="cfc-omission cfc-reveal" role="button" tabindex="0" data-cfc-reveal="${encodeReveal(revealHtml)}" title="Click to reveal / hide" style="display:inline-block;padding:0 10px;border-radius:6px;line-height:1.2;background:var(--rn-clr-warning-muted, rgba(255,212,0,0.15));color:var(--rn-clr-warning, #b58900);border:0;cursor:pointer">…</span>`;

// Cloze HINTS are rich-text elements carrying a `cloze-hint` (or card-hint-*) key and NO cId.
// They are meant to be visible on the question side — RemNote itself shows them next to the "?" —
// so they must never be treated as cloze content. The `/cloze/i` catch-all below used to match
// `cloze-hint` and blank the hint out, so hint keys are excluded explicitly.
const HINT_KEYS = ['cloze-hint', 'card-hint-front', 'card-hint-back', 'multiline-card-item-hint'];
export const isHintEl = (el: any) =>
  el != null && typeof el === 'object' && el.i === 'm' && !el.cId && HINT_KEYS.some((k) => !!el[k]);

// A hint is shown, but styled so it reads as a prompt rather than as part of the sentence.
const HINT_TOKEN_PREFIX = '[[[CFC_HINT_';
const hintHTML = (text: string) =>
  `<span class="cfc-hint" style="opacity:.75;font-style:italic;color:var(--rn-clr-text-secondary, #57606a)">(${escapeHtml(text.trim())})</span>`;

// Swap pin refs and hint elements for plain-text tokens before handing the rich text to
// toHTML(), then put the real markup back. Tokens are used because toHTML() would otherwise
// expand a pin into the referenced rem's text and render a hint indistinguishably from body text.
function substituteTokens(rich: any[]): { out: any[]; hints: string[] } {
  const hints: string[] = [];
  const out = rich.map((el: any) => {
    if (isPinRef(el)) return { i: 'm', text: PIN_TOKEN };
    if (isHintEl(el)) {
      hints.push(el.text || '');
      return { i: 'm', text: `${HINT_TOKEN_PREFIX}${hints.length - 1}]]]` };
    }
    return el;
  });
  return { out, hints };
}

function restoreTokens(html: string, hints: string[]): string {
  let out = html.replaceAll(PIN_TOKEN, PIN_HTML);
  for (let n = hints.length - 1; n >= 0; n--) out = out.replaceAll(`${HINT_TOKEN_PREFIX}${n}]]]`, hintHTML(hints[n]));
  return out;
}

const hasAnyCloze = (obj: any) => !!(obj?.cId || obj?.hiddenCloze || obj?.revealedCloze || obj?.latexClozes?.length || obj?.blocks?.some?.((b: any) => b?.cId) || Object.keys(obj || {}).some((k) => /cloze/i.test(k) && !/hint/i.test(k)));

// Element types whose cloze content we can safely replace with a single placeholder.
//  - 'm' text, 'x' latex: mask the text itself.
//  - 'q' rem reference: a cloze can be applied to a reference, and rendering it would print the
//    referenced rem's full name — i.e. the answer. This is the leak this set exists to close.
// Images ('i') are deliberately absent: their occlusion is rendered by RemNote itself.
const MASKABLE_TYPES = new Set(['m', 'x', 'q']);

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
  if (mode === 'none') {
    const { out: withTokens, hints } = substituteTokens(rich);
    try {
      const html = await plugin.richText.toHTML(withTokens);
      const finalHtml = restoreTokens(revealClozeInHTML(html), hints);
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
  const hints: string[] = [];
  const reveals: string[] = []; // ellipsis mode: revealed HTML per masked cloze (for click-to-reveal)
  for (let idx = 0; idx < rich.length; idx++) {
    const el: any = rich[idx];
    if (typeof el === 'string') { masked.push(el); continue; }
    if (isPinRef(el)) { masked.push({ i: 'm', text: PIN_TOKEN }); continue; }
    if (isHintEl(el)) {
      hints.push(el.text || '');
      masked.push({ i: 'm', text: `${HINT_TOKEN_PREFIX}${hints.length - 1}]]]` });
      continue;
    }
    if (!(MASKABLE_TYPES.has(el?.i) && hasAnyCloze(el))) { masked.push(el); continue; }
    // One cloze can span several adjacent elements sharing a cId (e.g. a rem reference plus the
    // trailing space it was created with). Consume the whole run so it yields ONE placeholder
    // instead of one per element.
    const group: any[] = [el];
    const cId = el.cId;
    while (cId && idx + 1 < rich.length) {
      const next: any = rich[idx + 1];
      if (!next || typeof next === 'string' || next.cId !== cId || !MASKABLE_TYPES.has(next.i) || isPinRef(next)) break;
      group.push(next);
      idx++;
    }
    if (mode === 'ellipsis') {
      // Remember this cloze's own text so a click can reveal it in place. toString() resolves a
      // rem reference to its name, which is exactly what the reveal should show.
      let revealText = '';
      try { revealText = (await plugin.richText.toString(group)) || ''; } catch {}
      if (!revealText) revealText = group.map((g: any) => g?.text || '').join('');
      reveals.push(`${REVEAL_UNDERLINE_OPEN}${escapeHtml(revealText.trim())}</span>`);
      masked.push({ i: 'm', text: `[[[CFC_EL_${reveals.length - 1}]]]` });
    } else {
      masked.push({ i: 'm', text: ELLIPSIS_TOKEN });
    }
  }
  try {
    const html = await plugin.richText.toHTML(masked);
    let finalHtml = restoreTokens(html, hints);
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
    return restoreTokens(
      (s || '').replace(/\[…\]/g, replacement).replace(/\[\[\[CFC_EL_\d+\]\]\]/g, ELLIPSIS_HTML),
      hints,
    );
  }
}
