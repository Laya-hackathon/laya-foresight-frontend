import { useState, useEffect, useRef } from 'react';
import { BACKEND_URL, fmt } from '../utils/helpers';
import { useRenderLog } from '../utils/logger';

/* ── helpers ── */
const riskColor = b =>
  b === 'HIGH' ? 'var(--rose)' : b === 'MEDIUM' ? 'var(--amber)' : b === 'LOW' ? 'var(--green)' : 'var(--faint)';
const fmtDate = ts =>
  ts ? new Date(ts).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const memberName = c => c.full_name || c.user_id;
const daysSince = ts =>
  ts ? Math.floor((Date.now() - new Date(ts)) / 86400000) : null;
const deriveStatus = c => {
  if (c.claim_rejected_flag)    return { label: 'Rejected',     color: 'var(--rose)'   };
  if (c.adjudicator_flag)       return { label: 'Under Review', color: 'var(--amber)'  };
  if (c.missing_documents_flag) return { label: 'Docs Missing', color: 'var(--amber)'  };
  if (c.resubmission_flag)      return { label: 'Resubmission', color: 'var(--violet)' };
  return { label: 'Processing', color: 'var(--laya)' };
};

/* ── Sparkline ── */
function Sparkline({ data, color = 'var(--laya)', height = 52, width = 300 }) {
  if (!data || data.length < 2) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--faint)' }}>
      No activity data
    </div>
  );
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 6);
    return `${x},${y}`;
  }).join(' ');
  const fillPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ── Donut ── */
function Donut({ pct, color, size = 56 }) {
  const r = 20, cx = 26, cy = 26;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 52 52">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth="4" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600"
        fontFamily="var(--body)" fill={color}>{pct}%</text>
    </svg>
  );
}

/* ── Sidebar row ── */
function SidebarRow({ claim, active, onClick }) {
  const status = deriveStatus(claim);
  return (
    <div className={`clt-row${active ? ' clt-row-active' : ''}`} onClick={onClick}>
      <div className="clt-row-strip" style={{ background: claim.risk_band ? riskColor(claim.risk_band) : 'transparent' }} />
      <div className="clt-row-body">
        <div className="clt-row-top">
          <span className="clt-row-name">{memberName(claim)}</span>
          {claim.risk_band && (
            <span className="clt-row-band" style={{ color: riskColor(claim.risk_band), borderColor: riskColor(claim.risk_band) + '44' }}>
              {claim.risk_band}
            </span>
          )}
        </div>
        <div className="clt-row-bot">
          <span className="clt-row-id">{claim.claim_id}</span>
          <span className="clt-row-amt">€{fmt(claim.claim_amount || 0)}</span>
        </div>
        <div className="clt-row-status">
          <span style={{ color: status.color, fontSize: 7 }}>●</span>
          <span>{status.label}</span>
          {claim.missing_documents_flag && <span className="clt-flag-tag">docs</span>}
          {claim.claim_rejected_flag    && <span className="clt-flag-tag clt-flag-tag-red">rejected</span>}
        </div>
      </div>
    </div>
  );
}

/* ── KV row ── */
function KV({ label, value, highlight }) {
  return (
    <div className="clt-kv">
      <span className="clt-kv-l">{label}</span>
      <span className="clt-kv-v" style={highlight ? { color: highlight } : {}}>{value ?? '—'}</span>
    </div>
  );
}

/* ── Flag row ── */
function FlagRow({ label, active, color }) {
  return (
    <div className="clt-flag-row" style={{ opacity: active ? 1 : 0.38 }}>
      <span className="clt-flag-dot" style={{ background: active ? color : 'var(--border2)' }} />
      <span className="clt-flag-label">{label}</span>
      <span className="clt-flag-status" style={{ color: active ? color : 'var(--faint)' }}>
        {active ? 'Yes' : 'No'}
      </span>
    </div>
  );
}

