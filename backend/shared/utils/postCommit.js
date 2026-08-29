/**
 * Post-commit side-effect registry.
 *
 * Side effects that leave the database (sending email, calling a webhook)
 * must not fire from inside a transaction: the transaction can still abort,
 * and an email cannot be un-sent. This registry lets a service enqueue such
 * work against the active session; `withOptionalTransaction` then flushes it
 * only after the commit succeeds, and drops it when the transaction aborts.
 *
 * When there is no session (standalone Mongo fallback, or a plain write),
 * `onCommit` runs the callback immediately — there is nothing to wait for.
 *
 * Callbacks are fire-and-forget by design: a failing email must never turn a
 * committed database write into a 500. Each callback is responsible for its
 * own error capture; anything that escapes is logged and swallowed here.
 */

// WeakMap so a session that is never committed (process crash, abandoned
// transaction) doesn't pin its callbacks in memory.
const pending = new WeakMap();

const runCallback = async (fn) => {
  try {
    await fn();
  } catch (err) {
    console.error("[postCommit] callback failed:", err?.message || err);
  }
};

/**
 * Register `fn` to run after the current transaction commits.
 * With `session === null`/undefined, runs it now (detached).
 */
const onCommit = (session, fn) => {
  if (!session) {
    // Detached on purpose — the caller's response should not wait on it.
    setImmediate(() => runCallback(fn));
    return;
  }

  const queue = pending.get(session);
  if (queue) queue.push(fn);
  else pending.set(session, [fn]);
};

/** Flush everything registered against `session`. Called after a commit. */
const runCommitted = (session) => {
  if (!session) return;
  const queue = pending.get(session);
  if (!queue || queue.length === 0) return;
  pending.delete(session);

  setImmediate(async () => {
    for (const fn of queue) await runCallback(fn);
  });
};

/** Drop everything registered against `session`. Called after an abort. */
const discard = (session) => {
  if (session) pending.delete(session);
};

module.exports = { onCommit, runCommitted, discard };
