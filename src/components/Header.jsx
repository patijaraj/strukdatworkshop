import React from 'react';
import { Activity, Database } from 'lucide-react';

export default function Header({ logCount }) {
  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Activity size={16} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            SysLog Monitor
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            Kelompok 9 · Paralel 2 · IPB University
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Live</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'var(--bg-card)', borderRadius: '6px',
          padding: '4px 10px', border: '1px solid var(--border)',
        }}>
          <Database size={12} color="var(--accent-blue)" />
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-code)' }}>
            {logCount.toLocaleString()} logs
          </span>
        </div>
      </div>
    </header>
  );
}
