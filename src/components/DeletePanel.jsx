import React, { useState } from 'react';
import { Trash2, AlertTriangle, Clock } from 'lucide-react';
import { deleteOldLogs, now, formatTimestamp } from '../utils/logStore';

export default function DeletePanel({ logs, setLogs, addToast }) {
  const [threshold, setThreshold] = useState('');
  const [duration,  setDuration]  = useState(null);
  const [deleted,   setDeleted]   = useState(null);
  const [confirm,   setConfirm]   = useState(false);

  const oldestTs = logs.length ? logs[0].timestamp : null;
  const newestTs = logs.length ? logs[logs.length - 1].timestamp : null;

  function preview() {
    const ts = parseInt(threshold);
    if (isNaN(ts)) return 0;
    return logs.filter(l => l.timestamp < ts).length;
  }

  function fill30Percent() {
    if (!logs.length) return;
    const baseTs = logs[0].timestamp;
    const span   = (logs[logs.length - 1].timestamp - baseTs) * 0.3;
    setThreshold(String(Math.floor(baseTs + span)));
  }

  function handleDelete() {
    const ts = parseInt(threshold);
    if (isNaN(ts)) { addToast('Threshold harus berupa Unix timestamp.', 'error'); return; }
    const { logs: next, deleted: d, duration: dur } = deleteOldLogs(logs, ts);
    setLogs(next);
    setDeleted(d);
    setDuration(dur);
    setConfirm(false);
    addToast(`${d} log lama dihapus.`, 'success', `Waktu: ${dur.toFixed(3)} ms`);
  }

  const previewCount = preview();

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Info bar */}
      {logs.length > 0 && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px 16px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Log Tertua</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{formatTimestamp(oldestTs)}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Log Terbaru</div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{formatTimestamp(newestTs)}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trash2 size={14} /> Hapus Log Lama (Delete Old Logs)
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label>Batas Waktu / Threshold (Unix Timestamp)</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="input" type="number" value={threshold} onChange={e => { setThreshold(e.target.value); setConfirm(false); }} placeholder="1700000000" />
            <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={fill30Percent}>
              <Clock size={11} /> 30%
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={() => setThreshold(String(now()))}>
              Sekarang
            </button>
          </div>
          <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Semua log sebelum timestamp ini akan dihapus.
          </div>
        </div>

        {threshold && !isNaN(parseInt(threshold)) && (
          <div style={{
            background: previewCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${previewCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
            borderRadius: '6px', padding: '10px 12px', marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px',
          }}>
            <AlertTriangle size={13} color={previewCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)'} />
            <span style={{ color: previewCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
              {previewCount > 0
                ? `${previewCount.toLocaleString()} log akan dihapus (dari ${logs.length.toLocaleString()} total)`
                : 'Tidak ada log yang memenuhi threshold ini.'}
            </span>
          </div>
        )}

        {!confirm ? (
          <button
            className="btn btn-danger"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={!threshold || previewCount === 0}
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={14} /> Hapus Log Lama
          </button>
        ) : (
          <div>
            <div style={{ fontSize: '12px', color: 'var(--accent-red)', marginBottom: '10px', textAlign: 'center', fontWeight: 500 }}>
              ⚠ Yakin hapus {previewCount.toLocaleString()} log? Tindakan ini tidak dapat dibatalkan.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirm(false)}>
                Batal
              </button>
              <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDelete}>
                <Trash2 size={14} /> Ya, Hapus
              </button>
            </div>
          </div>
        )}

        {duration !== null && deleted !== null && (
          <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
            ✓ {deleted} log dihapus · Waktu: {duration.toFixed(3)} ms
          </div>
        )}
      </div>
    </div>
  );
}
