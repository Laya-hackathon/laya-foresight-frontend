import { useState, useEffect, useCallback, useRef } from 'react';
import { BACKEND_URL, fmt } from '../utils/helpers';
import { renderMd } from '../utils/renderMd';
import { renderInline } from '../utils/renderMd';

/* ── helpers ── */
const fmtDt  = ts => ts ? new Date(ts).toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
const fmtDur = s  => s == null ? '—' : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
const memberName = r => r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : r.member_id;
const stripHtml  = h => h ? h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

const RISK_COLOR    = b => b === 'HIGH' ? 'var(--rose)' : b === 'MEDIUM' ? 'var(--amber)' : b === 'LOW' ? 'var(--green)' : 'var(--faint)';
const URGENCY_COL   = u => u === 'URGENT' ? 'var(--rose)'      : u === 'WATCH' ? 'var(--laya)'      : 'var(--amber)';
const URGENCY_LITE  = u => u === 'URGENT' ? 'var(--rose-lite)'  : u === 'WATCH' ? 'var(--laya-glow)' : 'var(--amber-lite)';

/* ── Sidebar report row ── */
function ReportRow({ report, active, onClick }) {
  const col  = RISK_COLOR(report.risk_band);
  const date = report.started_at ? new Date(report.started_at) : null;
  return (
    <div className={`clt-row${active ? ' clt-row-active' : ''}`} onClick={onClick}>
      <div className="clt-row-strip" style={{ background: report.risk_band ? col : 'transparent' }} />
      <div className="clt-row-body">
        <div className="clt-row-top">
          <span className="clt-row-name">{memberName(report)}</span>
          {report.risk_band && (
            <span className="clt-row-band" style={{ color: col, borderColor: col + '44' }}>{report.risk_band}</span>
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

/* ── Report detail ── */
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

  const col          = RISK_COLOR(report.risk_band);
  const pct          = Math.round((report.risk_score || 0) * 100);
  const actions      = Array.isArray(report.actions_taken) ? report.actions_taken : [];
  const outreachCount = (detail?.emails?.length || 0) + (detail?.notifications?.length || 0)
    + (detail?.callbacks?.length || 0) + (detail?.alerts?.length || 0);

  return (
    <div className="clt-detail">
      <div className="clt-detail-header">
        <div>
          <h1 className="clt-detail-name">{memberName(report)}</h1>
          <div className="clt-detail-sub">
            <span>{report.claim_id}</span>
            {report.treatment_type && <><span className="clt-sep">·</span><span>{report.treatment_type}</span></>}
            {report.plan_type      && <><span className="clt-sep">·</span><span>{report.plan_type}</span></>}
            {report.region         && <><span className="clt-sep">·</span><span>{report.region}</span></>}
            <span className="clt-sep">·</span><span>{fmtDt(report.started_at)}</span>
          </div>
        </div>
        <span className="clt-status-pill" style={{ color: col, borderColor: col + '55', background: col + '10' }}>
          {report.risk_band} · {pct}%
        </span>
      </div>

      <div className="clt-metrics-row">
        {[
          { val: `€${fmt(report.claim_amount || 0)}`, lbl: 'Claim Amount' },
          { val: fmtDur(report.duration_sec),          lbl: 'Run Duration' },
          { val: actions.length || report.actions_count || 0, lbl: 'Actions Taken' },
          { val: outreachCount, lbl: 'Outreach Sent', color: outreachCount > 0 ? 'var(--laya)' : undefined },
          { val: detail?.tool_call_count ?? '—',       lbl: 'Tool Calls' },
        ].map((m, i) => (
          <div key={i} className="clt-metric">
            <div className="clt-metric-val" style={m.color ? { color: m.color } : {}}>{m.val}</div>
            <div className="clt-metric-lbl">{m.lbl}</div>
          </div>
        ))}
      </div>

      <div className="clt-body-grid">
        <div>
          {detail?.ai_summary && (
            <div className="clt-card">
              <div className="clt-card-title">AI Summary</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink2)' }}>{renderMd(detail.ai_summary)}</div>
            </div>
          )}
          {report.agent_reasoning && (
            <div className="clt-card">
              <div className="clt-card-title">Agent Reasoning</div>
              <div style={{ fontSize: 12, color: 'var(--sub)', fontStyle: 'italic' }}>{renderMd(report.agent_reasoning)}</div>
            </div>
          )}
          {actions.length > 0 && (
            <div className="clt-card">
              <div className="clt-card-title">Actions Taken</div>
              {actions.map((a, i) => (
                <div key={i} className="sum-action-row">
                  <span className="sum-action-num">{i + 1}</span>
                  <span className="sum-action-text">{a}</span>
                </div>
              ))}
            </div>
          )}
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

        <div>
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
                    }}>{a.urgency}</span>
                    {a.sla_minutes && <span style={{ fontSize: 10, color: 'var(--faint)' }}>SLA {a.sla_minutes}min</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--sub)', lineHeight: 1.6 }}>{a.message}</div>
                </div>
              ))}
            </div>
          )}
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

