import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Calculator,
  LayoutDashboard,
  ClipboardList,
  Target,
  History as HistoryIcon,
  Save,
  Clock,
  Calendar,
  X,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CargoEntry {
  id: string;
  compartment: number;
  reference: string;
  pieces: number;
  avgWeight: number;
}

interface SavedSession {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  entries: CargoEntry[];
  totalWeight: number;
}

const COMPARTMENT_COLORS: Record<number, string> = {
  1: 'from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20',
  2: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
  3: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  4: 'from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20',
  5: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20',
};

const COMPARTMENT_SOLID_COLORS: Record<number, string> = {
  1: 'bg-sky-500',
  2: 'bg-emerald-500',
  3: 'bg-amber-500',
  4: 'bg-violet-500',
  5: 'bg-rose-500',
};

export default function App() {
  const [entries, setEntries] = useState<CargoEntry[]>(() => {
    const saved = localStorage.getItem('cargo-entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<SavedSession[]>(() => {
    const saved = localStorage.getItem('cargo-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentStep, setCurrentStep] = useState<'input' | 'summary' | 'history'>('input');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ title: '', description: '' });

  // Form State
  const [form, setForm] = useState({
    compartment: 1,
    reference: '',
    pieces: '',
    avgWeight: ''
  });

  useEffect(() => {
    localStorage.setItem('cargo-entries', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('cargo-history', JSON.stringify(history));
  }, [history]);

  const addEntry = () => {
    if (entries.length >= 12) return alert('Maximum 12 entries reached');
    if (!form.reference || !form.pieces || !form.avgWeight) return alert('Please fill all fields');
    if (form.reference.length !== 6) return alert('Reference must be 6 digits');

    const newEntry: CargoEntry = {
      id: crypto.randomUUID(),
      compartment: Number(form.compartment),
      reference: form.reference,
      pieces: Number(form.pieces),
      avgWeight: Number(form.avgWeight)
    };

    setEntries([...entries, newEntry]);
    setForm({ ...form, reference: '', pieces: '', avgWeight: '' });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const clearAll = () => {
    if (confirm('Clear all current data?')) setEntries([]);
  };

  const compartmentStats = useMemo(() => {
    const stats: Record<number, { weight: number; pieces: number }> = {
      1: { weight: 0, pieces: 0 },
      2: { weight: 0, pieces: 0 },
      3: { weight: 0, pieces: 0 },
      4: { weight: 0, pieces: 0 },
      5: { weight: 0, pieces: 0 }
    };
    entries.forEach(e => {
      stats[e.compartment].weight += e.pieces * e.avgWeight;
      stats[e.compartment].pieces += e.pieces;
    });
    return stats;
  }, [entries]);

  const totalWeight = Object.values(compartmentStats).reduce((a, b) => a + b.weight, 0);
  const totalPieces = Object.values(compartmentStats).reduce((a, b) => a + b.pieces, 0);

  const handleSaveSession = () => {
    if (!saveForm.title) return alert('Please enter a title');

    const newSession: SavedSession = {
      id: crypto.randomUUID(),
      title: saveForm.title,
      description: saveForm.description,
      timestamp: new Date().toISOString(),
      entries: [...entries],
      totalWeight
    };

    setHistory([newSession, ...history]);
    setShowSaveModal(false);
    setSaveForm({ title: '', description: '' });
    if (confirm('Session saved! Clear current data for a new session?')) {
      setEntries([]);
      setCurrentStep('history');
    }
  };

  const loadSession = (session: SavedSession) => {
    if (entries.length > 0 && !confirm('Discard current data and load this session?')) return;
    setEntries(session.entries);
    setCurrentStep('summary');
  };

  const deleteHistory = (id: string) => {
    if (confirm('Delete this saved session?')) {
      setHistory(history.filter(s => s.id !== id));
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-24 overflow-x-hidden bg-[#050505]">
      {/* Header */}
      <header className="px-6 pt-8 pb-4 sticky top-0 bg-[#050505]/80 backdrop-blur-xl z-20">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">CargoWeigh</h1>
          </div>
          <button
            onClick={clearAll}
            className="text-white/40 hover:text-rose-400 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            Reset
          </button>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.2em]">Aviation Cargo Tool</p>
          <div className="flex items-center gap-1">
            <div className={cn("w-1.5 h-1.5 rounded-full", entries.length > 0 ? "bg-emerald-500 animate-pulse" : "bg-white/10")} />
            <span className="text-[10px] text-white/40 font-bold uppercase">{entries.length}/12 Slots</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6">
        <AnimatePresence mode="wait">
          {currentStep === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="glass-card p-6 space-y-4 border-white/5 bg-white/[0.02]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] ml-1">Compartment</label>
                    <select
                      value={form.compartment}
                      onChange={e => setForm({ ...form, compartment: Number(e.target.value) })}
                      className={cn(
                        "input-field appearance-none bg-black/40 border-white/5",
                        form.compartment && COMPARTMENT_COLORS[Number(form.compartment)].split(' ')[1]
                      )}
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] ml-1">Ref ID (6 Digits)</label>
                    <input
                      type="number"
                      placeholder="000000"
                      value={form.reference}
                      onChange={e => setForm({ ...form, reference: e.target.value.slice(0, 6) })}
                      className="input-field bg-black/40 border-white/5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] ml-1">Quantity/Pieces</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.pieces}
                      onChange={e => setForm({ ...form, pieces: e.target.value })}
                      className="input-field bg-black/40 border-white/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] ml-1">Avg Unit Weight</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={form.avgWeight}
                      onChange={e => setForm({ ...form, avgWeight: e.target.value })}
                      className="input-field bg-black/40 border-white/5"
                    />
                  </div>
                </div>

                <button
                  onClick={addEntry}
                  disabled={entries.length >= 12}
                  className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-20 font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  ADD ENTRY
                </button>
              </div>

              {/* Entry List */}
              <div className="space-y-3 pb-8">
                <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                  <ClipboardList className="w-3 h-3" />
                  Cargo Registry
                </h2>
                {entries.length === 0 ? (
                  <div className="py-16 text-center text-white/10 border-2 border-dashed border-white/[0.03] rounded-3xl">
                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Input Data</p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "glass-card p-4 flex items-center justify-between group border-l-4",
                        COMPARTMENT_COLORS[entry.compartment].split(' ').pop() || "border-white/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black border",
                          COMPARTMENT_COLORS[entry.compartment]
                        )}>
                          {entry.compartment}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white tracking-wide">ID: {entry.reference}</p>
                          <p className="text-[10px] font-bold text-white/30 uppercase">
                            {entry.pieces} pcs × {entry.avgWeight} kg
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{(entry.pieces * entry.avgWeight).toLocaleString()} <span className="text-[10px] text-white/30 uppercase">kg</span></p>
                        </div>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="p-2 text-white/10 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )).reverse()
                )}
              </div>
            </motion.div>
          ) : currentStep === 'summary' ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              {/* Grand Total */}
              <div className="bg-sky-500 rounded-[2.5rem] p-10 shadow-2xl shadow-sky-500/20 text-white relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 opacity-10">
                  <Calculator size={200} />
                </div>
                <div className="relative z-10">
                  <p className="text-sky-100/60 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Total Cargo Load</p>
                  <div className="flex items-baseline gap-2 mb-6">
                    <h2 className="text-6xl font-black tracking-tighter">{totalWeight.toLocaleString()}</h2>
                    <span className="text-sky-200/60 font-bold uppercase text-xl">kg</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sky-100/40 text-[10px] font-black uppercase tracking-widest mb-1">Total Items</p>
                      <p className="text-2xl font-black">{totalPieces.toLocaleString()} <span className="text-xs font-bold text-sky-100/40">PCS</span></p>
                    </div>
                    <div className="w-[1px] h-8 bg-white/10" />
                    <div>
                      <p className="text-sky-100/40 text-[10px] font-black uppercase tracking-widest mb-1">Load Factor</p>
                      <p className="text-2xl font-black">{entries.length} <span className="text-xs font-bold text-sky-100/40">SLOTS</span></p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                    <Target className="w-3 h-3" />
                    Zone Distribution
                  </h2>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    disabled={entries.length === 0}
                    className="flex items-center gap-1.5 text-sky-400 font-black text-[10px] uppercase tracking-widest bg-sky-400/10 px-3 py-1.5 rounded-full border border-sky-400/20 active:scale-95 transition-all disabled:opacity-20"
                  >
                    <Save size={10} />
                    Save Report
                  </button>
                </div>

                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="glass-card p-5 flex items-center justify-between overflow-hidden relative border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn("text-3xl font-black opacity-10", (COMPARTMENT_COLORS[n] || '').split(' ').pop()?.replace('border-', 'text-'))}>{n}</div>
                      <div>
                        <p className="text-sm font-black text-white tracking-wide">Compartment {n}</p>
                        <p className="text-[10px] font-bold text-white/30 uppercase">
                          {entries.filter(e => e.compartment === n).length} Items • {compartmentStats[n].pieces} pieces
                        </p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <p className="text-xl font-black text-white">
                        {compartmentStats[n].weight.toLocaleString()}
                        <span className="text-[10px] text-white/30 uppercase ml-1">kg</span>
                      </p>
                    </div>
                    {/* Visual Progress Bar */}
                    <div
                      className={cn("absolute left-0 bottom-0 h-1 transition-all duration-1000", COMPARTMENT_SOLID_COLORS[n] || '', "opacity-30")}
                      style={{ width: `${totalWeight > 0 ? (compartmentStats[n].weight / totalWeight) * 100 : 0}%` }}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pb-8"
            >
              <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                <HistoryIcon className="w-3 h-3" />
                Saved History
              </h2>
              {history.length === 0 ? (
                <div className="py-20 text-center text-white/10 border-2 border-dashed border-white/[0.03] rounded-[2.5rem]">
                  <p className="text-xs font-bold uppercase tracking-widest">No Saved Sessions</p>
                </div>
              ) : (
                history.map((session) => {
                  const { date, time } = formatDate(session.timestamp);
                  return (
                    <div
                      key={session.id}
                      className="glass-card p-6 space-y-4 border-white/5 bg-white/[0.02]"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black text-white tracking-tight">{session.title}</h3>
                          {session.description && (
                            <p className="text-sm text-white/40 mt-1 line-clamp-2 leading-relaxed">{session.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteHistory(session.id)}
                          className="p-2 text-white/10 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 py-3 border-y border-white/[0.03]">
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Calendar size={12} />
                          <span className="text-[10px] font-black uppercase">{date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Clock size={12} />
                          <span className="text-[10px] font-black uppercase">{time}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Total Weight</p>
                          <p className="text-2xl font-black text-white">
                            {session.totalWeight.toLocaleString()} <span className="text-xs font-black text-white/20 uppercase">kg</span>
                          </p>
                        </div>
                        <button
                          onClick={() => loadSession(session)}
                          className="flex items-center gap-1 text-sky-400 font-black text-[10px] uppercase tracking-[0.2em] bg-sky-400/5 px-4 py-2 rounded-xl border border-sky-400/10 active:scale-95 transition-all"
                        >
                          LOAD DATA
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm glass-card p-8 space-y-6 border-white/10 bg-[#0a0a0a] relative z-10"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-white tracking-tight">SAVE SESSION</h2>
                <button onClick={() => setShowSaveModal(false)} className="text-white/20 hover:text-white">
                  <X />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Session Title</label>
                  <input
                    autoFocus
                    placeholder="Flight # / Flight Route"
                    value={saveForm.title}
                    onChange={e => setSaveForm({ ...saveForm, title: e.target.value })}
                    className="input-field bg-white/5 border-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Description (Optional)</label>
                  <textarea
                    placeholder="Additional notes..."
                    value={saveForm.description}
                    onChange={e => setSaveForm({ ...saveForm, description: e.target.value })}
                    className="input-field bg-white/5 border-white/5 min-h-[100px] resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSession}
                className="w-full bg-sky-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-sky-500/20 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
              >
                CONFIRM & SAVE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#050505]/80 backdrop-blur-2xl border-t border-white/5 px-8 pt-4 pb-8 safe-area-bottom z-40">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button
            onClick={() => setCurrentStep('input')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all w-16",
              currentStep === 'input' ? "text-white" : "text-white/20"
            )}
          >
            <div className={cn("p-2 rounded-xl transition-all", currentStep === 'input' && "bg-white/10")}>
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Entry</span>
          </button>

          <button
            onClick={() => setCurrentStep('summary')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all w-16",
              currentStep === 'summary' ? "text-white" : "text-white/20"
            )}
          >
            <div className={cn("p-2 rounded-xl transition-all", currentStep === 'summary' && "bg-sky-500")}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Totals</span>
          </button>

          <button
            onClick={() => setCurrentStep('history')}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all w-16",
              currentStep === 'history' ? "text-white" : "text-white/20"
            )}
          >
            <div className={cn("p-2 rounded-xl transition-all", currentStep === 'history' && "bg-white/10")}>
              <HistoryIcon className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">History</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
