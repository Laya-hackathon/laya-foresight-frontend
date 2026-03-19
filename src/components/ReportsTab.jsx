import { useState, useEffect } from 'react';
import { BACKEND_URL, fmt, bColor, normBand } from '../utils/helpers';
import { renderMd } from '../utils/renderMd';

/* ── helpers ── */
const fmtDt = ts => ts
  ? new Date(ts).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  : '—';
const fmtDate = ts => ts
  ? new Date(ts).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const fmtDur = s => s == null ? '—' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
const memberName = r => r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : r.member_id;
const stripHtml = html => html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

const RISK_COLOR = b => b === 'HIGH' ? 'var(--rose)' : b === 'MEDIUM' ? 'var(--amber)' : b === 'LOW' ? 'var(--green)' : 'var(--faint)';

/* ── Sidebar row ── */
function ReportRow({ report, active, onClick }) {
  const col = RISK_COLOR(report.risk_band);
  const date = report.started_at ? new Date(report.started_at) : null;
  return (
    <div className={`clt-row${active ? ' clt-row-active' : ''}`} onClick={onClick}>
      <div className="clt-row-strip" style={{ background: report.risk_band ? col : 'transparent' }} />
      <div className="clt-row-body">
        <div className="clt-row-top">
          <span className="clt-row-name">{memberName(report)}</span>
          {report.risk_band && (
            <span className="clt-row-band" style={{ color: col, borderColor: col + '44' }}>
              {report.risk_band}
            </span>
          )}
        </div>
        <div className="clt-row-bot">
          <span className="clt-row-id">{report.claim_id}</span>
          {report.claim_amount && <span className="clt-row-amt">€{fmt(report.claim_amount)}</span>}
        </div>
        <div className="clt-row-status">
          <span style={{ color: 'var(--green)', fontSize: 7 }}>●</span>
          <span>{fmtDur(report.duration_sec)}</span>
          {date && <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--faint)' }}>
            {date.toLocaleDateString('en-IE', { day: '2-digit', month: 'short' })}
          </span>}
        </div>
      </div>
    </div>
  );
}

