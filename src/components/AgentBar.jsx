export default function AgentBar({ activeCount, todayCount, preventedCount, successRate }) {
    const isActive = activeCount > 0;
    const stats = [
        { val: activeCount, lbl: 'Active Cases', color: 'var(--laya)' },
        { val: todayCount, lbl: 'Processed Today', color: 'var(--violet)' },
        { val: preventedCount, lbl: 'Prevented', color: 'var(--green)' },
        { val: `${successRate}%`, lbl: 'Success Rate', color: 'var(--amber)' },
    ];

    return (
        <div className={`agent-bar-main${isActive ? ' is-active' : ''}`}>
            {/* Left: orb + identity */}
            <div className="abm-identity">
                <div className={`abm-orb${isActive ? ' active' : ''}`}>
                    {isActive ? '🤖' : '😴'}
                </div>
                <div>
                    <div className="abm-name">Laya Agent</div>
                    <div className="abm-sub">
                        {isActive ? `Processing ${activeCount} case${activeCount > 1 ? 's' : ''}…` : 'Monitoring · Idle'}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="abm-divider" />

            {/* Stats */}
            <div className="abm-stats">
                {stats.map(({ val, lbl, color }) => (
                    <div key={lbl} className="abm-stat">
                        <div className="abm-val" style={{ color }}>{val}</div>
                        <div className="abm-lbl">{lbl}</div>
                    </div>
                ))}
            </div>

            {/* Right: live indicator */}
            <div className="abm-live">
                <span className={`abm-live-dot${isActive ? ' pulse' : ''}`} />
                <span className="abm-live-txt">{isActive ? 'LIVE' : 'STANDBY'}</span>
            </div>
        </div>
    );
}
