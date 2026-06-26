// ── logStore.js ──
// JS port of the C++ log system logic
// Storage: localStorage (key = "syslog_monitor_logs")

const STORAGE_KEY = 'syslog_monitor_logs';

// ── Persistence ──────────────────────────────────────────────

export function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

// ── Helpers ───────────────────────────────────────────────────

export function getNextId(logs) {
  if (logs.length === 0) return 1;
  return Math.max(...logs.map(l => l.id)) + 1;
}

export function formatTimestamp(ts) {
  return new Date(ts * 1000).toLocaleString('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export function now() {
  return Math.floor(Date.now() / 1000);
}

// ── CRUD Operations (timed, mirrors C++ chrono) ───────────────

export function insertLog(logs, { level, source, message }) {
  const t0 = performance.now();
  const newLog = {
    id: getNextId(logs),
    timestamp: now(),
    level,
    source,
    message,
  };
  const next = [...logs, newLog];
  const duration = performance.now() - t0;
  saveLogs(next);
  return { logs: next, duration, newLog };
}

export function insertBulkRandom(logs, count) {
  const levels   = ['INFO', 'WARNING', 'ERROR'];
  const sources  = ['AppService', 'Database', 'AuthService', 'Network'];
  const messages = [
    'Koneksi terputus', 'User berhasil login',
    'Gagal memuat data', 'Proses selesai', 'Terjadi timeout',
  ];

  const t0 = performance.now();
  let next = [...logs];
  let baseId = getNextId(logs);
  const baseTs = now();

  for (let i = 0; i < count; i++) {
    next.push({
      id: baseId++,
      timestamp: baseTs + i,
      level:   levels[Math.floor(Math.random() * levels.length)],
      source:  sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    });
  }
  const duration = performance.now() - t0;
  saveLogs(next);
  return { logs: next, duration };
}

// Binary search lower-bound (mirrors C++ std::lower_bound)
function lowerBound(logs, target) {
  let lo = 0, hi = logs.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (logs[mid].timestamp < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function searchByTime(logs, startTs, endTs) {
  const t0 = performance.now();
  const idx = lowerBound(logs, startTs);
  const result = [];
  for (let i = idx; i < logs.length && logs[i].timestamp <= endTs; i++) {
    result.push(logs[i]);
  }
  const duration = performance.now() - t0;
  return { result, duration };
}

export function searchByLevel(logs, level) {
  const t0 = performance.now();
  const result = logs.filter(l => l.level === level);
  const duration = performance.now() - t0;
  return { result, duration };
}

export function searchBySource(logs, source) {
  const t0 = performance.now();
  const result = logs.filter(l =>
    l.source.toLowerCase().includes(source.toLowerCase())
  );
  const duration = performance.now() - t0;
  return { result, duration };
}

export function deleteOldLogs(logs, thresholdTs) {
  const t0 = performance.now();
  const idx = lowerBound(logs, thresholdTs);
  const deleted = idx;
  const next = logs.slice(idx);
  const duration = performance.now() - t0;
  saveLogs(next);
  return { logs: next, deleted, duration };
}

export function getStatistics(logs) {
  const stats = { total: logs.length, INFO: 0, WARNING: 0, ERROR: 0 };
  for (const l of logs) {
    if (stats[l.level] !== undefined) stats[l.level]++;
  }
  return stats;
}

// ── Benchmark (mirrors runFullBenchmark) ──────────────────────

export function runBenchmark(sizes) {
  const results = [];

  for (const n of sizes) {
    // Build dataset
    const baseTs = Math.floor(Date.now() / 1000) - n;
    const data = [];
    const t0ins = performance.now();
    for (let i = 0; i < n; i++) {
      data.push({
        id: i + 1,
        timestamp: baseTs + i,
        level: i % 3 === 0 ? 'ERROR' : 'INFO',
        source: 'AppService',
        message: 'Dummy Log',
      });
    }
    const insertDuration = performance.now() - t0ins;

    // Search by Time (10% from midpoint)
    const searchStart = baseTs + Math.floor(n / 2);
    const searchEnd   = searchStart + Math.floor(n * 0.1);
    const t1 = performance.now();
    const idxS = lowerBound(data, searchStart);
    let fc = 0;
    for (let i = idxS; i < data.length && data[i].timestamp <= searchEnd; i++) fc++;
    const searchTimeDuration = performance.now() - t1;

    // Search by Level
    const t2 = performance.now();
    let ec = 0;
    for (const l of data) if (l.level === 'ERROR') ec++;
    const searchLevelDuration = performance.now() - t2;

    // Search by Source
    const t3 = performance.now();
    let sc = 0;
    for (const l of data) if (l.source === 'AppService') sc++;
    const searchSourceDuration = performance.now() - t3;

    // Delete (30% oldest)
    const delThreshold = baseTs + Math.floor(n * 0.3);
    const t4 = performance.now();
    const delIdx = lowerBound(data, delThreshold);
    data.splice(0, delIdx);
    const deleteDuration = performance.now() - t4;

    const memoryUsed = data.length * 128; // ~128 bytes per log object estimate

    results.push({
      n,
      insertDuration:      +insertDuration.toFixed(3),
      searchTimeDuration:  +searchTimeDuration.toFixed(3),
      searchLevelDuration: +searchLevelDuration.toFixed(3),
      searchSourceDuration:+searchSourceDuration.toFixed(3),
      deleteDuration:      +deleteDuration.toFixed(3),
      memoryUsed,
    });
  }
  return results;
}

// ── Export CSV ────────────────────────────────────────────────

export function exportLogsCSV(logs) {
  const header = 'id,timestamp,level,source,message\n';
  const rows = logs.map(l =>
    `${l.id},${l.timestamp},${l.level},${l.source},"${l.message}"`
  ).join('\n');
  return header + rows;
}

export function exportBenchmarkCSV(results) {
  const header = 'JumlahData,WaktuInsert(ms),WaktuSearchTime(ms),WaktuSearchLevel(ms),WaktuSearchSource(ms),WaktuDelete(ms),EstimasiMemori(bytes)\n';
  const rows = results.map(r =>
    `${r.n},${r.insertDuration},${r.searchTimeDuration},${r.searchLevelDuration},${r.searchSourceDuration},${r.deleteDuration},${r.memoryUsed}`
  ).join('\n');
  return header + rows;
}

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
