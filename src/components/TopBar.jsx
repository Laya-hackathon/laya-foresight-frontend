import { useEffect, useState } from 'react';
import { useRenderLog } from '../utils/logger';

const TABS = ['Dashboard', 'Claims', 'Reports', 'Settings'];

export default function TopBar({ activeTab, onTabChange }) {
    useRenderLog('TopBar');
    const [time, setTime] = useState('');

    useEffect(() => {
        const tick = () => setTime(new Date().toLocaleTimeString('en-IE', { hour12: false }));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

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
            <div className="topbar-right">
                <div className="tb-time">{time}</div>
                <div className="tb-user" title="Laya Healthcare Team">LH</div>
            </div>
        </div>
    );
}
