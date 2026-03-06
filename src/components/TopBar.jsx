import { useEffect, useState } from 'react';

export default function TopBar() {
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
                {['Dashboard', 'Claims', 'Reports', 'Settings'].map((n, i) => (
                    <div key={n} className={`tn${i === 0 ? ' on' : ''}`}>{n}</div>
                ))}
            </nav>
            <div className="topbar-right">
                <div className="tb-time">{time}</div>
                <div className="tb-user" title="Laya Healthcare Team">LH</div>
            </div>
        </div>
    );
}
