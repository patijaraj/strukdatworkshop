import React, { useState, useRef } from 'react';
import { Zap, Play, Download, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { runBenchmark, exportBenchmarkCSV, downloadCSV } from '../utils/logStore';

const PRESET_SIZES = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];

const METRICS = [
  { key: 'insertDuration',       label: 'Insert',         color: '#3b82f6' },
  { key: 'searchTimeDuration',   label: 'Search (Time)',  color: '#06b6d4' },
  { key: 'searchLevelDuration',  label: 'Search (Level)', color: '#f59e0b' },
  { key: 'searchSourceDuration', label: 'Search (Source)',color: '#8b5cf6' },
  { key: 'deleteDuration',       label: 'Delete',         color: '#ef4444' },
];

export default function BenchmarkPanel({ addToast }) {
  const [mode,      setMode]      = useState('preset');
  const [customN,   setCustomN]   = useState(500000);
  const [running,   setRunning]   = useState(false);
  const [results,   setResults]   = useState(null);
  const [progress,  setProgress]  = useState(0);
  const [expanded,  setExpanded]  = useState(false);
  const abortRef = useRef(false);

  async function handleRun() {
    const sizes = mode === 'preset' ? PRESET_SIZES : [customN];
    abortRef.current = false;
    setRunning(true);
    setResults(null);
    setProgress(0);

    // Run in chunks to not block UI
    const res = [];
    for (let i = 0; i < sizes.length; i++) {
      if (abortRef.current) break;
      await new Promise(r => setTimeout(r, 0)); // yield to UI
      const chunk = runBenchmark([sizes[i]]);
      res.push(chunk[0]);
      setProgress(Math.round(((i + 1) / sizes.length) * 100));
    }
    setResults(res);
    setRunning(false);
    addToast(`Benchmark selesai! ${res.length} ukuran data diuji.`, 'success');
  }

  function handleExport() {
    if (!results) return;
    downloadCSV(exportBenchmarkCSV(results), `benchmark_results_${Date.now()}.csv`);
  }

  // Prepare chart data — log scale labels
  const chartData = results?.map(r => ({
    n: r.n >= 1000000 ? '1M' : r.n >= 1000 ? `${r.n/1000}K` : String(r.n),
    ...Object.fromEntries(METRICS.map(m => [m.label, r[m.key]])),
  })) ?? [];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} color="var(--accent-yellow)" /> Benchmark · Analisis Performa
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button className={`btn btn-sm ${mode==='preset'?'btn-primary':'btn-secondary'}`} onClick={() => setMode('preset')}>Preset (1 – 1M)</button>
          <button className={`btn btn-sm ${mode==='custom'?'btn-primary':'btn-secondary'}`} onClick={() => setMode('custom')}>Custom</button>
        </div>

        {mode === 'custom' && (
          <div style={{ marginBottom: '14px' }}>
            <label>Jumlah Data Kustom</label>
            <input className="input" type="number" min={1} max={1000000} value={customN} onChange={e => setCustomN(Number(e.target.value))} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={handleRun} disabled={running} style={{ flex: 1, justifyContent: 'center' }}>
            {running ? `Running… ${progress}%` : <><Play size={14} /> Jalankan Benchmark</>}
          </button>
          {results && (
            <button className="btn btn-success btn-sm" onClick={handleExport}>
              <Download size={13} /> CSV
            </button>
          )}
        </div>

        {running && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-blue)', transition: 'width 0.3s', borderRadius: '2px' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{progress}%</div>
          </div>
        )}
      </div>

      {results && (
        <>
          {/* Chart */}
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Waktu Eksekusi vs Jumlah Data (ms)
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="n" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(v) => `${v.toFixed(3)} ms`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {METRICS.map(m => (
                  <Line key={m.key} type="monotone" dataKey={m.label} stroke={m.color} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => setExpanded(x => !x)}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tabel Hasil Benchmark ({results.length} baris)</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
            {expanded && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)' }}>
                      {['N', 'Insert (ms)', 'Srch Time (ms)', 'Srch Level (ms)', 'Srch Source (ms)', 'Delete (ms)', 'Memori (bytes)'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '10px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(30,58,95,0.4)' }}>
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 600 }}>{r.n.toLocaleString()}</td>
                        {['insertDuration','searchTimeDuration','searchLevelDuration','searchSourceDuration','deleteDuration'].map(k => (
                          <td key={k} style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{r[k].toFixed(3)}</td>
                        ))}
                        <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{r.memoryUsed.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
