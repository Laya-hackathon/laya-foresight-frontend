import { bColor, normBand, fmt } from '../utils/helpers';
import { renderMd } from '../utils/renderMd';

export default function SummaryTab({ scenario, liveEvents, timerSec }) {
    if (!liveEvents || liveEvents.length === 0) {
        return (
            <div className="proc-ph">
                <div className="proc-spinner" />
                <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: '.5rem' }}>
                    Waiting for agent to complete…
                </div>
            </div>
        );
    }

    const band = normBand(scenario?.risk_band);
    const col  = bColor(band);
    const pct  = Math.round((scenario?.risk_score || 0) * 100);

    // ── Extract key events ──────────────────────────────────────
    const reasoningEvents = liveEvents.filter(e => e.type === 'reasoning');
    const toolCallEvents  = liveEvents.filter(e => e.type === 'tool_call');
    const toolResultEvents = liveEvents.filter(e => e.type === 'tool_result');

    // The last reasoning text = the AI's final summary paragraph
    const lastReasoning   = reasoningEvents[reasoningEvents.length - 1];
    const aiSummaryText   = lastReasoning?.data?.text || '';

    // log_intervention call holds actions_taken + reasoning written by the agent
    const logCall         = toolCallEvents.find(e => e.data.tool_name === 'log_intervention');
    const actionsTaken    = logCall?.data?.tool_input?.actions_taken || [];
    const agentReasoning  = logCall?.data?.tool_input?.reasoning || '';

    const toolCount       = toolCallEvents.length;
    const actionsCount    = actionsTaken.length || toolResultEvents.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* ── Full AI Summary ─────────────────────────────── */}
            {aiSummaryText && (
                <section>
                    <div className="sum-section-title">AI Summary</div>
                    <div className="sum-prose">{renderMd(aiSummaryText)}</div>
                </section>
            )}

            {/* ── Agent Reasoning (from log_intervention) ─────── */}
            {agentReasoning && (
                <section>
                    <div className="sum-section-title">Agent Reasoning</div>
                    <div className="sum-prose sum-prose-muted">{renderMd(agentReasoning)}</div>
                </section>
            )}

            {/* ── Outcome chips ───────────────────────────────── */}
            <section>
                <div className="sum-section-title">Outcome</div>
                <div className="out-chips">
                    <div className="oc" style={{ background: 'var(--green-lite)', borderColor: '#86efac', color: 'var(--green)' }}>✅ Support call avoided</div>
                    <div className="oc" style={{ background: 'rgba(2,132,199,.08)', borderColor: '#bfdbfe', color: 'var(--laya)' }}>🎯 {pct}% risk score</div>
                    <div className="oc" style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--sub)' }}>⏱ {timerSec}s total</div>
                    <div className="oc" style={{ background: 'var(--teal-lite)', borderColor: '#99f6e4', color: 'var(--teal)' }}>👁 48h monitoring</div>
                </div>
            </section>

            {/* ── Stats ───────────────────────────────────────── */}
            <section>
                <div className="sum-section-title">Run Stats</div>
                <div className="stat-3">
                    {[['Reasoning', reasoningEvents.length], ['Tool Calls', toolCount], ['Actions', actionsCount]].map(([l, v]) => (
                        <div key={l} className="s3-item">
                            <div className="s3-val">{v}</div>
                            <div className="s3-lbl">{l}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Actions taken ───────────────────────────────── */}
            {actionsTaken.length > 0 && (
                <section>
                    <div className="sum-section-title">Actions Taken</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
                        {actionsTaken.map((action, i) => (
                            <div key={i} className="sum-action-row">
                                <span className="sum-action-num">{i + 1}</span>
                                <span className="sum-action-text">{action}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Tool timeline ───────────────────────────────── */}
            <section>
                <div className="sum-section-title">Tool Timeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {toolCallEvents.map((ev, i) => (
                        <div key={i} className="tl-item">
                            <div className="tl-dot" style={{ background: 'var(--laya)', borderColor: 'var(--laya)' }} />
                            <div>
                                <div className="tl-lbl">Step {i + 1}</div>
                                <div className="tl-txt">{ev.data.tool_name}()</div>
                            </div>
                        </div>
                    ))}
                    <div className="tl-item">
                        <div className="tl-dot" style={{ background: 'var(--green)', borderColor: 'var(--green)' }} />
                        <div>
                            <div className="tl-lbl">Monitoring</div>
                            <div className="tl-txt">Outcome tracked 48h · Labels will retrain model</div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
