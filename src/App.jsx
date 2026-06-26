import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Plus, Search, Trash2,
  Zap, List, Download,
} from 'lucide-react';
import { loadLogs, exportLogsCSV, downloadCSV } from './utils/logStore';
import Header       from './components/Header';
import InsertPanel  from './components/InsertPanel';
import SearchPanel  from './components/SearchPanel';
import DeletePanel  from './components/DeletePanel';
import StatsPanel   from './components/StatsPanel';
import BenchmarkPanel from './components/BenchmarkPanel';
import LogTable     from './components/LogTable';
import { Toast, useToast } from './components/Toast';

const TABS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'all',       label: 'Semua Log',  icon: List },
  { id: 'insert',    label: 'Insert',     icon: Plus },
  { id: 'search',    label: 'Search',     icon: Search },
  { id: 'delete',    label: 'Delete',     icon: Trash2 },
  { id: 'benchmark', label: 'Benchmark',  icon: Zap },
];

export default function App() {
  const [logs,       setLogs]   = useState([]);
  const [activeTab,  setActive] = useState('dashboard');
  const { toasts, add, remove } = useToast();

  useEffect(() => {
    setLogs(loadLogs());
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Header logCount={logs.length} />

      {/* Sidebar + Content layout */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        {/* Sidebar */}
        <nav style={{
          width: '200px', flexShrink: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          padding: '12px 8px',
          display: 'flex', flexDirection: 'column', gap: '2px',
          position: 'sticky', top: '56px', height: 'calc(100vh - 56px)',
          overflowY: 'auto',
        }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '6px',
                  border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: active ? 600 : 400,
                  width: '100%', textAlign: 'left',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={e => !active && (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => !active && (e.currentTarget.style.background = 'transparent')}
              >
                <Icon size={15} />
                {t.label}
                {t.id === 'benchmark' && (
                  <span style={{ marginLeft: 'auto', fontSize: '9px', background: 'rgba(245,158,11,0.2)', color: 'var(--accent-yellow)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>NEW</span>
                )}
              </button>
            );
          })}

          {/* Bottom: export all */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              onClick={() => downloadCSV(exportLogsCSV(logs), `logs_${Date.now()}.csv`)}
              disabled={logs.length === 0}
            >
              <Download size={12} /> Export All CSV
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto', maxWidth: 'calc(100vw - 200px)' }}>

          {/* Page title */}
          <div style={{ marginBottom: '20px' }}>
            {(() => {
              const t = TABS.find(t => t.id === activeTab);
              const Icon = t.icon;
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color="var(--accent-blue)" />
                  <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}</h1>
                </div>
              );
            })()}
          </div>

          {activeTab === 'dashboard' && (
            <StatsPanel logs={logs} />
          )}

          {activeTab === 'all' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {logs.length.toLocaleString()} log tersimpan
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Klik header kolom untuk sort
                </span>
              </div>
              <LogTable logs={logs} />
            </div>
          )}

          {activeTab === 'insert' && (
            <InsertPanel logs={logs} setLogs={setLogs} addToast={add} />
          )}

          {activeTab === 'search' && (
            <SearchPanel logs={logs} addToast={add} />
          )}

          {activeTab === 'delete' && (
            <DeletePanel logs={logs} setLogs={setLogs} addToast={add} />
          )}

          {activeTab === 'benchmark' && (
            <BenchmarkPanel addToast={add} />
          )}
        </main>
      </div>

      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}
