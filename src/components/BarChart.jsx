import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../utils/helpers';

const XLBLS = ['0.0', '0.2', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'];

const DEFAULT_BINS = [
    { c: 0, col: '#86efac' }, { c: 0, col: '#4ade80' },
    { c: 0, col: '#fcd34d' }, { c: 0, col: '#fbbf24' },
    { c: 0, col: '#f97316' }, { c: 0, col: '#f43f5e' },
    { c: 0, col: '#e11d48' }, { c: 0, col: '#be123c' },
];

export default function BarChart() {
    const [bins, setBins] = useState(DEFAULT_BINS);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const load = () => {
            fetch(`${BACKEND_URL}/api/chart`)
                .then(r => r.json())
                .then(data => {
                    if (data.bins && data.bins.length) {
                        setBins(data.bins);
                        setTotal(data.bins.reduce((s, b) => s + b.c, 0));
                    }
                })
                .catch(() => { });
        };
        load();
        const id = setInterval(load, 15000);
        return () => clearInterval(id);
    }, []);

    const max = Math.max(...bins.map(b => b.c), 1);

    return (
        <div className="card">
            <div className="card-hdr">
                <div className="card-title">📊 Risk Score Distribution</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)' }}>{total} predictions</span>
            </div>
            <div className="bar-chart">
                {bins.map((b, i) => (
                    <div key={i} className="bc-col">
                        <div className="bc-cnt">{b.c}</div>
                        <div
                            className="bc-bar"
                            style={{ height: `${(b.c / max) * 100}%`, background: b.col }}
                            title={`${b.c} claims`}
                        />
                    </div>
                ))}
            </div>
            <div className="chart-xlbls">
                {XLBLS.map(l => <span key={l}>{l}</span>)}
            </div>
            <div className="chart-legend">
                <div className="cl-item"><div className="cl-dot" style={{ background: 'var(--green)' }} />Low (&lt;0.40)</div>
                <div className="cl-item"><div className="cl-dot" style={{ background: 'var(--amber)' }} />Medium (0.40–0.69)</div>
                <div className="cl-item"><div className="cl-dot" style={{ background: 'var(--rose)' }} />High (≥0.70)</div>
            </div>
        </div>
    );
}
