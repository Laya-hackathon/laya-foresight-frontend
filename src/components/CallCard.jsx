import { bColor, normBand, stInfo, borderClass, fmt } from '../utils/helpers';

export default function CallCard({ scenario, state, onOpen, isNew }) {
    const band = normBand(scenario.risk_band || scenario.band);
    const score = scenario.risk_score ?? scenario.score ?? 0;
    const pct = Math.round(score * 100);
    const col = bColor(band);
    const si = stInfo(state);
    const bc = borderClass(band, state);

    return (
        <div
            className={`call-card ${bc}${isNew ? ' new' : ''}`}
            onClick={onOpen}
        >
            <div className="cc-top">
                <div>
                    <div className="cc-name">{scenario.customer_name || scenario.name}</div>
                    <div className="cc-claim-id">{scenario.claim_id || scenario.id} · {scenario.claim_type || scenario.type}</div>
                </div>
                <span className={`band b-${band}`}>{band}</span>
            </div>

            <div className="cc-tags">
                <span className="cc-tag">€{fmt(scenario.amount_eur || scenario.amount || 0)}</span>
                <span className="cc-tag">{scenario.claim_type || scenario.type}</span>
                {scenario.description && (
                    <span className="cc-warn" title={scenario.description}>⚠ High Risk</span>
                )}
            </div>

            <div className="cc-bar-row">
                <div className="strack">
                    <div className="sfill" style={{ width: `${pct}%`, background: col }} />
                </div>
                <div className="spct" style={{ color: col }}>{pct}%</div>
            </div>

            <div className="cc-foot">
                <div className="cc-status">
                    {state === 'proc'
                        ? <div className="cc-spinner" />
                        : <div className="sdot" style={{ background: si.dot }} />}
                    <span style={{ color: si.tc, fontFamily: 'var(--mono)', fontSize: 10 }}>{si.label}</span>
                </div>
                <div className="cc-time">
                    {state === 'done' ? '✓ Done' : state === 'await' ? '⏳ Awaiting' : 'just now'}
                </div>
            </div>
        </div>
    );
}
