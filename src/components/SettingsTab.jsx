import { useState } from 'react';
import { BACKEND_URL } from '../utils/helpers';

const TABLES = [
  'aa_agent_errors',
  'aa_agent_reasoning_steps',
  'aa_agent_tool_calls',
  'aa_customer_emails',
  'aa_customer_notifications',
  'aa_employee_alerts',
  'aa_employee_questions',
  'aa_scheduled_callbacks',
  'aa_interventions',
  'aa_agent_paused_state',
  'aa_agent_runs',
  'aa_ml_predictions',
  'model_predictions',
];

export default function SettingsTab() {
  const [confirm, setConfirm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);

  const handleReset = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/reset`, { method: 'POST' });
      const d = await r.json();
      setResult(d.status === 'ok' ? { ok: true, msg: `Cleared ${d.cleared.length} tables.` } : { ok: false, msg: d.detail || 'Error' });
    } catch (e) {
      setResult({ ok: false, msg: e.message });
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 560 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: '.25rem' }}>Settings</h2>
      <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: '2rem' }}>Administrative controls for the Foresight demo environment.</p>

      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '1.25rem 1.5rem', background: 'var(--surface)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '.35rem' }}>Reset Database</div>
        <div style={{ fontSize: 12, color: 'var(--sub)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Deletes all rows from the following tables:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem' }}>
          {TABLES.map(t => (
            <span key={t} style={{
              fontFamily: 'var(--mono)', fontSize: 10.5, padding: '2px 8px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 4, color: 'var(--sub)',
            }}>{t}</span>
          ))}
        </div>

        {result && (
          <div style={{
            fontSize: 12, padding: '.6rem .85rem', borderRadius: 6, marginBottom: '1rem',
            background: result.ok ? 'var(--teal-lite, #f0fdf4)' : 'var(--rose-lite)',
            color: result.ok ? 'var(--teal, #15803d)' : 'var(--rose)',
            border: `1px solid ${result.ok ? '#bbf7d0' : 'var(--rose)'}`,
          }}>
            {result.ok ? '✓ ' : '✗ '}{result.msg}
          </div>
        )}

        {!confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{
              padding: '.5rem 1.1rem', borderRadius: 6, border: '1px solid var(--rose)',
              background: 'transparent', color: 'var(--rose)', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Delete All Data
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--rose)', fontWeight: 600 }}>Are you sure?</span>
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                padding: '.45rem 1rem', borderRadius: 6, border: 'none',
                background: 'var(--rose)', color: '#fff', fontSize: 12,
                fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1,
              }}
            >
              {loading ? 'Clearing…' : 'Yes, delete all'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              style={{
                padding: '.45rem 1rem', borderRadius: 6,
                border: '1px solid var(--border)', background: 'transparent',
                fontSize: 12, cursor: 'pointer', color: 'var(--sub)',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