/* ── Detail ── */
function ClaimDetail({ claim }) {
  const [logs, setLogs] = useState([]);
  const prevId = useRef(null);

  useEffect(() => {
    if (!claim || claim.claim_id === prevId.current) return;
    prevId.current = claim.claim_id;
    setLogs([]);
    fetch(`${BACKEND_URL}/api/claims/${claim.claim_id}/activity?user_id=${claim.user_id}`)
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => {});
  }, [claim]);

  if (!claim) return (
    <div className="clt-empty">
      <div style={{ fontSize: 28, opacity: .12, marginBottom: '.5rem' }}>◫</div>
      <div style={{ fontSize: 12, color: 'var(--faint)' }}>Select a claim</div>
    </div>
  );

  const status    = deriveStatus(claim);
  const days      = daysSince(claim.submission_timestamp);
  const pct       = Math.round((claim.risk_probability || 0) * 100);
  const col       = claim.risk_band ? riskColor(claim.risk_band) : 'var(--laya)';
  const flagCount = [claim.missing_documents_flag, claim.adjudicator_flag, claim.claim_rejected_flag, claim.resubmission_flag].filter(Boolean).length;

  const activityBuckets = (() => {
    if (!logs.length) return [];
    const b = new Array(24).fill(0);
    logs.forEach(l => { b[new Date(l.timestamp).getHours()]++; });
    return b;
  })();

  const eventTypes = logs.reduce((acc, l) => {
    acc[l.event_type] = (acc[l.event_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="clt-detail">

      {/* Header */}
      <div className="clt-detail-header">
        <div>
          <h1 className="clt-detail-name">{memberName(claim)}</h1>
          <div className="clt-detail-sub">
            <span>{claim.claim_id}</span>
            {claim.treatment_type && <><span className="clt-sep">·</span><span>{claim.treatment_type}</span></>}
            {claim.plan_type      && <><span className="clt-sep">·</span><span>{claim.plan_type}</span></>}
          </div>
        </div>
        <span className="clt-status-pill" style={{ color: status.color, borderColor: status.color + '55', background: status.color + '10' }}>
          {status.label}
        </span>
      </div>

      {/* Metrics */}
      <div className="clt-metrics-row">
        {[
          { val: `€${fmt(claim.claim_amount || 0)}`, lbl: 'Claim Amount' },
          { val: claim.risk_band ? `${pct}%` : '—', lbl: 'Risk Score', color: col },
          { val: days ?? '—', lbl: 'Days Pending', color: days > 14 ? 'var(--rose)' : undefined },
          { val: logs.length, lbl: 'App Events', color: logs.length > 10 ? 'var(--rose)' : undefined },
          { val: flagCount, lbl: 'Active Flags', color: flagCount > 0 ? 'var(--amber)' : undefined },
        ].map((m, i) => (
          <div key={i} className="clt-metric">
            <div className="clt-metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="clt-metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="clt-body-grid">

        {/* Left column */}
        <div>
          <div className="clt-card">
            <div className="clt-card-title">Claim Details</div>
            <KV label="Claim ID"      value={claim.claim_id} />
            <KV label="Treatment"     value={claim.treatment_type} />
            <KV label="Channel"       value={claim.submission_channel} />
            <KV label="Submitted"     value={fmtDate(claim.submission_timestamp)} />
            <KV label="Amount"        value={`€${fmt(claim.claim_amount || 0)}`} highlight="var(--ink)" />
            {claim.resubmission_flag && claim.original_claim_id && (
              <KV label="Original Claim" value={claim.original_claim_id} />
            )}
          </div>

          <div className="clt-card">
            <div className="clt-card-title">Member Profile</div>
            <KV label="Plan"              value={claim.plan_type} />
            <KV label="Region"            value={claim.region} />
            <KV label="Age Group"         value={claim.age_group} />
            <KV label="Tenure"            value={claim.membership_tenure_years != null ? `${claim.membership_tenure_years} yrs` : null} />
            <KV label="Past Escalations"  value={claim.past_escalation_count ?? 0}
                highlight={claim.past_escalation_count > 0 ? 'var(--rose)' : undefined} />
            <KV label="Behaviour"         value={claim.behavior_archetype} />
            {claim.email && <KV label="Email" value={claim.email} />}
          </div>

          <div className="clt-card">
            <div className="clt-card-title">Claim Flags</div>
            <FlagRow label="Missing Documents"  active={claim.missing_documents_flag} color="var(--amber)"  />
            <FlagRow label="Adjudicator Review" active={claim.adjudicator_flag}       color="var(--violet)" />
            <FlagRow label="Claim Rejected"     active={claim.claim_rejected_flag}    color="var(--rose)"   />
            <FlagRow label="Resubmission"       active={claim.resubmission_flag}      color="var(--laya)"   />
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* App activity */}
          <div className="clt-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
              <div className="clt-card-title" style={{ marginBottom: 0 }}>App Activity</div>
              <span style={{ fontSize: 11, color: 'var(--faint)' }}>{logs.length} events</span>
            </div>
            <Sparkline data={activityBuckets} color={col} height={52} width={300} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.3rem' }}>
              {['00:00', '06:00', '12:00', '18:00', '23:00'].map(t => (
                <span key={t} style={{ fontSize: 9, color: 'var(--faint)', fontFamily: 'var(--mono)' }}>{t}</span>
              ))}
            </div>
          </div>

          {/* AI risk */}
          {claim.risk_band && (
            <div className="clt-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.65rem' }}>
                <div className="clt-card-title" style={{ marginBottom: 0 }}>AI Risk Assessment</div>
                {claim.predicted_at && (
                  <span style={{ fontSize: 11, color: 'var(--faint)' }}>{fmtDate(claim.predicted_at)}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <Donut pct={pct} color={col} size={56} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: col, marginBottom: '.2rem' }}>
                    {claim.risk_band} Risk
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--sub)', marginBottom: '.5rem', lineHeight: 1.5 }}>
                    {pct >= 70 ? 'High likelihood of support call within 48h'
                               : pct >= 40 ? 'Moderate risk — monitor closely'
                               : 'Low risk — standard processing'}
                  </div>
                  <div className="clt-risk-track">
                    <div className="clt-risk-fill" style={{ width: `${pct}%`, background: col }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--faint)', fontFamily: 'var(--mono)' }}>
                    <span>0%</span>
                    <span style={{ color: col, fontWeight: 600 }}>{pct}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Event breakdown */}
          {Object.keys(eventTypes).length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">Event Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                {Object.entries(eventTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const pctVal = Math.round((count / logs.length) * 100);
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11.5, color: 'var(--ink2)', width: 140, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {type}
                      </span>
                      <div style={{ flex: 1, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${pctVal}%`, height: '100%', background: 'var(--laya)', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--sub)', width: 22, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ClaimsTab() {
  useRenderLog('ClaimsTab');
  const [claims, setClaims]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/claims`)
      .then(r => r.json())
      .then(d => { setClaims(d.claims || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = claims.filter(c => {
    if (filter === 'FLAGGED' && !c.risk_band)              return false;
    if (filter === 'HIGH'    && c.risk_band !== 'HIGH')    return false;
    if (filter === 'MEDIUM'  && c.risk_band !== 'MEDIUM')  return false;
    if (filter === 'LOW'     && c.risk_band !== 'LOW')     return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.claim_id?.toLowerCase().includes(q) ||
        c.user_id?.toLowerCase().includes(q)  ||
        c.full_name?.toLowerCase().includes(q) ||
        c.treatment_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const highCount    = claims.filter(c => c.risk_band === 'HIGH').length;
  const flaggedCount = claims.filter(c => c.risk_band).length;

  return (
    <div className="clt-page">

      {/* Sidebar */}
      <div className="clt-sidebar">
        <div className="clt-sidebar-top">
          <input
            className="clt-search"
            placeholder="Search claims…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="clt-filters">
            {['ALL', 'FLAGGED', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
              <button key={f} className={`clt-filter${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <div className="clt-sidebar-meta">
            <span>{filtered.length} claims</span>
            {flaggedCount > 0 && (
              <span style={{ color: 'var(--rose)' }}>{highCount} high</span>
            )}
          </div>
        </div>

        <div className="clt-sidebar-list">
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="proc-spinner" style={{ margin: '0 auto .5rem' }} />
              <div style={{ fontSize: 11, color: 'var(--faint)' }}>Loading…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 11, color: 'var(--faint)' }}>
              No claims found
            </div>
          ) : (
            filtered.map(c => (
              <SidebarRow
                key={c.claim_id}
                claim={c}
                active={selected?.claim_id === c.claim_id}
                onClick={() => setSelected(c)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="clt-main">
        <ClaimDetail claim={selected} />
      </div>
    </div>
  );
}
