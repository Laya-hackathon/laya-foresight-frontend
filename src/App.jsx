import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

import TopBar from './components/TopBar';
import ClaimsTab from './components/ClaimsTab';
import ReportsTab from './components/ReportsTab';
import AgentBar from './components/AgentBar';
import StatRow from './components/StatRow';
import BarChart from './components/BarChart';
import FeedCard from './components/FeedCard';
import CallCard from './components/CallCard';
import Drawer from './components/Drawer';
import { BACKEND_URL } from './utils/helpers';

const TYPE_META = {
  email:        { icon: '📧', bg: '#eff6ff', badge: 'EMAIL', bc: '#eff6ff', btc: '#1d4ed8' },
  alert:        { icon: '🔔', bg: '#fef3c7', badge: 'SLACK', bc: '#fef3c7', btc: '#b45309' },
  notification: { icon: '📱', bg: '#f0fdf4', badge: 'PUSH',  bc: '#f0fdf4', btc: '#15803d' },
  callback:     { icon: '📞', bg: '#f5f3ff', badge: 'CALL',  bc: '#f5f3ff', btc: '#6d28d9' },
  intervention: { icon: '✅', bg: '#f0fdf4', badge: 'DONE',  bc: '#f0fdf4', btc: '#15803d' },
  prediction:   { icon: '🧠', bg: '#e8f0fb', badge: 'MODEL', bc: '#e8f0fb', btc: '#003d7a' },
};

