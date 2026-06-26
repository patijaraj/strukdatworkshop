import React, { useState } from 'react';
import { formatTimestamp } from '../utils/logStore';
import { ChevronUp, ChevronDown, Minus } from 'lucide-react';

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <Minus size={10} color="var(--text-muted)" />;
  return sortDir === 'asc'
    ? <ChevronUp size={10} color="var(--accent-blue)" />
    : <ChevronDown size={10} color="var(--accent-blue)" />;
}

export default function LogTable({ logs, emptyMsg = 'Tidak ada log untuk ditampilkan.' }) {
  const [sortCol, setSortCol] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage]       = useState(1);
  const PER_PAGE = 50;

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
    setPage(1);
  }

  const sorted = [...logs].sort((a, b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') va = va.toLowerCase(), vb = vb.toLowerCase();
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });

  const total  = sorted.length;
  const pages  = Math.max(1, Math.ceil(total / PER_PAGE));
  const paged  = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const cols = [
    { key: 'id',        label: 'ID',        w: '60px' },
    { key: 'timestamp', label: 'Timestamp', w: '160px' },
    { key: 'level',     label: 'Level',     w: '90px' },
    { key: 'source',    label: 'Source',    w: '130px' },
    { key: 'message',   label: 'Message',   w: 'auto' },
  ];

  if (logs.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '40px',
        color: 'var(--text-muted)', fontSize: '13px',
        fontFamily: 'var(--font-mono)',
      }}>
        {emptyMsg}
      </div>
    );
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)' }}>
              {cols.map(c => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{
                    width: c.w, padding: '8px 12px',
                    textAlign: 'left', cursor: 'pointer',
                    color: sortCol === c.key ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontWeight: 600, fontSize: '10px', letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {c.label}
                    <SortIcon col={c.key} sortCol={sortCol} sortDir={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((log, i) => (
              <tr
                key={log.id}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  borderBottom: '1px solid rgba(30,58,95,0.4)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
              >
                <td style={{ padding: '7px 12px', color: 'var(--text-muted)' }}>{log.id}</td>
                <td style={{ padding: '7px 12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {formatTimestamp(log.timestamp)}
                </td>
                <td style={{ padding: '7px 12px' }}>
                  <span className={`badge badge-${log.level}`}>{log.level}</span>
                </td>
                <td style={{ padding: '7px 12px', color: 'var(--accent-cyan)' }}>{log.source}</td>
                <td style={{ padding: '7px 12px', color: 'var(--text-primary)' }}>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderTop: '1px solid var(--border)',
          fontSize: '12px', color: 'var(--text-secondary)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {((page - 1) * PER_PAGE + 1)}–{Math.min(page * PER_PAGE, total)} of {total.toLocaleString()}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {[...Array(Math.min(7, pages))].map((_, i) => {
              const pg = pages <= 7 ? i + 1 : (
                i === 0 ? 1 : i === 6 ? pages :
                Math.max(2, Math.min(pages - 1, page - 2 + i))
              );
              return (
                <button
                  key={pg}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage(pg)}
                  style={pg === page ? { background: 'var(--accent-blue)', color: 'white', borderColor: 'var(--accent-blue)' } : {}}
                >
                  {pg}
                </button>
              );
            })}
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>→</button>
          </div>
        </div>
      )}
    </div>
  );
}
