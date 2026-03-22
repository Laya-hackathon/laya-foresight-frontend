import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../utils/helpers';
import { useRenderLog, loggedFetch } from '../utils/logger';

const TABS = ['Dashboard', 'Claims', 'Reports', 'Settings'];

export default function TopBar({ activeTab, onTabChange }) {
    useRenderLog('TopBar');
    const [time, setTime] = useState('');
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString('en-IE', { hour12: false }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const load = () => {
            loggedFetch(`${BACKEND_URL}/api/stats`)
                .then(r => r.json())
                .then(setStats)
                .catch(() => {});
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    const pills = stats ? [
        { label: 'Active', value: stats.active_cases, color: stats.active_cases > 0 ? 'var(--laya)' : 'var(--muted)' },
        { label: 'Today', value: stats.processed_today, color: 'var(--teal)' },
        { label: 'Prevented', value: stats.calls_prevented, color: 'var(--green)' },
        { label: 'Success', value: `${stats.success_rate}%`, color: stats.success_rate >= 80 ? 'var(--green)' : stats.success_rate >= 50 ? 'var(--amber)' : 'var(--rose)' },
    ] : [];

    return (
        <div className="topbar">
            <div className="logo">
                Foresight <span className="logo-badge">LAYA</span>
            </div>
            <nav className="topbar-nav">
                {TABS.map(n => (
                    <div
                        key={n}
                        className={`tn${activeTab === n ? ' on' : ''}`}
                        onClick={() => onTabChange(n)}
                    >
                        {n}
                    </div>
                ))}
            </nav>
            <div className="topbar-stats">
                {pills.map(p => (
                    <div key={p.label} className="tb-pill">
                        <span className="tb-pill-val" style={{ color: p.color }}>{p.value}</span>
                        <span className="tb-pill-lbl">{p.label}</span>
                    </div>
                ))}
            </div>
            <div className="topbar-right">
                <div className="tb-time">{time}</div>
                <div className="tb-user" title="Laya Healthcare Team">LH</div>
            </div>
        </div>
    );
}
