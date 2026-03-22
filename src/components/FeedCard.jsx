import { useRenderLog } from '../utils/logger';

export default function FeedCard({ item }) {
    useRenderLog('FeedCard');
    return (
        <div className="feed-item">
            <div className="fi-icon" style={{ background: item.bg }}>{item.icon}</div>
            <div className="fi-body">
                <div className="fi-text" dangerouslySetInnerHTML={{ __html: item.text }} />
                <div className="fi-time">{item.time}</div>
            </div>
            <div className="fi-badge" style={{ background: item.bc, color: item.btc, border: `1px solid ${item.bc}` }}>
                {item.badge}
            </div>
        </div>
    );
}