function relTime(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function dbRowToFeed(row) {
  const meta = TYPE_META[row.type] || TYPE_META.prediction;
  return {
    ...meta,
    text: `<strong>${row.type.charAt(0).toUpperCase() + row.type.slice(1)}</strong> — ${row.text}`,
    time: relTime(row.created_at),
  };
}

function Toast({ title, body }) {
  return (
    <div className="toast show">
      <div className="toast-title">{title}</div>
      <div>{body}</div>
    </div>
  );
}

const URGENCY_COL  = { URGENT: 'var(--rose)',  ELEVATED: 'var(--amber)', WATCH: 'var(--laya)' };
const URGENCY_LITE = { URGENT: 'var(--rose-lite)', ELEVATED: 'var(--amber-lite)', WATCH: 'var(--laya-glow)' };

function AlertNotifStack({ notifs, onDismiss }) {
  if (!notifs.length) return null;
  return (
    <div className="an-stack">
      {notifs.map(n => {
        const col  = URGENCY_COL[n.urgency]  || 'var(--laya)';
        const lite = URGENCY_LITE[n.urgency] || 'var(--laya-glow)';
        return (
          <div key={n.id} className="an-card" style={{ borderLeft: `3px solid ${col}` }}>
            <div className="an-top">
              <span className="an-badge" style={{ background: lite, color: col }}>{n.urgency}</span>
              <span className="an-claim">{n.claimId}</span>
              <button className="an-close" onClick={() => onDismiss(n.id)}>×</button>
            </div>
            {n.customerName && <div className="an-name">{n.customerName}</div>}
            <div className="an-msg">{n.message}</div>
            <div className="an-footer">
              <span>SLA {n.sla ?? '—'} min</span>
              <span>#claims-alerts</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [scenarios, setScenarios] = useState([]);
  const [cardStates, setCardStates] = useState(() => {
    try {
      const saved = localStorage.getItem('laya_card_states');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [timerSec, setTimerSec] = useState(0);
  const [toast, setToast] = useState(null);
  const [alertNotifs, setAlertNotifs] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [agentStats, setAgentStats] = useState(null);
  const timerRef = useRef(null);
  const sseRef = useRef({});

  // Load scenarios (poll every 5s for new ML predictions)
  const loadScenarios = useCallback(() => {
    fetch(`${BACKEND_URL}/api/scenarios`)
      .then(r => r.json())
      .then(data => {
        const list = data.scenarios || [];
        setScenarios(list);
        const activeIds = new Set(list.map(s => s.id));

        // Remove card states for scenarios no longer on server (e.g. after reset)
        setCardStates(prev => {
          const cleaned = {};
          Object.entries(prev).forEach(([id, cs]) => {
            if (activeIds.has(id)) cleaned[id] = cs;
          });
          return cleaned;
        });

        list.forEach((s, i) => {
          setCardStates(prev => {
            if (prev[s.id]) return prev;
            return {
              ...prev,
              [s.id]: { state: 'incoming', events: [], startedAt: null, finishedAt: null, isNew: true },
            };
          });
          setTimeout(() => {
            setCardStates(prev => {
              if (!prev[s.id]) return prev;
              return { ...prev, [s.id]: { ...prev[s.id], isNew: false } };
            });
          }, 800 + i * 500);
        });
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    loadScenarios();
    const id = setInterval(loadScenarios, 5000);
    return () => clearInterval(id);
  }, [loadScenarios]);

  // Load feed (poll every 15s)
  useEffect(() => {
    const load = () => {
      fetch(`${BACKEND_URL}/api/feed`)
        .then(r => r.json())
        .then(data => {
          if (data.feed) setFeedItems(data.feed.map(dbRowToFeed));
        })
        .catch(() => { });
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  // Load stats for AgentBar (poll every 15s)
  useEffect(() => {
    const load = () => {
      fetch(`${BACKEND_URL}/api/stats`)
        .then(r => r.json())
        .then(setAgentStats)
        .catch(() => { });
    };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  // Persist card states (without events array to keep storage small)
  useEffect(() => {
    const toSave = {};
    Object.entries(cardStates).forEach(([id, cs]) => {
      toSave[id] = { state: cs.state, startedAt: cs.startedAt, finishedAt: cs.finishedAt, isNew: false };
    });
    localStorage.setItem('laya_card_states', JSON.stringify(toSave));
  }, [cardStates]);

  const showToast = useCallback((title, body) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlertNotifs(prev => prev.filter(n => n.id !== id));
  }, []);

  const resumeScenario = useCallback((scenarioId, questionId) => {
    if (sseRef.current[scenarioId]) sseRef.current[scenarioId].close();
    setCardStates(prev => ({
      ...prev,
      [scenarioId]: { ...prev[scenarioId], state: 'proc', pausedQuestion: null },
    }));
    const es = new EventSource(`${BACKEND_URL}/api/resume/${scenarioId}?question_id=${questionId}`);
    sseRef.current[scenarioId] = es;
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data.trim());
        if (event.type === 'done') {
          es.close();
          delete sseRef.current[scenarioId];
          setCardStates(prev => ({ ...prev, [scenarioId]: { ...prev[scenarioId], state: 'done', finishedAt: Date.now() } }));
          return;
        }
        setCardStates(prev => ({
          ...prev,
          [scenarioId]: { ...prev[scenarioId], events: [...(prev[scenarioId]?.events || []), event] },
        }));
      } catch { }
    };
    es.onerror = () => {
      es.close();
      delete sseRef.current[scenarioId];
      setCardStates(prev => ({ ...prev, [scenarioId]: { ...prev[scenarioId], state: 'done', finishedAt: Date.now() } }));
    };
  }, []);

  const runScenario = useCallback((scenarioId) => {
    if (sseRef.current[scenarioId]) sseRef.current[scenarioId].close();

    setCardStates(prev => ({
      ...prev,
      [scenarioId]: { ...prev[scenarioId], state: 'proc', events: [], startedAt: Date.now(), finishedAt: null },
    }));

    const es = new EventSource(`${BACKEND_URL}/api/run/${scenarioId}`);
    sseRef.current[scenarioId] = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data.trim());
        if (event.type === 'done') {
          es.close();
          delete sseRef.current[scenarioId];
          const scenario = scenarios.find(s => s.id === scenarioId);
          setCardStates(prev => ({
            ...prev,
            [scenarioId]: { ...prev[scenarioId], state: 'done', finishedAt: Date.now() },
          }));
          showToast('Agent Complete', `${scenario?.customer_name || scenarioId} — resolved`);
          return;
        }
        // Pause card when agent asks for employee input
        if (event.type === 'waiting_for_input') {
          setCardStates(prev => ({
            ...prev,
            [scenarioId]: {
              ...prev[scenarioId],
              state: 'paused',
              pausedQuestion: event.data,
            },
          }));
        }
        // Trigger alert popup when alert_employee fires
        if (event.type === 'tool_result' && event.data?.tool_name === 'alert_employee') {
          const scenario = scenarios.find(s => s.id === scenarioId);
          const result = event.data.result || {};
          const notif = {
            id: Date.now() + Math.random(),
            urgency: result.urgency || 'ELEVATED',
            claimId: scenario?.claim_id || scenarioId,
            customerName: scenario?.user?.first_name
              ? `${scenario.user.first_name} ${scenario.user.last_name || ''}`.trim()
              : '',
            message: result.message_preview || '',
            sla: result.sla_minutes,
          };
          setAlertNotifs(prev => [...prev, notif]);
          setTimeout(() => setAlertNotifs(prev => prev.filter(n => n.id !== notif.id)), 8000);
        }
        setCardStates(prev => ({
          ...prev,
          [scenarioId]: {
            ...prev[scenarioId],
            events: [...(prev[scenarioId]?.events || []), event],
          },
        }));
      } catch { }
    };

    es.onerror = () => {
      es.close();
      delete sseRef.current[scenarioId];
      setCardStates(prev => ({
        ...prev,
        [scenarioId]: { ...prev[scenarioId], state: 'done', finishedAt: Date.now() },
      }));
    };
  }, [scenarios, showToast]);

  const handleCardClick = useCallback((scenarioId) => {
    setActiveId(scenarioId);
    setDrawerOpen(true);
    setTimerSec(0);
    const cs = cardStates[scenarioId];
    if (!cs || cs.state === 'incoming') {
      runScenario(scenarioId);
    } else if (cs.state === 'done' && (!cs.events || cs.events.length === 0)) {
      fetch(`${BACKEND_URL}/api/history/${scenarioId}`)
        .then(r => r.json())
        .then(data => {
          if (data.events?.length > 0) {
            setCardStates(prev => ({
              ...prev,
              [scenarioId]: { ...prev[scenarioId], events: data.events },
            }));
          }
        })
        .catch(() => { });
    }
  }, [cardStates, runScenario]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveId(null);
    clearInterval(timerRef.current);
    setTimerSec(0);
  }, []);

  // Timer while drawer is open
  useEffect(() => {
    if (!drawerOpen || !activeId) return;
    clearInterval(timerRef.current);
    const cs = cardStates[activeId];
    const start = cs?.startedAt || Date.now();
    timerRef.current = setInterval(() => {
      const end = cs?.finishedAt || Date.now();
      setTimerSec(Math.round((end - start) / 1000));
    }, 500);
    return () => clearInterval(timerRef.current);
  }, [drawerOpen, activeId, cardStates]);

  const cardList = Object.values(cardStates);
  const activeCount = cardList.filter(c => c.state === 'proc').length;
  const activeCardCS = activeId ? cardStates[activeId] : null;
  const activeScenario = scenarios.find(s => s.id === activeId);
  const visibleScenarios = scenarios.filter(s => cardStates[s.id]);

  const todayCount = agentStats?.total_predictions ?? scenarios.length;
  const preventedCount = agentStats?.calls_prevented ?? 0;
  const successRate = agentStats && agentStats.total_predictions > 0
    ? Math.round((agentStats.calls_prevented / agentStats.total_predictions) * 100)
    : 0;

  const displayFeed = feedItems.length > 0 ? feedItems : [];

  return (
    <>
      <TopBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'Claims'   && <ClaimsTab />}
      {activeTab === 'Reports'  && <ReportsTab onResumeScenario={resumeScenario} />}
      <div className="page-body" style={{ display: activeTab === 'Dashboard' ? 'flex' : 'none' }}>
        {/* ── Left sidebar ─────────────────────────── */}
        <aside className="left-sidebar">
          <div className="sidebar-section">
            <div className="incoming-hdr">
              <div className="in-pulse" />
              <div className="in-title">Risk Triggers</div>
              <div className="in-cnt">
                {cardList.filter(c => c.state !== 'done').length} active
              </div>
            </div>
            {visibleScenarios.length === 0 ? (
              <div className="no-calls">
                <div style={{ fontSize: 24, marginBottom: '.4rem', opacity: .3 }}>🛡️</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--faint)' }}>No triggers yet</div>
              </div>
            ) : (
              <div className="calls-list">
                {visibleScenarios.map(s => {
                  const cs = cardStates[s.id];
                  return (
                    <CallCard
                      key={s.id}
                      scenario={s}
                      state={cs?.state || 'incoming'}
                      isNew={cs?.isNew}
                      onOpen={() => handleCardClick(s.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────── */}
        <main className="main-content">
          <AgentBar
            activeCount={activeCount}
            todayCount={todayCount}
            preventedCount={preventedCount}
            successRate={successRate}
          />
          <StatRow />

          <div className="content-grid">
            <BarChart />
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">⚡ Recent Activity</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--laya)', cursor: 'pointer' }}>View all →</span>
              </div>
              {displayFeed.length === 0
                ? <div style={{ color: 'var(--faint)', fontSize: 12, padding: '1rem 0' }}>No activity yet today</div>
                : displayFeed.map((f, i) => <FeedCard key={i} item={f} />)
              }
            </div>
          </div>
        </main>
      </div>

      <Drawer
        isOpen={drawerOpen}
        scenario={activeScenario}
        liveEvents={activeCardCS?.events || []}
        isProcessing={activeCardCS?.state === 'proc'}
        timerSec={timerSec}
        onClose={closeDrawer}
      />

      {toast && <Toast title={toast.title} body={toast.body} />}
      <AlertNotifStack notifs={alertNotifs} onDismiss={dismissAlert} />
    </>
  );
}
