// Shown when "Context: Hide Other Answers for This Rem" is run on a Rem that has no context anchor
// above it. Without an anchor there is no context tree at all, so the tag would sit there doing
// nothing — this popup explains that and offers to place the missing anchor on the parent.
//
// Tagging the parent is not a neutral act: an anchor cascades to EVERY descendant, so all of the
// parent's other cards start showing a context tree too. That consequence is stated in the dialog
// rather than buried, because it is the reason the command asks instead of just doing it.
import { RemViewer, renderWidget, usePlugin, useRunAsync } from '@remnote/plugin-sdk';
import * as React from 'react';
import { addPowerupToRems, OrphanRem } from '../lib/anchorCheck';
import {
  LABEL_CONTEXT_FOR_CLOZE,
  LABEL_HIDE_OTHER_ANSWERS,
  POW_CONTEXT_FOR_CLOZE,
  POW_HIDE_OTHER_ANSWERS,
} from '../lib/powerups';

const LOG = '[CFC][AnchorPrompt]';
const MAX_PARENTS_SHOWN = 4;

interface PromptData {
  orphans: OrphanRem[];
  /** Selected Rems that already had an anchor and were tagged before this popup opened. */
  taggedAlready: number;
}

const BTN_BASE: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: '0.9rem',
  cursor: 'pointer',
  userSelect: 'none',
  border: '1px solid var(--rn-clr-border, #e4e8ef)',
  background: 'transparent',
  color: 'var(--rn-clr-content-primary, inherit)',
};

function Widget() {
  const plugin = usePlugin();
  const [busy, setBusy] = React.useState(false);

  const data = useRunAsync(async () => {
    const ctx = await plugin.widget.getWidgetContext<any>();
    return (ctx?.contextData || null) as PromptData | null;
  }, []);

  const orphans = data?.orphans || [];
  const parentIds = React.useMemo(
    () => Array.from(new Set(orphans.map((o) => o.parentId).filter(Boolean) as string[])),
    [orphans]
  );
  const withSiblings = orphans.filter((o) => o.siblingCount > 0).length;
  const canTagParents = parentIds.length > 0;

  const finish = React.useCallback(
    async (tagParents: boolean) => {
      if (busy) return;
      setBusy(true);
      try {
        if (tagParents && parentIds.length) {
          await addPowerupToRems(plugin, parentIds, POW_CONTEXT_FOR_CLOZE);
        }
        await addPowerupToRems(plugin, orphans.map((o) => o.remId), POW_HIDE_OTHER_ANSWERS);
        await plugin.app.toast(
          tagParents
            ? `Tagged ${parentIds.length} parent Rem(s) as "${LABEL_CONTEXT_FOR_CLOZE}" and ${orphans.length} Rem(s) as "${LABEL_HIDE_OTHER_ANSWERS}"`
            : `Tagged ${orphans.length} Rem(s) as "${LABEL_HIDE_OTHER_ANSWERS}" — inactive until an ancestor carries "${LABEL_CONTEXT_FOR_CLOZE}"`
        );
      } catch (e) {
        console.error(`${LOG} tagging failed:`, e);
        await plugin.app.toast('Could not add the tags — see the console log');
      } finally {
        setBusy(false);
        await plugin.widget.closePopup();
      }
    },
    [plugin, busy, parentIds, orphans]
  );

  if (!data) return null;

  const one = orphans.length === 1;

  return (
    <div
      style={{
        padding: 16,
        fontSize: '0.92rem',
        lineHeight: 1.5,
        color: 'var(--rn-clr-content-primary, inherit)',
        background: 'var(--rn-clr-background-primary, transparent)',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>
        No context anchor above {one ? 'this Rem' : 'these Rems'}
      </div>

      <p style={{ margin: '0 0 10px' }}>
        “{LABEL_HIDE_OTHER_ANSWERS}” only changes how a <b>context tree</b> is displayed, and a context
        tree appears only below a Rem tagged “{LABEL_CONTEXT_FOR_CLOZE}”. {one ? 'This Rem has' : 'These Rems have'} no
        such ancestor, so the tag alone would have no visible effect.
      </p>

      {canTagParents && (
        <>
          <p style={{ margin: '0 0 6px' }}>
            {one ? 'Its parent' : 'Their parents'} can become that anchor:
          </p>
          <div
            style={{
              margin: '0 0 10px', padding: '6px 10px', borderRadius: 6,
              background: 'var(--rn-clr-background-secondary, rgba(148,163,184,0.12))',
            }}
          >
            {parentIds.slice(0, MAX_PARENTS_SHOWN).map((id) => (
              <div key={id} style={{ padding: '2px 0' }}>
                <RemViewer remId={id} width="100%" />
              </div>
            ))}
            {parentIds.length > MAX_PARENTS_SHOWN && (
              <div style={{ padding: '2px 0', color: 'var(--rn-clr-content-secondary, #64748b)' }}>
                …and {parentIds.length - MAX_PARENTS_SHOWN} more
              </div>
            )}
          </div>

          <p style={{ margin: '0 0 10px' }}>
            <b>What this changes:</b> the anchor applies to the whole subtree — every card under{' '}
            {one ? 'that parent' : 'those parents'}, not just the one you selected, will show a context
            tree during review.
          </p>

          <p style={{ margin: '0 0 14px', color: 'var(--rn-clr-content-secondary, #64748b)' }}>
            {withSiblings === orphans.length
              ? one
                ? `Its parent has ${orphans[0].siblingCount} other child/children, which become the surrounding context.`
                : 'Each parent has other children, which become the surrounding context.'
              : one
              ? 'Note: this Rem has no siblings, so the context tree would show only the parent line and this Rem’s own descendants. A higher ancestor may be the better anchor.'
              : 'Note: some of these Rems have no siblings, so their context would be thin. A higher ancestor may be the better anchor for those.'}
          </p>
        </>
      )}

      {!canTagParents && (
        <p style={{ margin: '0 0 14px' }}>
          {one ? 'This Rem is' : 'These Rems are'} at the top level, so there is no parent to use as an
          anchor. Tag a Rem higher in the hierarchy with “{LABEL_CONTEXT_FOR_CLOZE}” yourself, or continue
          and the tag will start working once one exists.
        </p>
      )}

      {data.taggedAlready > 0 && (
        <p style={{ margin: '0 0 14px', color: 'var(--rn-clr-content-secondary, #64748b)' }}>
          {data.taggedAlready} other selected Rem(s) already sit under an anchor and have been tagged.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <button style={BTN_BASE} disabled={busy} onClick={() => plugin.widget.closePopup()}>
          Cancel
        </button>
        <button style={BTN_BASE} disabled={busy} onClick={() => finish(false)}>
          Tag only {one ? 'this Rem' : 'these Rems'}
        </button>
        {canTagParents && (
          <button
            style={{
              ...BTN_BASE,
              border: '1px solid var(--rn-clr-accent, #0969da)',
              background: 'var(--rn-clr-accent, #0969da)',
              color: '#fff',
            }}
            disabled={busy}
            onClick={() => finish(true)}
          >
            Tag {one ? 'the parent' : 'the parents'} too
          </button>
        )}
      </div>
    </div>
  );
}

renderWidget(Widget);
