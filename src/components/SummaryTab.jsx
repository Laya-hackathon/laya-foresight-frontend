import { bColor, normBand, fmt } from '../utils/helpers';

export default function SummaryTab({ scenario, liveEvents, timerSec }) {
    if (!liveEvents || liveEvents.length === 0) {
        return (
            <div className="proc-ph">
                <div className="proc-spinner" />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--faint)' }}>
                    Waiting for agent to complete…
                </div>
            </div>
        );
    }

    const band = normBand(scenario?.risk_band);
    const col = bColor(band);
    const pct = Math.round((scenario?.risk_score || 0) * 100);

    // Gather actions and decision from live events
    const toolResults = liveEvents.filter(e => e.type === 'tool_result');
    const logEvent = toolResults.find(e => e.data.tool_name === 'log_intervention');
    const completeEvent = liveEvents.find(e => e.type === 'complete');
    const toolCount = liveEvents.filter(e => e.type === 'tool_call').length;
    const reasoningCount = liveEvents.filter(e => e.type === 'reasoning').length;
    const actions = logEvent?.data?.result?.actions_count || toolResults.length;
    const decision = completeEvent?.data?.message || 'Agent task complete';

    return (
        <div>
            <div className="sum-card">
                <div className="sum-lbl">Agent Decision</div>
                <div className="sum-text">{decision}</div>
            </div>

            <div className="slbl" style={{ marginBottom: '.5rem' }}>Outcome</div>
            <div className="out-chips">
                <div className="oc" style={{ background: 'var(--green-lite)', borderColor: '#86efac', color: 'var(--green)' }}>✅ Support call avoided</div>
                <div className="oc" style={{ background: 'var(--laya-lite)', borderColor: '#bfdbfe', color: 'var(--laya)' }}>🎯 {pct}% risk score</div>
                <div className="oc" style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--sub)' }}>⏱ {timerSec}s total</div>
                <div className="oc" style={{ background: 'var(--teal-lite)', borderColor: '#99f6e4', color: 'var(--teal)' }}>👁 48h monitoring</div>
            </div>

            <div className="slbl" style={{ marginBottom: '.5rem' }}>Stats</div>
            <div className="stat-3">
                {[['Reasoning', reasoningCount], ['Tool Calls', toolCount], ['Actions', actions]].map(([l, v]) => (
                    <div key={l} className="s3-item">
                        <div className="s3-val">{v}</div>
                        <div className="s3-lbl">{l}</div>
                    </div>
                ))}
            </div>

            <div className="slbl" style={{ marginBottom: '.5rem' }}>Tool Calls</div>
            {toolResults.map((ev, i) => (
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
    );
}
