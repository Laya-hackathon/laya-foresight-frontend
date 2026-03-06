const BINS = [
    { c: 2, col: '#86efac' }, { c: 3, col: '#4ade80' },
    { c: 2, col: '#fcd34d' }, { c: 3, col: '#fbbf24' },
    { c: 4, col: '#f97316' }, { c: 5, col: '#f43f5e' },
    { c: 3, col: '#e11d48' }, { c: 2, col: '#be123c' },
];
const XLBLS = ['0.0', '0.2', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'];
const MAX = Math.max(...BINS.map(b => b.c));

export default function BarChart() {
    return (
        <div className="card">
            <div className="card-hdr">
                <div className="card-title">📊 Risk Score Distribution</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)' }}>24 active claims</span>
            </div>
            <div className="bar-chart">
                {BINS.map((b, i) => (
                    <div key={i} className="bc-col">
                        <div className="bc-cnt">{b.c}</div>
                        <div
                            className="bc-bar"
                            style={{ height: `${(b.c / MAX) * 100}%`, background: b.col }}
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