/* ── Pending question card ── */
function PendingQuestion({ question, onRespond }) {
  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const name = question.first_name ? `${question.first_name} ${question.last_name || ''}`.trim() : question.claim_id;

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch(`${BACKEND_URL}/api/questions/${question.question_id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: text.trim() }),
      });
      onRespond(question.scenario_id, question.question_id);
    } catch { setSending(false); }
  };

  return (
    <div className="pq-card">
      <div className="pq-header">
        <div className="pq-badge">⏸ Awaiting Input</div>
        <span className="pq-claim">{question.claim_id}</span>
      </div>
      <div className="pq-name">{name}</div>
      <div className="pq-label">Agent asks:</div>
      <div className="pq-question">"{question.question}"</div>
      {question.context && (
        <div className="pq-context">{question.context}</div>
      )}
      <textarea
        className="pq-textarea"
        placeholder="Type your response…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
      />
      <button
        className="pq-send"
        disabled={!text.trim() || sending}
        onClick={submit}
      >
        {sending ? 'Sending…' : '▶ Resume Agent'}
      </button>
    </div>
  );
}

/* ── Compact alert row in right panel ── */
function AlertRow({ alert, active, onSelect }) {
  const col  = URGENCY_COL(alert.urgency);
  const lite = URGENCY_LITE(alert.urgency);
  const name = alert.first_name ? `${alert.first_name} ${alert.last_name || ''}`.trim() : alert.claim_id;
  return (
    <div
      className={`alrt-row${active ? ' alrt-row-active' : ''}`}
      style={{ borderLeft: `3px solid ${col}` }}
      onClick={() => onSelect(alert.run_id)}
    >
      <div className="alrt-row-top">
        <span className="alrt-badge" style={{ background: lite, color: col }}>{alert.urgency}</span>
        {alert.sla_minutes && <span className="alrt-sla">SLA {alert.sla_minutes}m</span>}
      </div>
      <div className="alrt-row-name">{name}</div>
      <div className="alrt-row-claim">{alert.claim_id}</div>
      <div className="alrt-row-msg">{alert.message}</div>
      <div className="alrt-row-ts">{fmtDt(alert.created_at)}</div>
    </div>
  );
}

/* ── Main ── */
export default function ReportsTab({ onResumeScenario }) {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');

  const [alerts, setAlerts]       = useState([]);
  const [questions, setQuestions] = useState([]);
  const [uFilter, setUFilter]     = useState('ALL');
  const sidebarRef = useRef(null);

  // Load reports
  useEffect(() => {
    setLoading(true);
    fetch(`${BACKEND_URL}/api/reports`)
      .then(r => r.json())
      .then(d => { setReports(d.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Load alerts + pending questions (poll)
  const loadAlerts = useCallback(() => {
    fetch(`${BACKEND_URL}/api/alerts`)
      .then(r => r.json()).then(d => setAlerts(d.alerts || [])).catch(() => {});
    fetch(`${BACKEND_URL}/api/questions/pending`)
      .then(r => r.json()).then(d => setQuestions(d.questions || [])).catch(() => {});
  }, []);
  useEffect(() => { loadAlerts(); const id = setInterval(loadAlerts, 10000); return () => clearInterval(id); }, [loadAlerts]);

  const handleQuestionRespond = useCallback((scenarioId, questionId) => {
    setQuestions(prev => prev.filter(q => q.question_id !== questionId));
    if (onResumeScenario) onResumeScenario(scenarioId, questionId);
  }, [onResumeScenario]);

  const handleSelect = useCallback((report) => {
    setSelected(report);
    setDetail(null);
    setDetailLoading(true);
    fetch(`${BACKEND_URL}/api/reports/${report.run_id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, []);

  // Select report by run_id (called from alert click)
  const selectByRunId = useCallback((run_id) => {
    const report = reports.find(r => r.run_id === run_id);
    if (report) {
      handleSelect(report);
      // Scroll the sidebar row into view
      setTimeout(() => {
        const el = sidebarRef.current?.querySelector(`[data-run="${run_id}"]`);
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 50);
    }
  }, [reports, handleSelect]);

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
      return r.claim_id?.toLowerCase().includes(q) || r.member_id?.toLowerCase().includes(q)
        || r.first_name?.toLowerCase().includes(q) || r.last_name?.toLowerCase().includes(q)
        || r.treatment_type?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredAlerts = uFilter === 'ALL' ? alerts : alerts.filter(a => a.urgency === uFilter);
  const todayCount = reports.filter(r => r.started_at && new Date(r.started_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="rpt-page">

      {/* ── Left: runs list ── */}
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
              <button key={f} className={`clt-filter${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="clt-sidebar-meta">
            <span>{filtered.length} reports</span>
            {todayCount > 0 && <span style={{ color: 'var(--laya)' }}>{todayCount} today</span>}
          </div>
        </div>
        <div className="clt-sidebar-list" ref={sidebarRef}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="proc-spinner" style={{ margin: '0 auto .5rem' }} />
              <div style={{ fontSize: 11, color: 'var(--faint)' }}>Loading…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', fontSize: 11, color: 'var(--faint)' }}>No reports found</div>
          ) : filtered.map(r => (
            <div key={r.run_id} data-run={r.run_id}>
              <ReportRow
                report={r}
                active={selected?.run_id === r.run_id}
                onClick={() => handleSelect(r)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Middle: detail ── */}
      <div className="clt-main">
        <ReportDetail report={selected} detail={detail} loading={detailLoading} />
      </div>

      {/* ── Right: alerts panel ── */}
      <div className="rpt-alerts-col">
        <div className="rpt-alerts-hdr">
          <div className="rpt-alerts-title">
            🔔 Alerts
            {alerts.length > 0 && <span className="rpt-alerts-count">{alerts.length}</span>}
            {questions.length > 0 && (
              <span className="rpt-alerts-count" style={{ background: 'var(--amber-lite)', color: 'var(--amber)' }}>
                {questions.length} pending
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {['ALL', 'URGENT', 'ELEVATED', 'WATCH'].map(f => (
              <button key={f} className={`clt-filter${uFilter === f ? ' active' : ''}`} onClick={() => setUFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="rpt-alerts-list">
          {/* Pending questions at the top */}
          {questions.map(q => (
            <PendingQuestion key={q.question_id} question={q} onRespond={handleQuestionRespond} />
          ))}
          {/* Regular alerts */}
          {filteredAlerts.length === 0 && questions.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', fontSize: 11, color: 'var(--faint)' }}>No alerts</div>
          ) : filteredAlerts.map((a, i) => (
            <AlertRow key={i} alert={a} active={selected?.run_id === a.run_id} onSelect={selectByRunId} />
          ))}
        </div>
      </div>

    </div>
  );
}
