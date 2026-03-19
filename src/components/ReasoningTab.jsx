import { useState, useEffect, useRef } from 'react';
import { renderInline, renderMd } from '../utils/renderMd';

// ── Word-by-word token fade (like AI token streaming) ──────────────────────
// Splits text into words, each word fades in with a staggered delay.
// Markdown is applied per-word so **bold** renders correctly.
function WordStream({ text, startDelay = 0 }) {
    // Tokenise: split on spaces but keep the space attached to the preceding word
    // so spacing is preserved naturally.
    const tokens = text.split(/(?<=\s)|(?=\s)/).filter(Boolean);

    return (
        <>
            {tokens.map((tok, i) => (
                <span
                    key={i}
                    className="word-token"
                    style={{ animationDelay: `${startDelay + i * 22}ms` }}
                >
                    {tok}
                </span>
            ))}
        </>
    );
}

// ── Rendered reasoning line with word-stream animation ─────────────────────
function StreamLine({ text, lineDelay = 0 }) {
    // Count approximate words already shown before this line to continue stagger
    return (
        <p style={{ marginBottom: '.3rem', lineHeight: 1.8 }}>
            <WordStream text={text} startDelay={lineDelay} />
        </p>
    );
}

// ── Slide-in wrapper ────────────────────────────────────────────────────────
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

// ── Fade-in wrapper (for tool blocks) ──────────────────────────────────────
function FadeIn({ children, delay = 0 }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity .3s ease, transform .3s ease',
        }}>
            {children}
        </div>
    );
}

// ── Reasoning block ─────────────────────────────────────────────────────────
function ReasoningBlock({ event, index }) {
    const [open, setOpen] = useState(true);
    const text = event.data?.text || event.data?.content || '';
    const lines = text.split('\n').filter(l => l.trim());

    // Accumulate word counts per line so stagger is continuous across lines
    let wordOffset = 0;

    return (
        <SlideIn>
            <div className="reasoning-block">
                <div className="reasoning-hdr" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: 12 }}>💭</span>
                    <span className="think-lbl" style={{ flex: 1 }}>Reasoning</span>
                    <span className="reasoning-step">Step {event.data?.step ?? index + 1}</span>
                    <span className="think-tog" style={{ marginLeft: 8 }}>
                        {open ? '▼' : '▶'}
                    </span>
                </div>
                {open && (
                    <div className="reasoning-body">
                        {lines.map((line, i) => {
                            const lineDelay = wordOffset * 22;
                            const wordCount = line.split(/\s+/).length;
                            wordOffset += wordCount;
                            return (
                                <StreamLine key={i} text={line} lineDelay={lineDelay} />
                            );
                        })}
                    </div>
                )}
            </div>
        </SlideIn>
    );
}

// ── Tool call block ─────────────────────────────────────────────────────────
function ToolCallBlock({ event }) {
    const input = event.data?.tool_input;
    const argsText = JSON.stringify(input, null, 2);

    return (
        <SlideIn>
            <div className="tool-block">
                <div className="tool-hdr">
                    <div className="tool-fn">🔧 <span>{event.data?.tool_name}()</span></div>
                    <span className="tool-chip tool-chip-call">calling…</span>
                </div>
                <FadeIn delay={80}>
                    <div className="tool-args">{argsText}</div>
                </FadeIn>
            </div>
        </SlideIn>
    );
}

// ── Tool result block ───────────────────────────────────────────────────────
function ToolResultBlock({ event }) {
    const result = event.data?.result;
    const resultText = JSON.stringify(result, null, 2);

    return (
        <SlideIn>
            <div className="tool-block">
                <div className="tool-hdr">
                    <div className="tool-fn">🔧 <span>{event.data?.tool_name}()</span></div>
                    <span className="tool-chip tool-chip-done">✓ done</span>
                </div>
                <FadeIn delay={60}>
                    <div className="tool-result">
                        <div className="tr-lbl">Result</div>
                        {resultText}
                    </div>
                </FadeIn>
            </div>
        </SlideIn>
    );
}

// ── Status block ────────────────────────────────────────────────────────────
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

// ── Done block ──────────────────────────────────────────────────────────────
function DoneBlock({ event }) {
    return (
        <SlideIn>
            <div className="live-done">
                ✅ {event.data?.message || 'Agent task complete'}
            </div>
        </SlideIn>
    );
}

// ── Error block ─────────────────────────────────────────────────────────────
function ErrorBlock({ event }) {
    return (
        <SlideIn>
            <div className="live-error">
                ❌ {event.data?.message || 'An error occurred'}
            </div>
        </SlideIn>
    );
}

// ── Event dispatcher ────────────────────────────────────────────────────────
function LiveEvent({ event, index }) {
    switch (event.type) {
        case 'reasoning':   return <ReasoningBlock event={event} index={index} />;
        case 'tool_call':   return <ToolCallBlock event={event} />;
        case 'tool_result': return <ToolResultBlock event={event} />;
        case 'status':
        case 'api_call':    return <StatusBlock event={event} />;
        case 'complete':    return <DoneBlock event={event} />;
        case 'error':       return <ErrorBlock event={event} />;
        default:            return null;
    }
}

// ── Main ReasoningTab ───────────────────────────────────────────────────────
export default function ReasoningTab({ liveEvents, isProcessing }) {
    const bottomRef = useRef(null);

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
                        <div style={{ fontSize: 11, color: 'var(--faint)', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Agent initialising
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--sub)' }}>Connecting to GitHub Models API…</div>
                    </div>
                </div>
            );
        }
        return (
            <div className="proc-ph">
                <div style={{ fontSize: 28, marginBottom: '.5rem', opacity: .2 }}>🧠</div>
                <div style={{ fontSize: 11, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: 1 }}>
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
                <div className="stream-pulse">
                    <span /><span /><span />
                </div>
            )}
            <div ref={bottomRef} style={{ height: 1 }} />
        </div>
    );
}
