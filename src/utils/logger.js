// ─────────────────────────────────────────────────────────────────────────────
// LayaForesight Performance Logger
// Access live data anytime: window.__LAYA_PERF__
// ─────────────────────────────────────────────────────────────────────────────

const store = {
  renders:      {},   // name → { count, lastAt, timestamps[] }
  apiCalls:     [],   // { path, method, ms, status, ok, ts, error? }
  sseEvents:    [],   // { scenarioId, type, byteSize, ts }
  stateUpdates: [],   // { component, key, ts }
  errors:       [],   // { msg, ts }
  sessionStart: Date.now(),
};

if (typeof window !== 'undefined') {
  window.__LAYA_PERF__ = store;
  console.info(
    '%c[LAYA PERF] Logger active — run window.__LAYA_PERF__ in console for raw data',
    'color:#7c3aed;font-weight:bold;font-size:12px',
  );
}

// ── Render tracking ───────────────────────────────────────────────────────────

export function logRender(name) {
  if (!store.renders[name]) {
    store.renders[name] = { count: 0, lastAt: 0, timestamps: [] };
  }
  const r = store.renders[name];
  r.count++;
  r.lastAt = Date.now();
  r.timestamps.push(r.lastAt);
  // Keep last 60 timestamps (enough for 60s history at 1/s)
  if (r.timestamps.length > 60) r.timestamps.splice(0, 1);
  console.debug(
    `%c[RENDER] ${name} ×${r.count}`,
    'color:#7c3aed;font-size:10px',
  );
}

// Call this inside any component function body — runs on every render.
export function useRenderLog(name) {
  logRender(name);
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

export async function loggedFetch(url, options = {}) {
  const t0 = performance.now();
  const method = (options.method || 'GET').toUpperCase();
  const path = url.replace(/^https?:\/\/[^/]+/, '') || url;

  try {
    const res = await fetch(url, options);
    const ms = Math.round(performance.now() - t0);
    store.apiCalls.push({ path, method, ms, status: res.status, ok: res.ok, ts: Date.now() });
    if (store.apiCalls.length > 400) store.apiCalls.splice(0, 1);

    const col = ms > 2000 ? '#dc2626' : ms > 600 ? '#d97706' : '#0369a1';
    console.debug(
      `%c[API] ${method} ${path} → ${res.status} (${ms}ms)`,
      `color:${col};font-size:10px`,
    );
    return res;
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    store.apiCalls.push({ path, method, ms, status: 0, ok: false, ts: Date.now(), error: err.message });
    store.errors.push({ msg: `fetch ${path}: ${err.message}`, ts: Date.now() });
    console.error(
      `%c[API ERR] ${method} ${path} failed after ${ms}ms — ${err.message}`,
      'color:#dc2626;font-size:10px',
    );
    throw err;
  }
}

// ── SSE event tracking ────────────────────────────────────────────────────────

export function logSSEEvent(scenarioId, type, byteSize = 0) {
  store.sseEvents.push({ scenarioId, type, byteSize, ts: Date.now() });
  if (store.sseEvents.length > 2000) store.sseEvents.splice(0, 1);
  console.debug(
    `%c[SSE] ${type} ← ${scenarioId} (${byteSize}b)`,
    'color:#15803d;font-size:10px',
  );
}

// ── State update tracking ─────────────────────────────────────────────────────

export function logState(component, key) {
  store.stateUpdates.push({ component, key, ts: Date.now() });
  if (store.stateUpdates.length > 1000) store.stateUpdates.splice(0, 1);
  console.debug(
    `%c[STATE] ${component} → ${key}`,
    'color:#b45309;font-size:10px',
  );
}

// ── Stats snapshot (used by PerfPanel) ───────────────────────────────────────

export function getSnapshot() {
  const now = Date.now();
  const W5  = 5_000;   // 5-second window
  const W60 = 60_000;  // 60-second window

  // Renders
  const renders = Object.entries(store.renders)
    .map(([name, r]) => ({
      name,
      total:  r.count,
      per5s:  r.timestamps.filter(t => t > now - W5).length,
      per60s: r.timestamps.filter(t => t > now - W60).length,
      lastAt: r.lastAt,
    }))
    .sort((a, b) => b.per5s - a.per5s || b.total - a.total);

  // API
  const recentAPI = store.apiCalls.filter(c => c.ts > now - W5);
  const avgMs = store.apiCalls.length
    ? Math.round(store.apiCalls.reduce((s, c) => s + c.ms, 0) / store.apiCalls.length)
    : 0;
  const slowCalls = [...store.apiCalls].sort((a, b) => b.ms - a.ms).slice(0, 10);
  const apiByPath = store.apiCalls.reduce((acc, c) => {
    acc[c.path] = acc[c.path] || { count: 0, totalMs: 0 };
    acc[c.path].count++;
    acc[c.path].totalMs += c.ms;
    return acc;
  }, {});

  // SSE
  const sseByType = store.sseEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  const sseByScenario = store.sseEvents.reduce((acc, e) => {
    acc[e.scenarioId] = (acc[e.scenarioId] || 0) + 1;
    return acc;
  }, {});

  // State
  const stateByKey = store.stateUpdates.reduce((acc, u) => {
    const k = `${u.component}.${u.key}`;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return {
    sessionAgeMs: now - store.sessionStart,
    renders,
    api: {
      total:   store.apiCalls.length,
      per5s:   recentAPI.length,
      avgMs,
      slowCalls,
      byPath:  Object.entries(apiByPath)
        .map(([path, d]) => ({ path, count: d.count, avgMs: Math.round(d.totalMs / d.count) }))
        .sort((a, b) => b.count - a.count),
    },
    sse: {
      total:      store.sseEvents.length,
      per5s:      store.sseEvents.filter(e => e.ts > now - W5).length,
      byType:     sseByType,
      byScenario: sseByScenario,
    },
    state: {
      total: store.stateUpdates.length,
      per5s: store.stateUpdates.filter(u => u.ts > now - W5).length,
      byKey: stateByKey,
    },
    errors: store.errors.slice(-15),
  };
}

export default store;
