export const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function bColor(band) {
    if (band === 'HIGH' || band === 'CRITICAL') return 'var(--rose)';
    if (band === 'MED' || band === 'MEDIUM') return 'var(--amber)';
    return 'var(--green)';
}

export function normBand(band) {
    if (!band) return 'LOW';
    if (band === 'CRITICAL') return 'HIGH';
    if (band === 'MEDIUM') return 'MED';
    return band;
}

export function stInfo(s) {
    if (s === 'proc') return { dot: 'var(--laya)', label: 'Processing…', tc: 'var(--laya)' };
    if (s === 'done') return { dot: 'var(--teal)', label: 'Resolved', tc: 'var(--teal)' };
    if (s === 'await') return { dot: 'var(--violet)', label: 'Awaiting Employee', tc: 'var(--violet)' };
    if (s === 'esc') return { dot: 'var(--rose)', label: 'Escalated', tc: 'var(--rose)' };
    return { dot: '#94a3b8', label: 'Incoming', tc: 'var(--sub)' };
}

export function borderClass(band, st) {
    if (st === 'proc') return 'cc-proc';
    if (st === 'done') return 'cc-done-c';
    if (st === 'await') return 'cc-await';
    const b = normBand(band);
    return b === 'HIGH' ? 'cc-high' : b === 'MED' ? 'cc-med' : 'cc-low';
}

export function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

export function fmt(n) {
    return Number(n).toLocaleString('en-IE');
}
