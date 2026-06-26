import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} color="var(--accent-green)" />,
  error:   <AlertCircle size={16} color="var(--accent-red)" />,
  info:    <Info size={16} color="var(--accent-blue)" />,
};

export function Toast({ toasts, remove }) {
  return (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px',
      display: 'flex', flexDirection: 'column', gap: '8px',
      zIndex: 9999, maxWidth: '360px',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} remove={remove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, remove }) {
  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid var(--border)`,
      borderRadius: '8px',
      padding: '10px 14px',
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.2s ease',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform:none; opacity:1; } }`}</style>
      <div style={{ flexShrink: 0, marginTop: '1px' }}>{icons[toast.type] || icons.info}</div>
      <div style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {toast.message}
        {toast.sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{toast.sub}</div>}
      </div>
      <button onClick={() => remove(toast.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:0, flexShrink:0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

// Hook
let _toastId = 0;
export function useToast() {
  const [toasts, setToasts] = React.useState([]);
  const add = (message, type = 'info', sub) => {
    const id = ++_toastId;
    setToasts(ts => [...ts, { id, message, type, sub }]);
  };
  const remove = (id) => setToasts(ts => ts.filter(t => t.id !== id));
  return { toasts, add, remove };
}
