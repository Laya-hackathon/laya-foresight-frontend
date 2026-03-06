import { normBand, fmt } from '../utils/helpers';

export default function ActionsTab({ scenario, liveEvents }) {
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
    const toolResults = liveEvents.filter(e => e.type === 'tool_result');
    const alertResult = toolResults.find(e => e.data.tool_name === 'alert_employee');
    const emailResult = toolResults.find(e => e.data.tool_name === 'send_email');
    const pushResult = toolResults.find(e => e.data.tool_name === 'send_in_app_notification');
    const callbackResult = toolResults.find(e => e.data.tool_name === 'schedule_callback');
    const logResult = toolResults.find(e => e.data.tool_name === 'log_intervention');

    // Get tool calls to read inputs
    const toolCalls = liveEvents.filter(e => e.type === 'tool_call');
    const alertCall = toolCalls.find(e => e.data.tool_name === 'alert_employee');
    const emailCall = toolCalls.find(e => e.data.tool_name === 'send_email');
    const pushCall = toolCalls.find(e => e.data.tool_name === 'send_in_app_notification');
    const callbackCall = toolCalls.find(e => e.data.tool_name === 'schedule_callback');

    return (
        <div>
            <div className="slbl" style={{ marginBottom: '.8rem' }}>Dispatched Actions</div>

            {alertCall && (
                <div className="ac-card">
                    <div className="ac-hdr">
                        <div className="ac-title-txt">🔔 Employee Alert — Slack</div>
                        <span className="ac-status" style={{
                            background: band === 'HIGH' ? 'var(--rose-lite)' : 'var(--amber-lite)',
                            color: band === 'HIGH' ? 'var(--rose)' : 'var(--amber)'
                        }}>
                            {alertCall.data.tool_input?.urgency || 'ELEVATED'}
                        </span>
                    </div>
                    <div className="ac-body-p">
                        <div className="slack-preview">
                            <div style={{ marginBottom: '.4rem' }}>
                                <span className="slack-bot">LayaAIAgent</span>
                                <span className="slack-ts">just now</span>
                            </div>
                            {band === 'HIGH' ? '🚨' : '⚠️'} <strong>{alertCall.data.tool_input?.urgency || 'ELEVATED'}</strong> — {scenario?.claim_id}<br />
                            {scenario?.customer_name} · {scenario?.claim_type} · €{fmt(scenario?.amount_eur || 0)}<br />
                            {alertCall.data.tool_input?.message?.slice(0, 120)}…
                            <div className="slack-btns">
                                <div className="sb-btn sb-g">✓ Update</div>
                                <div className="sb-btn sb-r">📞 Callback</div>
                                <div className="sb-btn sb-gr">Dismiss</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {(emailCall || pushCall) && (
                <div className="ac-card">
                    <div className="ac-hdr">
                        <div className="ac-title-txt">{pushCall ? '📱 In-App Push Notification' : '📧 Email — SendGrid'}</div>
                        <span className="ac-status" style={{ background: 'var(--green-lite)', color: 'var(--green)' }}>SENT</span>
                    </div>
                    <div className="ac-body-p">
                        <div className="email-preview">
                            <div className="ep-subj">
                                {emailCall?.data?.tool_input?.subject || pushCall?.data?.tool_input?.title || 'Update on your claim'}
                            </div>
                            <div className="ep-body">
                                {(emailCall?.data?.tool_input?.body_html || pushCall?.data?.tool_input?.body || '')
                                    .replace(/<[^>]+>/g, '')
                                    .split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {callbackCall && (
                <div className="ac-card">
                    <div className="ac-hdr">
                        <div className="ac-title-txt">📞 Callback Scheduled</div>
                        <span className="ac-status" style={{ background: 'var(--violet-lite)', color: 'var(--violet)' }}>
                            {callbackCall.data.tool_input?.priority || 'NORMAL'} PRIORITY
                        </span>
                    </div>
                    <div className="ac-body-p">
                        <div className="log-mono">
                            customer: "{scenario?.customer_name}"<br />
                            slot: "Next available (within 2 hours)"<br />
                            notes: "{callbackCall.data.tool_input?.notes?.slice(0, 80)}…"
                        </div>
                    </div>
                </div>
            )}

            {logResult && (
                <div className="ac-card">
                    <div className="ac-hdr">
                        <div className="ac-title-txt">📊 Intervention Logged</div>
                        <span className="ac-status" style={{ background: 'var(--surface2)', color: 'var(--sub)' }}>48H MONITOR</span>
                    </div>
                    <div className="ac-body-p">
                        <div className="log-mono">
                            intervention_id: "{logResult.data.result?.intervention_id}"<br />
                            claim_id: "{scenario?.claim_id}"<br />
                            actions_count: {logResult.data.result?.actions_count || 0}<br />
                            expected_outcome: "Support call avoided"
                        </div>
                    </div>
                </div>
            )}

            {!alertCall && !emailCall && !pushCall && !callbackCall && !logResult && (
                <div style={{ color: 'var(--faint)', fontFamily: 'var(--mono)', fontSize: 11, textAlign: 'center', padding: '2rem' }}>
                    No action tools were called yet.
                </div>
            )}
        </div>
    );
}
