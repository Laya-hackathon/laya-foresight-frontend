import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../utils/helpers';
import { useRenderLog, loggedFetch } from '../utils/logger';

const DEFAULT_BINS = [
    { c: 0, col: '#4ade80' }, { c: 0, col: '#86efac' },
    { c: 0, col: '#fcd34d' }, { c: 0, col: '#fbbf24' },
    { c: 0, col: '#f97316' }, { c: 0, col: '#f43f5e' },
    { c: 0, col: '#e11d48' }, { c: 0, col: '#be123c' },
];

const RANGES  = ['0.0–0.2', '0.2–0.4', '0.4–0.5', '0.5–0.6', '0.6–0.7', '0.7–0.8', '0.8–0.9', '0.9–1.0'];
const XLABELS = ['0.0', '0.2', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'];
const CHART_H = 110;

export default function BarChart() {
    useRenderLog('BarChart');
    const [bins, setBins]         = useState(DEFAULT_BINS);
    const [total, setTotal]       = useState(0);
    const [hovered, setHovered]   = useState(null);
    const [animated, setAnimated] = useState(false);

    useEffect(() => {
        const load = () => {
            loggedFetch(`${BACKEND_URL}/api/chart`)
                .then(r => r.json())
                .then(data => {
                    if (data.bins?.length) {
                        setBins(data.bins);
                        setTotal(data.bins.reduce((s, b) => s + b.c, 0));
                    }
                })
                .catch(() => {});
        };
        load();
        const id = setInterval(load, 15000);
        // Trigger bar entrance animation after first paint
        const t = setTimeout(() => setAnimated(true), 80);
        return () => { clearInterval(id); clearTimeout(t); };
    }, []);

    const max  = Math.max(...bins.map(b => b.c), 1);
    const low  = bins.slice(0, 2).reduce((s, b) => s + b.c, 0);
    const med  = bins.slice(2, 5).reduce((s, b) => s + b.c, 0);
    const high = bins.slice(5).reduce((s, b) => s + b.c, 0);

    return (
        <div className="card">
            {/* Header */}
            <div className="card-hdr">
                <div className="card-title">Risk Score Distribution</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--faint)' }}>
                    {total} predictions today
                </span>
            </div>

            {/* Summary band */}
            <div style={{ display: 'flex', gap: 6, padding: '.55rem 1rem .6rem', borderBottom: '1px solid var(--border)' }}>
                {[
                    { label: 'Low',    val: low,  bg: 'var(--green-lite)',  col: 'var(--green)'  },
                    { label: 'Medium', val: med,  bg: 'var(--amber-lite)',  col: 'var(--amber)'  },
                    { label: 'High',   val: high, bg: 'var(--rose-lite)',   col: 'var(--rose)'   },
                ].map(s => (
                    <div key={s.label} style={{
                        flex: 1, textAlign: 'center', padding: '.35rem .5rem',
                        borderRadius: 6, background: s.bg,
                        border: `1px solid ${s.col}28`,
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: s.col, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontSize: 9.5, color: s.col, opacity: .75, marginTop: 2, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Chart */}
            <div style={{ padding: '.85rem 1rem 0', position: 'relative' }}>

                {/* Risk zone background bands */}
                <div style={{ position: 'absolute', top: '.85rem', left: '1rem', right: '1rem', height: CHART_H, display: 'flex', pointerEvents: 'none' }}>
                    <div style={{ flex: 2, background: 'rgba(22,163,74,.03)',  borderRadius: '4px 0 0 0' }} />
                    <div style={{ flex: 3, background: 'rgba(217,119,6,.03)'  }} />
                    <div style={{ flex: 3, background: 'rgba(225,29,72,.04)',  borderRadius: '0 4px 0 0' }} />
                </div>

                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75, 1].map(pct => (
                    <div key={pct} style={{
                        position: 'absolute',
                        top: `calc(.85rem + ${(1 - pct) * CHART_H}px)`,
                        left: '1rem', right: '1rem',
                        borderTop: pct === 1 ? 'none' : '1px dashed var(--border)',
                        zIndex: 0,
                    }} />
                ))}

                {/* Bars */}
                <div style={{ display: 'flex', alignItems: 'flex-end', height: CHART_H, gap: 5, position: 'relative', zIndex: 1 }}>
                    {bins.map((b, i) => {
                        const heightPct = (b.c / max) * 100;
                        const isHovered = hovered === i;
                        const pct = total > 0 ? Math.round((b.c / total) * 100) : 0;

                        return (
                            <div
                                key={i}
                                style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', cursor: 'pointer' }}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(null)}
                            >
                                {/* Tooltip */}
                                {isHovered && b.c > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: `calc(${heightPct}% + 10px)`,
                                        left: '50%', transform: 'translateX(-50%)',
                                        background: 'var(--ink)', color: '#fff',
                                        borderRadius: 5, padding: '4px 8px',
                                        fontSize: 10.5, whiteSpace: 'nowrap',
                                        zIndex: 10, pointerEvents: 'none',
                                        boxShadow: '0 2px 8px rgba(0,0,0,.18)',
                                        lineHeight: 1.5,
                                    }}>
                                        <div style={{ fontWeight: 600 }}>{RANGES[i]}</div>
                                        <div style={{ opacity: .8 }}>{b.c} · {pct}%</div>
                                        {/* Arrow */}
                                        <div style={{
                                            position: 'absolute', top: '100%', left: '50%',
                                            transform: 'translateX(-50%)',
                                            borderLeft: '5px solid transparent',
                                            borderRight: '5px solid transparent',
                                            borderTop: '5px solid var(--ink)',
                                        }} />
                                    </div>
                                )}

                                {/* Count label above bar */}
                                {b.c > 0 && (
                                    <div style={{
                                        fontSize: 9, fontFamily: 'var(--mono)', color: isHovered ? b.col : 'var(--faint)',
                                        marginBottom: 3, transition: 'color .15s',
                                    }}>
                                        {b.c}
                                    </div>
                                )}

                                {/* Bar */}
                                <div style={{
                                    width: '100%',
                                    height: animated ? `${Math.max(heightPct, b.c > 0 ? 3 : 0)}%` : '0%',
                                    background: isHovered
                                        ? `linear-gradient(to top, ${b.col}, ${b.col}bb)`
                                        : `linear-gradient(to top, ${b.col}cc, ${b.col}88)`,
                                    borderRadius: '3px 3px 0 0',
                                    transition: `height 0.55s cubic-bezier(.22,.68,0,1.15) ${i * 45}ms, background .15s`,
                                    transformOrigin: 'bottom',
                                    boxShadow: isHovered ? `0 0 12px ${b.col}55` : 'none',
                                }} />
                            </div>
                        );
                    })}
                </div>

                {/* Baseline */}
                <div style={{ height: 1, background: 'var(--border)', margin: '0 0 .3rem' }} />
            </div>

            {/* X-axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1rem .65rem', fontFamily: 'var(--mono)', fontSize: 8.5, color: 'var(--faint)' }}>
                {XLABELS.map(l => <span key={l}>{l}</span>)}
            </div>

            {/* Zone labels */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--border)', padding: '.4rem 1rem' }}>
                {[
                    { label: 'LOW RISK',    flex: 2, col: 'var(--green)'  },
                    { label: 'MEDIUM RISK', flex: 3, col: 'var(--amber)'  },
                    { label: 'HIGH RISK',   flex: 3, col: 'var(--rose)'   },
                ].map(z => (
                    <div key={z.label} style={{ flex: z.flex, textAlign: 'center', fontSize: 8, fontFamily: 'var(--mono)', letterSpacing: .8, color: z.col, opacity: .65, textTransform: 'uppercase' }}>
                        {z.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
