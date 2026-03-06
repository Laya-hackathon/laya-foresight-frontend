import { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';

import TopBar from './components/TopBar';
import AgentBar from './components/AgentBar';
import StatRow from './components/StatRow';
import BarChart from './components/BarChart';
import FeedCard from './components/FeedCard';
import CallCard from './components/CallCard';
import Drawer from './components/Drawer';
import { FEED_DATA } from './data/feedData';
import { BACKEND_URL } from './utils/helpers';

function Toast({ title, body }) {
  return (
    <div className="toast show">
      <div className="toast-title">{title}</div>
      <div>{body}</div>
    </div>
  );
}

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [cardStates, setCardStates] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [timerSec, setTimerSec] = useState(0);
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const sseRef = useRef({});

  // Load scenarios
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/scenarios`)
      .then(r => r.json())
      .then(data => {
        const list = data.scenarios || [];
        setScenarios(list);
        list.forEach((s, i) => {
          setTimeout(() => {
            setCardStates(prev => ({
              ...prev,
              [s.id]: { state: 'incoming', events: [], startedAt: null, finishedAt: null, isNew: true },
            }));
            setTimeout(() => {
              setCardStates(prev => ({ ...prev, [s.id]: { ...prev[s.id], isNew: false } }));
            }, 800);
          }, i * 500);
        });
      })
      .catch(() => { });
  }, []);

  const showToast = useCallback((title, body) => {
    setToast({ title, body });
    setTimeout(() => setToast(null), 4000);
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
    if (!cs || cs.state === 'incoming') runScenario(scenarioId);
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
  const doneCount = cardList.filter(c => c.state === 'done').length;
  const activeCardCS = activeId ? cardStates[activeId] : null;
  const activeScenario = scenarios.find(s => s.id === activeId);
  const visibleScenarios = scenarios.filter(s => cardStates[s.id]);

  return (
    <>
      <TopBar />
      <div className="page-body">
        {/* ── Left sidebar ─────────────────────────── */}
        <aside className="left-sidebar">
          {/* Trigger cards */}
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
            todayCount={scenarios.length + 36}
            preventedCount={doneCount + 15}
            successRate={72}
          />
          <StatRow />

          <div className="content-grid">
            <BarChart />
            <div className="card">
              <div className="card-hdr">
                <div className="card-title">⚡ Recent Activity</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--laya)', cursor: 'pointer' }}>View all →</span>
              </div>
              {FEED_DATA.map((f, i) => <FeedCard key={i} item={f} />)}
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
    </>
  );
}
