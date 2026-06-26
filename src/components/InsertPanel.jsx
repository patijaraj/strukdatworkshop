import React, { useState } from 'react';
import { Plus, Shuffle, Clock } from 'lucide-react';
import { insertLog, insertBulkRandom } from '../utils/logStore';

const LEVELS   = ['INFO', 'WARNING', 'ERROR'];
const SOURCES  = ['AppService', 'Database', 'AuthService', 'Network'];

export default function InsertPanel({ logs, setLogs, addToast }) {
  const [level,   setLevel]   = useState('INFO');
  const [source,  setSource]  = useState('AppService');
  const [message, setMessage] = useState('');
  const [bulkN,   setBulkN]   = useState(100);
  const [lastDur, setLastDur] = useState(null);

  function handleInsert() {
    if (!message.trim()) { addToast('Pesan tidak boleh kosong.', 'error'); return; }
    const { logs: next, duration } = insertLog(logs, { level, source, message });
    setLogs(next);
    setLastDur(duration);
    setMessage('');
    addToast(`Log ditambahkan (ID: ${next[next.length - 1].id})`, 'success', `Waktu: ${duration.toFixed(3)} ms`);
  }

  function handleBulk() {
    if (bulkN < 1 || bulkN > 1_000_000) { addToast('Jumlah harus antara 1–1.000.000', 'error'); return; }
    const { logs: next, duration } = insertBulkRandom(logs, bulkN);
    setLogs(next);
    setLastDur(duration);
    addToast(`${bulkN.toLocaleString()} log acak ditambahkan!`, 'success', `Waktu: ${duration.toFixed(3)} ms`);
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>

      {/* Manual Insert */}
      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={14} /> Insert Log Manual
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label>Level</label>
            <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label>Source</label>
            <select className="input" value={source} onChange={e => setSource(e.target.value)}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label>Message</label>
          <input
            className="input" value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInsert()}
            placeholder="Tulis pesan log..."
          />
        </div>
        <button className="btn btn-primary" onClick={handleInsert} style={{ width: '100%', justifyContent: 'center' }}>
          <Plus size={14} /> Tambah Log
        </button>
        {lastDur !== null && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={10} /> Waktu eksekusi terakhir: {lastDur.toFixed(3)} ms
          </div>
        )}
      </div>

      {/* Bulk Insert */}
      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shuffle size={14} /> Insert Log Acak (Bulk)
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label>Jumlah Log</label>
            <input
              className="input" type="number" min={1} max={1000000}
              value={bulkN} onChange={e => setBulkN(Number(e.target.value))}
            />
          </div>
          <button className="btn btn-secondary" onClick={handleBulk} style={{ flexShrink: 0 }}>
            <Shuffle size={14} /> Generate
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Level: INFO / WARNING / ERROR (acak) · Source: AppService, Database, AuthService, Network
        </div>
      </div>

    </div>
  );
}
