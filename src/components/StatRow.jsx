import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../utils/helpers';

export default function StatRow() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const load = () => {
            fetch(`${BACKEND_URL}/api/stats`)
                .then(r => r.json())
                .then(setStats)
                .catch(() => { });
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    if (!stats) {
        return (
            <div>
                <div className="slbl">Today's Overview</div>
                <div className="stat-row">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="stat-card sc-rose" style={{ opacity: 0.4 }}>
                            <div className="stat-label">Loading…</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const STATS = [
        {
            label: 'High Risk Cases',
            value: String(stats.high_risk),
            sub: 'Score ≥ 0.70 today',
            delta: `${stats.total_predictions} total predictions`,
            dc: 'ddown',
            color: 'var(--rose)',
            cls: 'sc-rose',
        },
        {
            label: 'Medium Risk Cases',
            value: String(stats.medium_risk),
            sub: 'Score 0.40–0.69 today',
            delta: `${stats.low_risk} low risk`,
            dc: 'dflat',
            color: 'var(--amber)',
            cls: 'sc-amber',
        },
        {
            label: 'Calls Prevented',
            value: String(stats.calls_prevented),
            sub: 'Interventions logged today',
            delta: `${stats.total_predictions} scored today`,
            dc: 'dup',
            color: 'var(--green)',
            cls: 'sc-green',
        },
        {
            label: 'Agent Actions',
            value: String(stats.total_actions),
            sub: `${stats.emails_sent} email · ${stats.push_sent} push · ${stats.slack_sent} Slack`,
            delta: 'All tool calls today',
            dc: 'dup',
            color: 'var(--laya)',
            cls: 'sc-laya',
        },
        {
            label: 'Outreach Today',
            value: String(stats.emails_sent + stats.push_sent),
            sub: `${stats.emails_sent} emails · ${stats.push_sent} push`,
            delta: `${stats.slack_sent} Slack alerts`,
            dc: 'dup',
            color: 'var(--teal)',
            cls: 'sc-laya',
        },
    ];

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