/* ── Detail panel ── */
function ReportDetail({ report, detail, loading }) {
  if (!report) return (
    <div className="clt-empty">
      <div style={{ fontSize: 28, opacity: .12, marginBottom: '.5rem' }}>◈</div>
      <div style={{ fontSize: 12, color: 'var(--faint)' }}>Select a report</div>
    </div>
  );

  if (loading) return (
    <div className="clt-empty">
      <div className="proc-spinner" style={{ margin: '0 auto .5rem' }} />
      <div style={{ fontSize: 11, color: 'var(--faint)' }}>Loading report…</div>
    </div>
  );

  const col      = RISK_COLOR(report.risk_band);
  const pct      = Math.round((report.risk_score || 0) * 100);
  const actions  = Array.isArray(report.actions_taken) ? report.actions_taken : [];

  // Outreach summary counts
  const outreachCount = (detail?.emails?.length || 0) + (detail?.notifications?.length || 0)
    + (detail?.callbacks?.length || 0) + (detail?.alerts?.length || 0);

  return (
    <div className="clt-detail">

      {/* ── Header ── */}
      <div className="clt-detail-header">
        <div>
          <h1 className="clt-detail-name">{memberName(report)}</h1>
          <div className="clt-detail-sub">
            <span>{report.claim_id}</span>
            {report.treatment_type && <><span className="clt-sep">·</span><span>{report.treatment_type}</span></>}
            {report.plan_type      && <><span className="clt-sep">·</span><span>{report.plan_type}</span></>}
            {report.region         && <><span className="clt-sep">·</span><span>{report.region}</span></>}
            <span className="clt-sep">·</span>
            <span>{fmtDt(report.started_at)}</span>
          </div>
        </div>
        <span className="clt-status-pill" style={{ color: col, borderColor: col + '55', background: col + '10' }}>
          {report.risk_band} · {pct}%
        </span>
      </div>

      {/* ── Metrics strip ── */}
      <div className="clt-metrics-row">
        {[
          { val: `€${fmt(report.claim_amount || 0)}`,          lbl: 'Claim Amount' },
          { val: fmtDur(report.duration_sec),                   lbl: 'Run Duration' },
          { val: actions.length || report.actions_count || 0,   lbl: 'Actions Taken' },
          { val: outreachCount,                                  lbl: 'Outreach Sent', color: outreachCount > 0 ? 'var(--laya)' : undefined },
          { val: detail?.tool_call_count ?? '—',                lbl: 'Tool Calls' },
        ].map((m, i) => (
          <div key={i} className="clt-metric">
            <div className="clt-metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="clt-metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>

      <div className="clt-body-grid">

        {/* ── Left column ── */}
        <div>

          {/* AI Summary */}
          {detail?.ai_summary && (
            <div className="clt-card">
              <div className="clt-card-title">AI Summary</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>
                {renderMd(detail.ai_summary)}
              </div>
            </div>
          )}

          {/* Agent Reasoning */}
          {report.agent_reasoning && (
            <div className="clt-card">
              <div className="clt-card-title">Agent Reasoning</div>
              <div style={{ fontSize: 12, color: 'var(--sub)', fontStyle: 'italic' }}>
                {renderMd(report.agent_reasoning)}
              </div>
            </div>
          )}

          {/* Actions taken */}
          {actions.length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">Actions Taken</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {actions.map((a, i) => (
                  <div key={i} className="sum-action-row">
                    <span className="sum-action-num">{i + 1}</span>
                    <span className="sum-action-text">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Run info */}
          <div className="clt-card">
            <div className="clt-card-title">Run Info</div>
            <div className="clt-kv"><span className="clt-kv-l">Run ID</span><span className="clt-kv-v" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>#{report.run_id}</span></div>
            <div className="clt-kv"><span className="clt-kv-l">Status</span><span className="clt-kv-v" style={{ color: 'var(--green)', fontWeight: 600 }}>{report.status}</span></div>
            <div className="clt-kv"><span className="clt-kv-l">Started</span><span className="clt-kv-v">{fmtDt(report.started_at)}</span></div>
            <div className="clt-kv"><span className="clt-kv-l">Ended</span><span className="clt-kv-v">{fmtDt(report.ended_at)}</span></div>
            <div className="clt-kv"><span className="clt-kv-l">Duration</span><span className="clt-kv-v">{fmtDur(report.duration_sec)}</span></div>
            <div className="clt-kv"><span className="clt-kv-l">Reasoning Steps</span><span className="clt-kv-v">{detail?.reasoning_step_count ?? '—'}</span></div>
            <div className="clt-kv"><span className="clt-kv-l">Tool Calls</span><span className="clt-kv-v">{detail?.tool_call_count ?? '—'}</span></div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div>

          {/* Emails */}
          {detail?.emails?.length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">📧 Emails Sent ({detail.emails.length})</div>
              {detail.emails.map((e, i) => (
                <div key={i} style={{ marginBottom: i < detail.emails.length - 1 ? '.85rem' : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: '.3rem' }}>{e.subject}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--sub)', lineHeight: 1.6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '.6rem .75rem' }}>
                    {stripHtml(e.body_html).slice(0, 320)}{stripHtml(e.body_html).length > 320 ? '…' : ''}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>{fmtDt(e.created_at)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Push notifications */}
          {detail?.notifications?.length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">📱 Push Notifications ({detail.notifications.length})</div>
              {detail.notifications.map((n, i) => (
                <div key={i} style={{ marginBottom: i < detail.notifications.length - 1 ? '.75rem' : 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: '.2rem' }}>{n.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--sub)' }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 3 }}>{fmtDt(n.created_at)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Callbacks */}
          {detail?.callbacks?.length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">📞 Scheduled Callbacks ({detail.callbacks.length})</div>
              {detail.callbacks.map((cb, i) => (
                <div key={i} style={{ marginBottom: i < detail.callbacks.length - 1 ? '.75rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.2rem' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cb.priority === 'HIGH' ? 'var(--rose)' : 'var(--laya)' }}>{cb.priority} Priority</span>
                    {cb.scheduled_for && <span style={{ fontSize: 10, color: 'var(--faint)' }}>{fmtDt(cb.scheduled_for)}</span>}
                  </div>
                  {cb.notes && <div style={{ fontSize: 11.5, color: 'var(--sub)' }}>{cb.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Employee alerts */}
          {detail?.alerts?.length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">🔔 Employee Alerts ({detail.alerts.length})</div>
              {detail.alerts.map((a, i) => (
                <div key={i} style={{ marginBottom: i < detail.alerts.length - 1 ? '.75rem' : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.25rem' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                      background: a.urgency === 'URGENT' ? 'var(--rose-lite)' : 'var(--amber-lite)',
                      color: a.urgency === 'URGENT' ? 'var(--rose)' : 'var(--amber)',
                      border: `1px solid ${a.urgency === 'URGENT' ? 'rgba(225,29,72,.25)' : 'rgba(217,119,6,.25)'}`,
                    }}>{a.urgency}</span>
                    {a.sla_minutes && <span style={{ fontSize: 10, color: 'var(--faint)' }}>SLA {a.sla_minutes}min</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--sub)', lineHeight: 1.6 }}>{a.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* If no outreach at all */}
          {detail && outreachCount === 0 && (
            <div className="clt-card">
              <div className="clt-card-title">Outreach</div>
              <div style={{ fontSize: 12, color: 'var(--faint)', padding: '.5rem 0' }}>No outreach actions were taken for this run.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function ReportsTab() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');

  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/reports`)
      .then(r => r.json())
      .then(d => { setReports(d.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSelect = report => {
    setSelected(report);
    setDetail(null);
    setDetailLoading(true);
    fetch(`${BACKEND_URL}/api/reports/${report.run_id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  };

  // Filter & search
  const filtered = reports.filter(r => {
    if (filter === 'HIGH'   && r.risk_band !== 'HIGH')   return false;
    if (filter === 'MEDIUM' && r.risk_band !== 'MEDIUM') return false;
    if (filter === 'LOW'    && r.risk_band !== 'LOW')    return false;
    if (filter === 'TODAY') {
      const today = new Date().toDateString();
      if (!r.started_at || new Date(r.started_at).toDateString() !== today) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        r.claim_id?.toLowerCase().includes(q)    ||
        r.member_id?.toLowerCase().includes(q)   ||
        r.first_name?.toLowerCase().includes(q)  ||
        r.last_name?.toLowerCase().includes(q)   ||
        r.treatment_type?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todayCount = reports.filter(r => r.started_at && new Date(r.started_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="clt-page">

      {/* Sidebar */}
      <div className="clt-sidebar">
        <div className="clt-sidebar-top">
          <input
            className="clt-search"
            placeholder="Search reports…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="clt-filters">
            {['ALL', 'TODAY', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
              <button key={f} className={`clt-filter${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
          <div className="clt-sidebar-meta">
            <span>{filtered.length} reports</span>
            {todayCount > 0 && <span style={{ color: 'var(--laya)' }}>{todayCount} today</span>}
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
              No reports found
            </div>
          ) : (
            filtered.map(r => (
              <ReportRow
                key={r.run_id}
                report={r}
                active={selected?.run_id === r.run_id}
                onClick={() => handleSelect(r)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="clt-main">
        <ReportDetail report={selected} detail={detail} loading={detailLoading} />
      </div>
    </div>
  );
}
