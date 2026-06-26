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

// ── Binary search lower-bound (mirrors C++ std::lower_bound) ──
function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].timestamp < target) lo = mid + 1;
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

// ── Deque Class (mirrors C++ std::deque) ─────────────────────
// Menggunakan circular buffer dengan blok-blok kecil untuk
// efisiensi push_front/push_back tanpa shift seperti Array.
// Delete dari depan (erase begin..it) adalah O(K), bukan O(N).

export class Deque {
  constructor() {
    this._blocks   = [new Array(64)];
    this._blockSize = 64;
    this._startBlock = 0;
    this._startIdx   = 32; // mulai di tengah blok pertama
    this._endBlock   = 0;
    this._endIdx     = 32;
    this.length      = 0;
  }

  push_back(item) {
    this._blocks[this._endBlock][this._endIdx] = item;
    this.length++;
    this._endIdx++;
    if (this._endIdx >= this._blockSize) {
      this._endBlock++;
      this._endIdx = 0;
      if (this._endBlock >= this._blocks.length) {
        this._blocks.push(new Array(this._blockSize));
      }
    }
  }

  // Akses elemen ke-i secara O(1)
  at(i) {
    const absIdx = (this._startIdx + i);
    const blockOff = Math.floor(absIdx / this._blockSize);
    const idxInBlock = absIdx % this._blockSize;
    return this._blocks[this._startBlock + blockOff][idxInBlock];
  }

  // Hapus K elemen dari depan — O(K), tidak ada shift
  eraseFromFront(k) {
    this.length -= k;
    const absIdx = this._startIdx + k;
    const blockOff = Math.floor(absIdx / this._blockSize);
    this._startBlock += blockOff;
    this._startIdx = absIdx % this._blockSize;
  }

  clear() {
    this._blocks    = [new Array(this._blockSize)];
    this._startBlock = 0;
    this._startIdx   = 32;
    this._endBlock   = 0;
    this._endIdx     = 32;
    this.length      = 0;
  }

  // Buat array sementara untuk lowerBound (tidak mengubah data)
  _toIterableProxy() {
    return { length: this.length, at: (i) => this.at(i) };
  }
}

// lowerBound versi Deque (akses via .at())
function lowerBoundDeque(deq, target) {
  let lo = 0, hi = deq.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (deq.at(mid).timestamp < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

// ── benchmarkStructure: jalankan semua operasi pada 1 struktur ──
function benchmarkStructure(structName, n) {
  const baseTs = Math.floor(Date.now() / 1000) - n;

  // 1. Insert
  const t0ins = performance.now();
  let container; // array biasa atau Deque

  if (structName === 'Vector') {
    container = [];
    for (let i = 0; i < n; i++) {
      container.push({
        id: i + 1,
        timestamp: baseTs + i,
        level: i % 3 === 0 ? 'ERROR' : 'INFO',
        source: 'AppService',
        message: 'Dummy Log',
      });
    }
  } else {
    container = new Deque();
    for (let i = 0; i < n; i++) {
      container.push_back({
        id: i + 1,
        timestamp: baseTs + i,
        level: i % 3 === 0 ? 'ERROR' : 'INFO',
        source: 'AppService',
        message: 'Dummy Log',
      });
    }
  }
  const insertDuration = performance.now() - t0ins;

  // 2a. Search by Time (biner, 10% dari tengah)
  const searchStart = baseTs + Math.floor(n / 2);
  const searchEnd   = searchStart + Math.floor(n * 0.1);
  const t1 = performance.now();
  let fc = 0;
  if (structName === 'Vector') {
    const idxS = lowerBound(container, searchStart);
    for (let i = idxS; i < container.length && container[i].timestamp <= searchEnd; i++) fc++;
  } else {
    const idxS = lowerBoundDeque(container, searchStart);
    for (let i = idxS; i < container.length && container.at(i).timestamp <= searchEnd; i++) fc++;
  }
  const searchTimeDuration = performance.now() - t1;

  // 2b. Search by Level (linear)
  const t2 = performance.now();
  let ec = 0;
  if (structName === 'Vector') {
    for (const l of container) { if (l.level === 'ERROR') ec++; }
  } else {
    for (let i = 0; i < container.length; i++) { if (container.at(i).level === 'ERROR') ec++; }
  }
  const searchLevelDuration = performance.now() - t2;

  // 2c. Search by Source (linear)
  const t3 = performance.now();
  let sc = 0;
  if (structName === 'Vector') {
    for (const l of container) { if (l.source === 'AppService') sc++; }
  } else {
    for (let i = 0; i < container.length; i++) { if (container.at(i).source === 'AppService') sc++; }
  }
  const searchSourceDuration = performance.now() - t3;

  // 3. Delete 30% terlama dari depan
  const delThreshold = baseTs + Math.floor(n * 0.3);
  const t4 = performance.now();
  if (structName === 'Vector') {
    // Array: O(N) — harus shift semua elemen sisa ke kiri
    const delIdx = lowerBound(container, delThreshold);
    container.splice(0, delIdx);
  } else {
    // Deque: O(K) — cukup geser pointer depan, tidak ada shift
    const delIdx = lowerBoundDeque(container, delThreshold);
    container.eraseFromFront(delIdx);
  }
  const deleteDuration = performance.now() - t4;

  // Estimasi memori sisa (~128 bytes per objek log)
  const memoryUsed = container.length * 128;

  return {
    struct: structName,
    n,
    insertDuration:      +insertDuration.toFixed(3),
    searchTimeDuration:  +searchTimeDuration.toFixed(3),
    searchLevelDuration: +searchLevelDuration.toFixed(3),
    searchSourceDuration:+searchSourceDuration.toFixed(3),
    deleteDuration:      +deleteDuration.toFixed(3),
    memoryUsed,
  };
}

// ── runBenchmark: jalankan Vector & Deque per ukuran data ─────
export function runBenchmark(sizes) {
  const results = [];
  for (const n of sizes) {
    results.push(benchmarkStructure('Vector', n));
    results.push(benchmarkStructure('Deque',  n));
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
  const header = 'StrukturData,JumlahData,WaktuInsert(ms),WaktuSearchTime(ms),WaktuSearchLevel(ms),WaktuSearchSource(ms),WaktuDelete(ms),EstimasiMemori(bytes)\n';
  const rows = results.map(r =>
    `${r.struct},${r.n},${r.insertDuration},${r.searchTimeDuration},${r.searchLevelDuration},${r.searchSourceDuration},${r.deleteDuration},${r.memoryUsed}`
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
