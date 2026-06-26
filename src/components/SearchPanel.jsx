import React, { useState } from 'react';
import { Search, Clock, Tag, Server } from 'lucide-react';
import { searchByTime, searchByLevel, searchBySource, now } from '../utils/logStore';
import LogTable from './LogTable';

export default function SearchPanel({ logs, addToast }) {
  const [mode,      setMode]      = useState('time'); // time | level | source
  const [startTs,   setStartTs]   = useState('');
  const [endTs,     setEndTs]     = useState('');
  const [level,     setLevel]     = useState('ERROR');
  const [source,    setSource]    = useState('');
  const [results,   setResults]   = useState(null);
  const [duration,  setDuration]  = useState(null);

  function handleSearch() {
    let res;
    if (mode === 'time') {
      const s = parseInt(startTs), e = parseInt(endTs);
      if (isNaN(s) || isNaN(e)) { addToast('Timestamp harus berupa angka (Unix).', 'error'); return; }
      res = searchByTime(logs, s, e);
    } else if (mode === 'level') {
      res = searchByLevel(logs, level);
    } else {
      if (!source.trim()) { addToast('Source tidak boleh kosong.', 'error'); return; }
      res = searchBySource(logs, source.trim());
    }
    setResults(res.result);
    setDuration(res.duration);
    addToast(`Ditemukan ${res.result.length} log.`, 'info', `Waktu: ${res.duration.toFixed(3)} ms`);
  }

  function fillNow() {
    const n = now();
    setStartTs(String(n - 3600));
    setEndTs(String(n));
  }

  const modeBtn = (m, icon, label) => (
    <button
      className={`btn ${mode === m ? 'btn-primary' : 'btn-secondary'}`}
      onClick={() => { setMode(m); setResults(null); }}
      style={{ flex: 1, justifyContent: 'center' }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} /> Pencarian Log
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {modeBtn('time',   <Clock size={13} />,  'By Time')}
          {modeBtn('level',  <Tag size={13} />,    'By Level')}
          {modeBtn('source', <Server size={13} />, 'By Source')}
        </div>

        {mode === 'time' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
              <div>
                <label>Timestamp Awal (Unix)</label>
                <input className="input" type="number" value={startTs} onChange={e => setStartTs(e.target.value)} placeholder="1700000000" />
              </div>
              <div>
                <label>Timestamp Akhir (Unix)</label>
                <input className="input" type="number" value={endTs} onChange={e => setEndTs(e.target.value)} placeholder="1700003600" />
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fillNow} style={{ marginBottom: '12px' }}>
              <Clock size={11} /> Isi 1 jam terakhir
            </button>
          </div>
        )}

        {mode === 'level' && (
          <div style={{ marginBottom: '12px' }}>
            <label>Level</label>
            <select className="input" value={level} onChange={e => setLevel(e.target.value)}>
              {['INFO','WARNING','ERROR'].map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
        )}

        {mode === 'source' && (
          <div style={{ marginBottom: '12px' }}>
            <label>Source (nama modul)</label>
            <input className="input" value={source} onChange={e => setSource(e.target.value)} placeholder="AppService" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSearch} style={{ width: '100%', justifyContent: 'center' }}>
          <Search size={14} /> Cari
        </button>

        {duration !== null && (
          <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', display: 'flex', gap: '16px' }}>
            <span>⏱ Waktu: {duration.toFixed(3)} ms</span>
            <span>📄 Ditemukan: {results?.length ?? 0} log</span>
          </div>
        )}
      </div>

      {results !== null && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Hasil Pencarian · {results.length.toLocaleString()} log
          </div>
          <LogTable logs={results} emptyMsg="Tidak ada log yang cocok." />
        </div>
      )}
    </div>
  );
}
