import React, { useState, useRef } from 'react';
import { Zap, Play, Download, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { runBenchmark, exportBenchmarkCSV, downloadCSV } from '../utils/logStore';

const PRESET_SIZES = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];

// Setiap metrik punya 2 warna: Vector (solid) dan Deque (lebih terang/putus-putus)
const METRICS = [
  { key: 'insertDuration',        label: 'Insert',          colorV: '#3b82f6', colorD: '#93c5fd' },
  { key: 'searchTimeDuration',    label: 'Search (Time)',   colorV: '#06b6d4', colorD: '#67e8f9' },
  { key: 'searchLevelDuration',   label: 'Search (Level)',  colorV: '#f59e0b', colorD: '#fcd34d' },
  { key: 'searchSourceDuration',  label: 'Search (Source)', colorV: '#8b5cf6', colorD: '#c4b5fd' },
  { key: 'deleteDuration',        label: 'Delete',          colorV: '#ef4444', colorD: '#fca5a5' },
];

const nLabel = (n) => n >= 1000000 ? '1M' : n >= 1000 ? `${n/1000}K` : String(n);

export default function BenchmarkPanel({ addToast }) {
  const [mode,     setMode]     = useState('preset');
  const [customN,  setCustomN]  = useState(500000);
  const [running,  setRunning]  = useState(false);
  const [results,  setResults]  = useState(null);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [activeMetric, setActiveMetric] = useState('deleteDuration');
  const abortRef = useRef(false);

  async function handleRun() {
    const sizes = mode === 'preset' ? PRESET_SIZES : [customN];
    abortRef.current = false;
    setRunning(true);
    setResults(null);
    setProgress(0);

    const res = [];
    for (let i = 0; i < sizes.length; i++) {
      if (abortRef.current) break;
      await new Promise(r => setTimeout(r, 0));
      // runBenchmark([n]) mengembalikan 2 baris: Vector & Deque
      const chunk = runBenchmark([sizes[i]]);
      res.push(...chunk);
      setProgress(Math.round(((i + 1) / sizes.length) * 100));
    }
    setResults(res);
    setRunning(false);
    addToast(`Benchmark selesai! ${sizes.length} ukuran × 2 struktur data diuji.`, 'success');
  }

  function handleExport() {
    if (!results) return;
    downloadCSV(exportBenchmarkCSV(results), `benchmark_results_${Date.now()}.csv`);
  }

  // Pisahkan hasil Vector dan Deque
  const vectorResults = results?.filter(r => r.struct === 'Vector') ?? [];
  const dequeResults  = results?.filter(r => r.struct === 'Deque')  ?? [];

  // Gabungkan untuk grafik: satu titik per n, tapi pisahkan label
  const chartData = vectorResults.map((vr, i) => {
    const dr = dequeResults[i];
    const obj = { n: nLabel(vr.n) };
    METRICS.forEach(m => {
      obj[`Vector – ${m.label}`] = vr[m.key];
      obj[`Deque – ${m.label}`]  = dr ? dr[m.key] : null;
    });
    return obj;
  });

  // Untuk grafik fokus: hanya tampilkan 1 metrik yang dipilih (lebih mudah dibaca)
  const focusChartData = vectorResults.map((vr, i) => {
    const dr = dequeResults[i];
    return {
      n: nLabel(vr.n),
      Vector: vr[activeMetric],
      Deque:  dr ? dr[activeMetric] : null,
    };
  });

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* ── Control Card ── */}
      <div className="card">
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} color="var(--accent-yellow)" /> Benchmark · Vector vs Deque
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', padding: '8px 10px', background: 'rgba(59,130,246,0.08)', borderRadius: '6px', borderLeft: '3px solid var(--accent-blue)' }}>
          Setiap ukuran data diuji <strong style={{ color: 'var(--text-primary)' }}>dua kali</strong>: sekali pakai <strong style={{ color: '#93c5fd' }}>Vector (Array)</strong> dan sekali pakai <strong style={{ color: '#67e8f9' }}>Deque</strong> — seperti program C++ aslinya.
        </div>

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
          {/* ── Grafik Fokus: 1 metrik, 2 garis ── */}
          <div className="card">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Grafik Perbandingan Vector vs Deque (ms)
            </div>

            {/* Metric selector */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {METRICS.map(m => (
                <button
                  key={m.key}
                  className={`btn btn-sm ${activeMetric === m.key ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveMetric(m.key)}
                  style={{ fontSize: '11px' }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={focusChartData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="n" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '6px', fontSize: '12px' }}
                  formatter={(v) => `${v != null ? v.toFixed(3) : '-'} ms`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone" dataKey="Vector" name="Vector (Array)"
                  stroke={METRICS.find(m => m.key === activeMetric)?.colorV ?? '#3b82f6'}
                  dot={false} strokeWidth={2}
                />
                <Line
                  type="monotone" dataKey="Deque" name="Deque"
                  stroke={METRICS.find(m => m.key === activeMetric)?.colorD ?? '#93c5fd'}
                  dot={false} strokeWidth={2} strokeDasharray="5 3"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Keterangan perbedaan utama */}
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { title: 'Vector (Array)', color: '#3b82f6', note: 'Delete dari depan: O(N) — semua elemen sisa di-shift ke kiri. Insert/Search sama cepatnya.' },
                { title: 'Deque', color: '#93c5fd', note: 'Delete dari depan: O(K) — hanya geser pointer, tanpa shift. Lebih efisien untuk hapus log lama.' },
              ].map(c => (
                <div key={c.title} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: c.color, marginBottom: '4px' }}>{c.title}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{c.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabel hasil ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onClick={() => setExpanded(x => !x)}
            >
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Tabel Hasil Benchmark ({vectorResults.length} ukuran × 2 struktur = {results.length} baris)
              </span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
            {expanded && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface)' }}>
                      {['Struktur', 'N', 'Insert (ms)', 'Srch Time (ms)', 'Srch Level (ms)', 'Srch Source (ms)', 'Delete (ms)', 'Memori (bytes)'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '10px', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const isVector = r.struct === 'Vector';
                      const isLastInGroup = !isVector; // Deque = baris ke-2 dari pasangan
                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: isLastInGroup
                              ? '2px solid rgba(30,58,95,0.6)'
                              : '1px solid rgba(30,58,95,0.2)',
                            background: isVector ? 'transparent' : 'rgba(59,130,246,0.04)',
                          }}
                        >
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: isVector ? '#93c5fd' : '#67e8f9', fontWeight: 700 }}>
                            {r.struct}
                          </td>
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--accent-cyan)', fontWeight: 600 }}>{r.n.toLocaleString()}</td>
                          {['insertDuration','searchTimeDuration','searchLevelDuration','searchSourceDuration','deleteDuration'].map(k => (
                            <td key={k} style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-primary)' }}>{r[k].toFixed(3)}</td>
                          ))}
                          <td style={{ padding: '7px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>{r.memoryUsed.toLocaleString()}</td>
                        </tr>
                      );
                    })}
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
