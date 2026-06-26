import React from 'react';

export default function StatCard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: '6px',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={14} color={color} />
          </div>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
      )}
    </div>
  );
}
