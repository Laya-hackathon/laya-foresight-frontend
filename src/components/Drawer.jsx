import { useState, useEffect, useRef } from 'react';
import { bColor, normBand, fmt } from '../utils/helpers';
import ReasoningTab from './ReasoningTab';
import SummaryTab from './SummaryTab';
import ActionsTab from './ActionsTab';

const TABS = [
    { id: 'reasoning', label: '🧠 Reasoning' },
    { id: 'summary', label: '📋 Summary' },
    { id: 'actions', label: '⚡ Actions' },
];

export default function Drawer({ isOpen, scenario, liveEvents, isProcessing, timerSec, onClose }) {
    const [tab, setTab] = useState('reasoning');
    const bodyRef = useRef(null);

    const band = normBand(scenario?.risk_band);
    const col = bColor(band);
    const pct = Math.round((scenario?.risk_score || 0) * 100);

    // Reset to reasoning tab whenever a new scenario opens
    useEffect(() => {
        if (isOpen) {
            setTab('reasoning');
        }
    }, [scenario?.id, isOpen]);

    // Auto-scroll the drawer body to bottom on new events (when on reasoning tab)
    useEffect(() => {
        if (tab === 'reasoning' && bodyRef.current && isProcessing) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [liveEvents?.length, tab, isProcessing]);

    return (
        <>
            <div className={`overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
            <div className={`drawer${isOpen ? ' open' : ''}`}>
                {/* Header */}
                <div className="dw-top">
                    <div className="dw-close" onClick={onClose}>✕</div>
                    <div className="dw-info">
                        <div className="dw-name">{scenario?.customer_name || '—'}</div>
                        <div className="dw-meta">
                            {scenario && (
                                <>
                                    <span className="dw-chip" style={{ color: col, borderColor: col }}>
                                        {band} · {pct}%
                                    </span>
                                    <span className="dw-chip" style={{ color: 'var(--sub)', borderColor: 'var(--border)' }}>
                                        {scenario.claim_id}
                                    </span>
                                    <span className="dw-chip" style={{ color: 'var(--sub)', borderColor: 'var(--border)' }}>
                                        {scenario.claim_type} · €{fmt(scenario.amount_eur || 0)}
                                    </span>
                                    {isProcessing
                                        ? <span className="dw-chip" style={{ color: 'var(--laya)', borderColor: 'var(--laya)' }}>⚙ Processing</span>
                                        : liveEvents?.length > 0
                                            ? <span className="dw-chip" style={{ color: 'var(--green)', borderColor: 'var(--green)' }}>✓ Done</span>
                                            : null}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="dw-timer-block">
                        <div className="dw-tval">
                            {Math.floor(timerSec / 60)}:{String(timerSec % 60).padStart(2, '0')}
                        </div>
                        <div className="dw-tlbl">Time Elapsed</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="dw-tabs">
                    {TABS.map(t => (
                        <div
                            key={t.id}
                            className={`dw-tab${tab === t.id ? ' on' : ''}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </div>
                    ))}
                </div>

                {/* Body — ref used for auto-scroll */}
                <div className="dw-body" ref={bodyRef}>
                    {tab === 'reasoning' && (
                        <ReasoningTab
                            liveEvents={liveEvents}
                            isProcessing={isProcessing}
                        />
                    )}
                    {tab === 'summary' && (
                        <SummaryTab
                            scenario={scenario}
                            liveEvents={liveEvents}
                            timerSec={timerSec}
                        />
                    )}
                    {tab === 'actions' && (
                        <ActionsTab
                            scenario={scenario}
                            liveEvents={liveEvents}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
