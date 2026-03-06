import { useState, useEffect, useRef, useCallback } from 'react';

// ── Typewriter hook: animates text character by character ──────────────────
function useTypewriter(text, speed = 12) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);
    const frameRef = useRef(null);
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        indexRef.current = 0;

        const tick = () => {
            indexRef.current += 1;
            setDisplayed(text.slice(0, indexRef.current));
            if (indexRef.current < text.length) {
                // Accelerate on spaces/punctuation
                const ch = text[indexRef.current];
                const delay = /[\s.,!?;:]/.test(ch) ? speed * 0.3 : speed;
                frameRef.current = setTimeout(tick, delay);
            } else {
                setDone(true);
            }
        };

        frameRef.current = setTimeout(tick, speed);
        return () => clearTimeout(frameRef.current);
    }, [text, speed]);

    return { displayed, done };
}

// ── Animated reasoning text paragraph ─────────────────────────────────────
function TypewriterParagraph({ text, delay = 0 }) {
    const [active, setActive] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setActive(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const { displayed, done } = useTypewriter(active ? text : '', 10);

    return (
        <p style={{ marginBottom: '.3rem', position: 'relative' }}>
            {displayed}
            {!done && active && (
                <span className="typcursor">▋</span>
            )}
        </p>
    );
}

// ── Slide-in wrapper for any block ─────────────────────────────────────────
function SlideIn({ children, delay = 0 }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div className={`slide-block${visible ? ' slide-in' : ''}`}>
            {children}
        </div>
    );
}

// ── Reasoning block with typewriter ───────────────────────────────────────
function ReasoningBlock({ event, index }) {
    const [open, setOpen] = useState(true);
    const text = event.data?.text || event.data?.content || '';
    const lines = text.split('\n').filter(l => l.trim());

    return (
        <SlideIn>
            <div className="reasoning-block">
                <div className="reasoning-hdr" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: 13 }}>💭</span>
                    <span className="think-lbl" style={{ flex: 1 }}>Reasoning</span>
                    <span className="reasoning-step">Step {event.data?.step ?? index + 1}</span>
                    <span className="think-tog" style={{ marginLeft: 8, color: 'rgba(255,215,64,0.6)' }}>
                        {open ? '▼' : '▶'}
                    </span>
                </div>
                {open && (
                    <div className="reasoning-body">
                        {lines.map((line, i) => (
                            <TypewriterParagraph
                                key={i}
                                text={line}
                                delay={i * 60}
                            />
                        ))}
                    </div>
                )}
            </div>
        </SlideIn>
    );
}

// ── Tool call block with animated args reveal ──────────────────────────────
function ToolCallBlock({ event }) {
    const input = event.data?.tool_input;
    const argsText = JSON.stringify(input, null, 2);
    const { displayed: displayedArgs } = useTypewriter(argsText, 6);

    return (
        <SlideIn>
            <div className="tool-block">
                <div className="tool-hdr">
                    <div className="tool-fn">🔧 <span>{event.data?.tool_name}()</span></div>
                    <span className="tool-chip tool-chip-call">calling…</span>
                </div>
                <div className="tool-args">
                    {displayedArgs}
                    <span className="typcursor">▋</span>
                </div>
            </div>
        </SlideIn>
    );
}

// ── Tool result block with counter-scan animation ─────────────────────────
function ToolResultBlock({ event }) {
    const result = event.data?.result;
    const resultText = JSON.stringify(result, null, 2);
    const { displayed, done } = useTypewriter(resultText, 4);

    return (
        <SlideIn>
            <div className="tool-block">
                <div className="tool-hdr">
                    <div className="tool-fn">🔧 <span>{event.data?.tool_name}()</span></div>
                    <span className="tool-chip tool-chip-done">✓ done</span>
                </div>
                <div className="tool-result">
                    <div className="tr-lbl">Result</div>
                    {displayed}
                    {!done && <span className="typcursor typcursor-green">▋</span>}
                </div>
            </div>
        </SlideIn>
    );
}

// ── Status block ──────────────────────────────────────────────────────────
function StatusBlock({ event }) {
    return (
        <SlideIn>
            <div className="status-block">
                <div className="status-dot" />
                <span>{event.data?.message}</span>
            </div>
        </SlideIn>
    );
}

// ── Done block ────────────────────────────────────────────────────────────
function DoneBlock({ event }) {
    return (
        <SlideIn>
            <div className="live-done done-glow">
                ✅ {event.data?.message || 'Agent task complete'}
            </div>
        </SlideIn>
    );
}

// ── Error block ───────────────────────────────────────────────────────────
function ErrorBlock({ event }) {
    return (
        <SlideIn>
            <div className="live-error">
                ❌ {event.data?.message || 'An error occurred'}
            </div>
        </SlideIn>
    );
}

// ── Event dispatcher ──────────────────────────────────────────────────────
function LiveEvent({ event, index }) {
    switch (event.type) {
        case 'reasoning': return <ReasoningBlock event={event} index={index} />;
        case 'tool_call': return <ToolCallBlock event={event} />;
        case 'tool_result': return <ToolResultBlock event={event} />;
        case 'status': return <StatusBlock event={event} />;
        case 'api_call': return <StatusBlock event={event} />;
        case 'complete': return <DoneBlock event={event} />;
        case 'error': return <ErrorBlock event={event} />;
        default: return null;
    }
}

// ── Main ReasoningTab ─────────────────────────────────────────────────────
export default function ReasoningTab({ liveEvents, isProcessing }) {
    const bottomRef = useRef(null);

    // Auto-scroll when new events arrive
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [liveEvents?.length]);

    if (!liveEvents || liveEvents.length === 0) {
        if (isProcessing) {
            return (
                <div className="trace-wrap">
                    <div className="proc-ph">
                        <div className="proc-spinner" />
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--faint)', marginBottom: '.4rem' }}>
                            Agent initialising
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--sub)' }}>Connecting to GitHub Models API…</div>
                    </div>
                </div>
            );
        }
        return (
            <div className="proc-ph">
                <div style={{ fontSize: 32, marginBottom: '.5rem', opacity: .3 }}>🧠</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--faint)' }}>
                    Click a risk card to start the agent
                </div>
            </div>
        );
    }

    return (
        <div className="trace-wrap">
            {liveEvents.map((ev, i) => (
                <LiveEvent key={i} event={ev} index={i} />
            ))}
            {isProcessing && (
                <div className="typing-dots">
                    <span /><span /><span />
                </div>
            )}
            <div ref={bottomRef} style={{ height: 1 }} />
        </div>
    );
}
