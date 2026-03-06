const STATS = [
    { label: 'Call Pressure', value: '34%', sub: 'of active claims at risk', delta: '↓ 11% vs yesterday', dc: 'ddown', color: 'var(--rose)', cls: 'sc-rose' },
    { label: 'High Risk Cases', value: '6', sub: 'Score ≥ 0.70', delta: '↑ 2 new today', dc: 'ddown', color: 'var(--rose)', cls: 'sc-rose' },
    { label: 'Medium Risk Cases', value: '9', sub: 'Score 0.40–0.69', delta: '→ Same as yesterday', dc: 'dflat', color: 'var(--amber)', cls: 'sc-amber' },
    { label: 'Calls Prevented', value: '18', sub: 'This week · 72% success', delta: '↑ 6 vs last week', dc: 'dup', color: 'var(--green)', cls: 'sc-green' },
    { label: 'Agent Actions', value: '41', sub: '12 email · 9 push · 8 Slack', delta: '↑ Active since 08:00', dc: 'dup', color: 'var(--laya)', cls: 'sc-laya' },
];

export default function StatRow() {
    return (
        <div>
            <div className="slbl">Today's Overview</div>
            <div className="stat-row">
                {STATS.map(s => (
                    <div key={s.label} className={`stat-card ${s.cls}`}>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                        <div className="stat-sub">{s.sub}</div>
                        <div className={`stat-delta ${s.dc}`}>{s.delta}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
