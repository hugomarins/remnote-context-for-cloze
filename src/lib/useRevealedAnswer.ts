// Reliable "has the answer been revealed?" state for FlashcardUnder widgets.
//
// Why this is not trivial: getWidgetContext().revealed and queue.hasRevealedAnswer() are NOT
// reactive here — RemNote does not re-evaluate the widget when the answer is revealed within a
// card (confirmed by logging: a useTrackerPlugin over hasRevealedAnswer() fires once and never
// again). So we drive the flag ourselves: subscribe to the RevealAnswer / QueueLoadCard events
// for instant updates, and poll hasRevealedAnswer() as a guaranteed fallback (the same
// non-reactivity that incremental-everything works around by polling getWidgetContext()).
//
// 为什么这并不简单：此处 getWidgetContext().revealed 与 queue.hasRevealedAnswer() 都不是响应式的——
// 在同一张卡片内揭示答案时，RemNote 不会重新求值挂件（日志已证实：对 hasRevealedAnswer() 用
// useTrackerPlugin 只会触发一次）。因此我们自行驱动该标记：订阅 RevealAnswer / QueueLoadCard 事件以
// 即时更新，并轮询 hasRevealedAnswer() 作为可靠兜底。
import * as React from 'react';
import { AppEvents, useAPIEventListener } from '@remnote/plugin-sdk';

export function useRevealedAnswer(plugin: any, pollMs = 500): boolean {
  const [revealed, setRevealed] = React.useState(false);

  const recheck = React.useCallback(async () => {
    try {
      const r = !!(await plugin.queue.hasRevealedAnswer());
      setRevealed((prev) => (prev === r ? prev : r));
    } catch { /* ignore */ }
  }, [plugin]);

  // Main path — instant updates when the events reach the widget iframe (verified: RevealAnswer fires here).
  // 主路径——事件到达挂件 iframe 时即时更新（已验证：RevealAnswer 会在此触发）。
  useAPIEventListener(AppEvents.RevealAnswer, undefined, () => setRevealed(true));
  useAPIEventListener(AppEvents.QueueLoadCard, undefined, () => setRevealed(false));

  // Fallback — one immediate check on mount (catches a reveal that fired before this widget
  // mounted), then a low-frequency poll in case an event is ever missed.
  // 兜底——挂载时立即检查一次（可捕获在本挂件挂载前已触发的揭示），随后低频轮询以防漏掉事件。
  React.useEffect(() => {
    let cancelled = false;
    const tick = () => { if (!cancelled) void recheck(); };
    tick();
    const id = setInterval(tick, pollMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [recheck, pollMs]);

  return revealed;
}
