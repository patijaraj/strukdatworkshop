import React, { useMemo } from 'react';
import { BarChart2, Activity, AlertTriangle, Info, XCircle, Download } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { getStatistics, exportLogsCSV, downloadCSV, formatTimestamp } from '../utils/logStore';
import StatCard from './StatCard';

const COLORS = {
  INFO:    '#06b6d4',
  WARNING: '#f59e0b',
  ERROR:   '#ef4444',
};

export default function StatsPanel({ logs }) {
  const stats = useMemo(() => getStatistics(logs), [logs]);

  // Timeline: bucket logs by hour
  const timeline = useMemo(() => {
    if (!logs.length) return [];
    const buckets = {};
    for (const l of logs) {
      const hour = Math.floor(l.timestamp / 3600) * 3600;
      if (!buckets[hour]) buckets[hour] = { time: hour, INFO: 0, WARNING: 0, ERROR: 0 };
      buckets[hour][l.level] = (buckets[hour][l.level] || 0) + 1;
    }
    const sorted = Object.values(buckets).sort((a, b) => a.time - b.time);
    return sorted.slice(-24).map(b => ({
      ...b,
      label: new Date(b.time * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [logs]);

  const pieData = [
    { name: 'INFO',    value: stats.INFO    },
    { name: 'WARNING', value: stats.WARNING },
    { name: 'ERROR',   value: stats.ERROR   },
  ].filter(d => d.value > 0);

  function handleExport() {
    downloadCSV(exportLogsCSV(logs), `logs_export_${Date.now()}.csv`);
  }

  const errorRate = stats.total > 0 ? ((stats.ERROR / stats.total) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ display: 'grid', gap: '16px' }}>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
        <StatCard label="Total Log"  value={stats.total}   color="var(--accent-blue)"   icon={BarChart2}     sub="semua entri" />
        <StatCard label="INFO"       value={stats.INFO}    color="var(--accent-cyan)"   icon={Info}          sub="informasi normal" />
        <StatCard label="WARNING"    value={stats.WARNING} color="var(--accent-yellow)" icon={AlertTriangle} sub="perlu perhatian" />
        <StatCard label="ERROR"      value={stats.ERROR}   color="var(--accent-red)"    icon={XCircle}       sub={`${errorRate}% error rate`} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Timeline chart */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} /> Timeline Log (per jam, 24 terakhir)
          </div>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeline} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.5)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '6px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="INFO"    stackId="a" fill={COLORS.INFO}    radius={[0,0,0,0]} />
                <Bar dataKey="WARNING" stackId="a" fill={COLORS.WARNING} radius={[0,0,0,0]} />
                <Bar dataKey="ERROR"   stackId="a" fill={COLORS.ERROR}   radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Belum ada data
            </div>
          )}
        </div>

        {/* Pie chart */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Distribusi Level
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a2235', border: '1px solid #1e3a5f', borderRadius: '6px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                {pieData.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[d.name], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{d.name}</span>
                    <span style={{ color: COLORS[d.name], fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {stats.total > 0 ? ((d.value / stats.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Belum ada data
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Export Data Log</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Download semua {stats.total.toLocaleString()} log sebagai file CSV
          </div>
        </div>
        <button className="btn btn-success" onClick={handleExport} disabled={stats.total === 0}>
          <Download size={14} /> Export CSV
        </button>
      </div>

    </div>
  );
}
