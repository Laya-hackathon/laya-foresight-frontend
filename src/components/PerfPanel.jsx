import { useState, useEffect } from 'react';
import { getSnapshot } from '../utils/logger';

// ─────────────────────────────────────────────────────────────────────────────
// LayaForesight Performance Panel
// Toggle: Ctrl+Shift+L   or   click the ⚡ PERF button (bottom-right)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  bg:      '#1e1e2e',
  surface: '#181825',
  border:  '#313244',
  text:    '#cdd6f4',
  sub:     '#6c7086',
  green:   '#a6e3a1',
  yellow:  '#f9e2af',
  red:     '#f38ba8',
  orange:  '#fab387',
  purple:  '#cba6f7',
  blue:    '#89b4fa',
  teal:    '#94e2d5',
};

function fmtAge(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function Row({ label, value, warn, good }) {
  const col = warn ? C.red : good ? C.green : C.text;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${C.surface}` }}>
      <span style={{ color: C.sub }}>{label}</span>
      <span style={{ color: col, fontWeight: warn ? 'bold' : 'normal' }}>{value}</span>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div style={{ color: C.sub, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 4px', paddingBottom: 2, borderBottom: `1px solid ${C.border}` }}>
      {children}
    </div>
  );
}

function renderColor(per5s) {
  if (per5s >= 15) return C.red;
  if (per5s >= 6)  return C.orange;
  if (per5s >= 1)  return C.yellow;
  return C.sub;
}

function apiColor(ms) {
  if (ms >= 2000) return C.red;
  if (ms >= 600)  return C.orange;
  return C.green;
}

export default function PerfPanel() {
  const [open, setOpen]       = useState(false);
  const [snap, setSnap]       = useState(null);
  const [section, setSection] = useState('renders');

  // Keyboard shortcut: Ctrl+Shift+L
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Refresh snapshot every second while open
  useEffect(() => {
    if (!open) return;
    const tick = () => setSnap(getSnapshot());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  const triggerStyle = {
    position: 'fixed', bottom: 14, right: 14, zIndex: 10000,
    background: C.surface, color: C.green,
    border: `1px solid ${C.border}`, borderRadius: 6,
    padding: '4px 10px', fontFamily: 'monospace', fontSize: 10,
    cursor: 'pointer', opacity: 0.8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
  };

  if (!open) {
    return (
      <button style={triggerStyle} onClick={() => setOpen(true)} title="Performance Monitor (Ctrl+Shift+L)">
        ⚡ PERF
      </button>
    );
  }

  const SECTIONS = ['renders', 'api', 'sse', 'state'];

  return (
    <div style={{
      position: 'fixed', bottom: 14, right: 14, zIndex: 10000,
      width: 440, maxHeight: '72vh',
      background: C.bg, color: C.text,
      border: `1px solid ${C.border}`, borderRadius: 10,
      fontFamily: 'monospace', fontSize: 11,
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '7px 12px', background: C.surface,
        borderBottom: `1px solid ${C.border}`, borderRadius: '10px 10px 0 0',
        flexShrink: 0,
      }}>
        <span style={{ color: C.green, fontWeight: 'bold', flex: 1 }}>⚡ Laya Perf Monitor</span>
        {snap && (
          <span style={{ color: C.sub, fontSize: 9 }}>
            session {fmtAge(snap.sessionAgeMs)}
          </span>
        )}
        <span style={{ color: C.sub, fontSize: 9 }}>Ctrl+Shift+L</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: C.sub, cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
      </div>

      {/* ── Section tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => setSection(s)} style={{
            flex: 1, padding: '5px 0',
            background: section === s ? C.border : 'transparent',
            border: 'none', color: section === s ? C.purple : C.sub,
            cursor: 'pointer', fontFamily: 'monospace', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: 1,
            borderBottom: section === s ? `2px solid ${C.purple}` : '2px solid transparent',
          }}>
            {s}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '6px 12px 10px' }}>
        {!snap && <div style={{ color: C.sub, padding: '12px 0' }}>Initialising…</div>}

        {/* ── RENDERS ── */}
        {snap && section === 'renders' && (
          <>
            <Row label="Total components tracked" value={snap.renders.length} />
            <Row label="State updates / 5s"       value={snap.state.per5s} warn={snap.state.per5s > 30} />

            <SectionHeader>Renders / 5s  (red ≥15 · orange ≥6 · yellow ≥1)</SectionHeader>
            {snap.renders.length === 0 && (
              <div style={{ color: C.sub, fontSize: 10 }}>No render data yet — interact with the UI</div>
            )}
            {snap.renders.map(r => (
              <div key={r.name} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '2px 0', borderBottom: `1px solid ${C.surface}`,
              }}>
                <span style={{ color: r.per5s > 0 ? C.text : C.sub }}>{r.name}</span>
                <span>
                  <span style={{ color: renderColor(r.per5s), marginRight: 10, minWidth: 40, display: 'inline-block', textAlign: 'right' }}>
                    {r.per5s}/5s
                  </span>
                  <span style={{ color: C.sub, minWidth: 60, display: 'inline-block', textAlign: 'right' }}>
                    {r.total} total
                  </span>
                </span>
              </div>
            ))}
          </>
        )}

        {/* ── API ── */}
        {snap && section === 'api' && (
          <>
            <Row label="Total calls"     value={snap.api.total} />
            <Row label="Calls / 5s"      value={snap.api.per5s}  warn={snap.api.per5s > 8} />
            <Row label="Avg latency"     value={`${snap.api.avgMs}ms`} warn={snap.api.avgMs > 800} good={snap.api.avgMs > 0 && snap.api.avgMs < 200} />

            <SectionHeader>Slowest calls (all time)</SectionHeader>
            {snap.api.slowCalls.length === 0 && <div style={{ color: C.sub, fontSize: 10 }}>No calls yet</div>}
            {snap.api.slowCalls.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${C.surface}` }}>
                <span style={{ color: C.blue, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.method} {c.path}
                </span>
                <span style={{ color: apiColor(c.ms), flexShrink: 0, marginLeft: 8 }}>{c.ms}ms</span>
              </div>
            ))}

            <SectionHeader>By endpoint (call count · avg ms)</SectionHeader>
            {snap.api.byPath.map(p => (
              <div key={p.path} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${C.surface}` }}>
                <span style={{ color: C.blue, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</span>
                <span style={{ color: C.sub, flexShrink: 0, marginLeft: 8 }}>
                  ×{p.count} · <span style={{ color: apiColor(p.avgMs) }}>{p.avgMs}ms avg</span>
                </span>
              </div>
            ))}
          </>
        )}

        {/* ── SSE ── */}
        {snap && section === 'sse' && (
          <>
            <Row label="Total SSE events"  value={snap.sse.total} />
            <Row label="Events / 5s"       value={snap.sse.per5s} warn={snap.sse.per5s > 20} />

            <SectionHeader>By event type</SectionHeader>
            {Object.keys(snap.sse.byType).length === 0 && (
              <div style={{ color: C.sub, fontSize: 10 }}>No SSE events yet — click a risk card to start the agent</div>
            )}
            {Object.entries(snap.sse.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${C.surface}` }}>
                  <span style={{ color: C.teal }}>{type}</span>
                  <span style={{ color: C.text }}>{count}</span>
                </div>
              ))}

            <SectionHeader>By scenario</SectionHeader>
            {Object.entries(snap.sse.byScenario)
              .sort((a, b) => b[1] - a[1])
              .map(([id, count]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${C.surface}` }}>
                  <span style={{ color: C.sub, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{id}</span>
                  <span style={{ color: C.text }}>{count} events</span>
                </div>
              ))}
          </>
        )}

        {/* ── STATE ── */}
        {snap && section === 'state' && (
          <>
            <Row label="Total state updates" value={snap.state.total} />
            <Row label="Updates / 5s"        value={snap.state.per5s} warn={snap.state.per5s > 25} />

            <SectionHeader>By component.key (total updates)</SectionHeader>
            {Object.keys(snap.state.byKey).length === 0 && (
              <div style={{ color: C.sub, fontSize: 10 }}>No state updates logged yet</div>
            )}
            {Object.entries(snap.state.byKey)
              .sort((a, b) => b[1] - a[1])
              .map(([key, count]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${C.surface}` }}>
                  <span style={{ color: C.purple }}>{key}</span>
                  <span style={{ color: count > 50 ? C.orange : C.text }}>{count}</span>
                </div>
              ))}
          </>
        )}

        {/* ── Errors (always shown at bottom) ── */}
        {snap && snap.errors.length > 0 && (
          <>
            <SectionHeader>Errors</SectionHeader>
            {snap.errors.map((e, i) => (
              <div key={i} style={{ color: C.red, fontSize: 10, marginBottom: 2, wordBreak: 'break-all' }}>
                {e.msg}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '4px 12px', borderTop: `1px solid ${C.border}`,
        color: C.sub, fontSize: 9, flexShrink: 0,
        background: C.surface, borderRadius: '0 0 10px 10px',
      }}>
        Auto-refreshes every 1s · <span style={{ color: C.border }}>window.__LAYA_PERF__</span> for full raw data
      </div>
    </div>
  );
}
